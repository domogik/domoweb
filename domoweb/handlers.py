#!/usr/bin/env python
from tornado import web, websocket
from tornado.web import RequestHandler
from domoweb.models import Section, Widget, WidgetInstance
from domoweb.forms import WidgetInstanceForms

import json
import logging
logger = logging.getLogger('domoweb')

import zmq
from domogik.mq.pubsub.subscriber import MQAsyncSub
from domogik.mq.message import MQMessage

socket_connections = []

class MainHandler(RequestHandler):
    def get(self, id):
        if not id:
            id = 1
        section = Section.get(id)
        self.render('index.html',
            section = section)

    def post(self, id):
        if not id:
            id = 1
        logger.info(self.get_argument('sectionName'))
        Section.update(id, self.get_argument('sectionName'), self.get_argument('sectionDescription', None))
        self.redirect ('/%d' % id)

class PageHandler(RequestHandler):
    def post(self):
        name = self.get_argument('name')
        description = self.get_argument('description', None)
        Section.add(name=name, parent_id=1, description=description)

class ConfigurationHandler(RequestHandler):
    def get(self):
        action = self.get_argument('action', None)
        id = self.get_argument('id', None)
        # Widget section box
        if action=='widget':
            instance = WidgetInstance.get(id);
            forms = WidgetInstanceForms(instance=instance)
            self.render('widgetConfiguration.html', instance=instance, forms=forms)

    def post(self):
        action = self.get_argument('action', None)
        id = self.get_argument('id', None)
        if action=='widget':
            instance = WidgetInstance.get(id);
            forms = WidgetInstanceForms(instance=instance, handler=self)
            if forms.validate():
                # do something with form.username or form.email
                forms.save();
                self.write("OK")
            else:
                self.render('widgetConfiguration.html', instance=instance, forms=forms)

class WSHandler(websocket.WebSocketHandler):
    def open(self):
        socket_connections.append(self)
    def on_close(self):
        socket_connections.remove(self)

    def on_message(self, message):
        logger.info("WS: Received message %s" % message)
        jsonmessage = json.loads(message)
        data = {
            'section-get' : self.WSSectionGet,
            'widget-getall' : self.WSWidgetsGetall,
            'widgetinstance-add' : self.WSWidgetInstanceAdd,
            'widgetinstance-remove' : self.WSWidgetInstanceRemove,
            'widgetinstance-getsection' : self.WSWidgetInstanceGetsection,
        }[jsonmessage[0]](jsonmessage[1])
        if (data):
            self.sendMessage(data)

    def WSSectionGet(self, data):
        section = Section.get(data['id'])
        return ['section-detail', to_json(section)]

    def WSWidgetsGetall(self, data):
        widgets = Widget.getAll()
        return ['widget-list', to_json(widgets)]

    def WSWidgetInstanceAdd(self, data):
        i = WidgetInstance.add(section_id=data['section_id'], widget_id=data['widget_id'])
        json = to_json(i)
        json["widget"] = to_json(i.widget)
        return ['widgetinstance-added', json];

    def WSWidgetInstanceRemove(self, data):
        i = WidgetInstance.delete(data['instance_id'])
        json = to_json(i)
        json["widget"] = to_json(i.widget)
        return ['widgetinstance-removed', json];

    def WSWidgetInstanceGetsection(self, data):
        r = WidgetInstance.getSection(section_id=data['section_id'])
        json = {'section_id':data['section_id'], 'instances':to_json(r)}
        for index, item in enumerate(r):
            json['instances'][index]["widget"] = to_json(item.widget)
        return ['widgetinstance-sectionlist', json];

    def sendMessage(self, content):
        data=json.dumps(content)
        logger.info("WS: Sending message %s" % data)
        self.write_message(data)

class NoCacheStaticFileHandler(web.StaticFileHandler):
    def set_extra_headers(self, path):
        # Disable cache
        self.set_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')

class MQHandler(MQAsyncSub):
    def __init__(self):
        MQAsyncSub.__init__(self, zmq.Context(), 'test', ['device-stats'])

    def on_message(self, msgid, content):
        logger.info(u"MQ: New pub message {0}".format(msgid))
        logger.info(u"MQ: {0}".format(content))

        for socket in socket_connections:
            socket.sendMessage(msgid, content)

def to_json(model):
    """ Returns a JSON representation of an SQLAlchemy-backed object.
    """
    if isinstance(model, list):
        jsonm = []
        for m in model:
            jsonm.append(to_json(m))
    else:
        jsonm = {} 
        for col in model._sa_class_manager.mapper.mapped_table.columns:
            jsonm[col.name] = getattr(model, col.name)

    return jsonm