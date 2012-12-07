#!/usr/bin/env python
import cherrypy
from cherrypy.process import plugins
from django.core.handlers.wsgi import WSGIHandler
from httplogger import HTTPLogger
from ws4py.messaging import TextMessage

class CorePlugin(plugins.SimplePlugin):
    """
    CherryPy engine plugin to configure and mount
    the Django application onto the CherryPy server.
    """

    def __init__(self, bus, project):
        self.project = project
        plugins.SimplePlugin.__init__(self, bus)
        self.bus.subscribe('loader-status', self.loader)

    def start(self):
        pass
    
    def loader(self, status):
        """
        CherryPy WSGI server doesn't offer a log
        facility, we add a straightforward WSGI middleware to do so, based
        on the CherryPy built-in logger.
        """
        if status == 'finished':
            self.bus.log("Mounting the Django application")
            cherrypy.tree.graft(HTTPLogger(WSGIHandler()))
            cherrypy.engine.publish('websocket-broadcast', TextMessage('domoweb-ready'))


