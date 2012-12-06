#!/usr/bin/env python
import cherrypy
from cherrypy.process import plugins
from django.core.handlers.wsgi import WSGIHandler
from httplogger import HTTPLogger

class CorePlugin(plugins.SimplePlugin):
    """
    CherryPy engine plugin to configure and mount
    the Django application onto the CherryPy server.
    """

    def __init__(self, bus, project):
        self.project = project
        plugins.SimplePlugin.__init__(self, bus)
        
    def start(self):
        self.bus.log("Mounting the Django application")
        """
        CherryPy WSGI server doesn't offer a log
        facility, we add a straightforward WSGI middleware to do so, based
        on the CherryPy built-in logger.
        """
        cherrypy.tree.graft(HTTPLogger(WSGIHandler()))
        
        self.bus.log("Setting up the static directory to be served")

        for (id, static) in self.project['statics'].items():
            static_handler = cherrypy.tools.staticdir.handler(
                section="/",
                dir=static['root'],
            )
            cherrypy.tree.mount(static_handler, static['url'])
            print "Mounted '%s' on '%s'" % (static['root'], static['url'])