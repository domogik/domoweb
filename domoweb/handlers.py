#!/usr/bin/env python
from tornado import web, websocket
from tornado.web import RequestHandler
from domoweb.db.models import Section, Widget

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
        # create a Session
        name = self.get_argument('name')
        description = self.get_argument('description', None)
        Section.add(name=name, parent_id=1, description=description)

class ConfigurationHandler(RequestHandler):
    def get(self):
        action = self.get_argument('action', None)
        # Widget section box
        if action=='widgets':
            widgets = Widget.getAll()
            self.render('configurationWidgets.html',
                widgets=widgets)

class WSHandler(websocket.WebSocketHandler):
    def open(self):
        socket_connections.append(self)
    def on_close(self):
        socket_connections.remove(self)

    def on_message(self, message):
        logger.info("WS: Received message %s" % message)
        jsonmessage = json.loads(message)
        data = {'section-get' : self.WSgetSection}[jsonmessage['action']](jsonmessage['data'])
        self.sendMessage('', data)

    def WSgetSection(self, data):
        section = Section.get(data['id'])
        return to_json(section)

    def sendMessage(self, id, content):
        data=json.dumps([id, content])
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
    jsonm = {}
     
    for col in model._sa_class_manager.mapper.mapped_table.columns:
        jsonm[col.name] = getattr(model, col.name)

    return json.dumps([jsonm])