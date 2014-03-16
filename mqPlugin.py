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
        from domoweb.models import Client, Package
        cherrypy.engine.log("Listening for MQ Events")
        Package.init_event(self.zmqcontext)
        Client.init_event(self.zmqcontext)

