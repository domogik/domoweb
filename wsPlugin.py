#!/usr/bin/env python
import cherrypy
from cherrypy.process import plugins
from ws4py.websocket import WebSocket
from ws4py.server.cherrypyserver import WebSocketPlugin, WebSocketTool

class WebSocketHandler(WebSocket):
    def received_message(self, m):
        pass

class WSPlugin(plugins.SimplePlugin):
    def __init__(self, bus):
        plugins.SimplePlugin.__init__(self, bus)
        self.bus.log("Starting the WebSocket Plugin")
        # Loading WebSocket service
        WebSocketPlugin(bus).subscribe()
        cherrypy.tools.websocket = WebSocketTool()

    def start(self):
        cherrypy.tree.mount(WS(), '/ws', {
            '/': {
                'tools.websocket.on': True,
                'tools.websocket.handler_cls': WebSocketHandler
                }
            }
        )

class WS(object):
    @cherrypy.expose
    def index(self):
        cherrypy.log("Handler created: %s" % repr(cherrypy.request.ws_handler))
