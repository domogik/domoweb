#!/usr/bin/env python
import logging
import cherrypy

from cherrypy.process import plugins

from ws4py.server.cherrypyserver import WebSocketPlugin, WebSocketTool
from ws4py.websocket import WebSocket

class WSHandler(WebSocket):
    def received_message(self, m):
        pass

class WSPlugin(plugins.SimplePlugin):
    def __init__(self, bus):
        plugins.SimplePlugin.__init__(self, bus)
        
    def start(self):
        cherrypy.engine.log("Starting the WebSocket Plugin")
        cherrypy.tree.mount(WS(), '/ws', {
            '/': {
                'tools.websocket.on': True,
                'tools.websocket.handler_cls': WSHandler
                }
            }
        )

class WS(object):
    @cherrypy.expose
    def index(self):
        cherrypy.log("Handler created: %s" % repr(cherrypy.request.ws_handler))