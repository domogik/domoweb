#!/usr/bin/env python
import logging
import cherrypy

from cherrypy.process import plugins

# MQ
import zmq

class MQPlugin(plugins.SimplePlugin):

    def __init__(self, bus):
        plugins.SimplePlugin.__init__(self, bus)
        self.zmqcontext = zmq.Context()

    def start(self):
        from domoweb.models import Client
        cherrypy.engine.log("Listening for MQ Events")
        Client.init_event(self.zmqcontext)

