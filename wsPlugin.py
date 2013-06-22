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
        self.bus.log("Starting the MQ Plugin")
        
    def start(self):
        cherrypy.tree.mount(WS(), '/ws', {
            '/': {
                'tools.websocket.on': True,
                'tools.websocket.handler_cls': WSHandler
                }
            }
        )

"""
  <script type="application/javascript">
    $(document).ready(function() {

      websocket = "ws://%(host)s:%(port)s/ws/";
      if (window.WebSocket) {
        ws = new WebSocket(websocket);
      }
      else if (window.MozWebSocket) {
        ws = MozWebSocket(websocket);
      }
      else {
        console.log("WebSocket Not Supported");
        return;
      }

      window.onbeforeunload = function(e) {
        ws.close(1000, "Client left");
             
        if(!e) e = window.event;
        e.stopPropagation();
        e.preventDefault();
      };
      ws.onmessage = function (evt) {
        var now = new Date().getTime();
        $("#data").text(evt.data);
        var data = $.parseJSON(evt.data);
      };
      ws.onopen = function() {    
      };
      ws.onclose = function(evt) {
      };
    });
  </script>
"""

class WS(object):
    @cherrypy.expose
    def index(self):
        cherrypy.log("Handler created: %s" % repr(cherrypy.request.ws_handler))