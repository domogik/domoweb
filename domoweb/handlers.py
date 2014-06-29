#!/usr/bin/env python
from tornado import web, websocket
from tornado.web import RequestHandler
from domoweb.models import Section, Widget, DataType, WidgetInstance, WidgetInstanceOption, WidgetInstanceSensor, WidgetInstanceCommand, SectionParam
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
        params = dict ((p.key, p.value) for p in SectionParam.getSection(id))
        self.render('base.html',
            section = section,
            params = params,
            )

class ConfigurationHandler(RequestHandler):
    def get(self):
        action = self.get_argument('action', None)
        id = self.get_argument('id', None)
        # Widget section box
        if action=='widget':
            instance = WidgetInstance.get(id);
            forms = WidgetInstanceForms(instance=instance)
            self.render('widgetConfiguration.html', instance=instance, forms=forms)
        elif action=='section':
            section = Section.get(id)
            params = dict ((p.key, p.value) for p in SectionParam.getSection(id))
            self.render('sectionConfiguration.html', section=section, params=params)

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
        elif action=='section':
            Section.update(id, self.get_argument('sectionName'), self.get_argument('sectionDescription', None))
            for p, v in self.request.arguments.iteritems():
                if p.startswith( 'params' ):
                    SectionParam.saveKey(section_id=id, key=p[6:], value=v[0])

            json = to_json(Section.get(id))
            json['params'] = dict ((p.key, p.value) for p in SectionParam.getSection(id))
            for socket in socket_connections:
                socket.sendMessage(['section-params', json])
            self.write("OK")

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
            'widgetinstance-order' : self.WSWidgetInstanceOrder,
            'widgetinstance-remove' : self.WSWidgetInstanceRemove,
            'widgetinstance-getsection' : self.WSWidgetInstanceGetsection,
            'widgetinstance-getoptions' : self.WSWidgetInstanceGetoptions,
            'widgetinstance-getsensors' : self.WSWidgetInstanceGetsensors,
            'widgetinstance-getcommands' : self.WSWidgetInstanceGetcommands,
            'datatype-getall' : self.WSDatatypesGetall,
        }[jsonmessage[0]](jsonmessage[1])
        if (data):
            self.sendMessage(data)

    def WSSectionGet(self, data):
        section = Section.get(data['id'])
        json = to_json(section)
        # Convert the section widgets style string to json
        json['widgetsStyle'] = json.loads(json['widgetsStyle'])
        return ['section-detail', json]

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

    def WSWidgetInstanceOrder(self, data):
        i = WidgetInstance.updateOrder(id=data['instance_id'], order=data['order'])
        json = to_json(i)
        json["widget"] = to_json(i.widget)
        return True;

    def WSWidgetInstanceGetsection(self, data):
        r = WidgetInstance.getSection(section_id=data['section_id'])
        json = {'section_id':data['section_id'], 'instances':to_json(r)}
        for index, item in enumerate(r):
            json['instances'][index]["widget"] = to_json(item.widget)
        return ['widgetinstance-sectionlist', json];

    def WSWidgetInstanceGetoptions(self, data):
        r = WidgetInstanceOption.getInstance(instance_id=data['instance_id'])
        d = {}
        for i, o in enumerate(r):
            d[o.key] = o.value
        json = {'instance_id':data['instance_id'], 'options':d}
        return ['widgetinstance-options', json];

    def WSWidgetInstanceGetsensors(self, data):
        r = WidgetInstanceSensor.getInstance(instance_id=data['instance_id'])
        d = {}
        for i, o in enumerate(r):
            d[o.key] = to_json(o.sensor)
            d[o.key]['device'] = to_json(o.sensor.device)
        json = {'instance_id':data['instance_id'], 'sensors':d}
        return ['widgetinstance-sensors', json];

    def WSWidgetInstanceGetcommands(self, data):
        r = WidgetInstanceCommand.getInstance(instance_id=data['instance_id'])
        d = {}
        for i, o in enumerate(r):
            d[o.key] = o.command_id
        json = {'instance_id':data['instance_id'], 'commands':d}
        return ['widgetinstance-commands', json];

    def WSDatatypesGetall(self, data):
        datatypes =dict ((o.id, json.loads(o.parameters)) for o in DataType.getAll())
        return ['datatype-list', datatypes]

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
            socket.sendMessage([msgid, content])

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