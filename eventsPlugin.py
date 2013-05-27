import cherrypy
from cherrypy.process import plugins

import domoweb
class EventsPlugin(plugins.SimplePlugin):
    def __init__(self, bus, project):
        self.project = project
        plugins.SimplePlugin.__init__(self, bus)

    def start(self):
        self.bus.log("Mounting Events url")
        cherrypy.tree.mount(Events(), '/%sevents' % self.project['prefix'])
        
class Events:    
    @cherrypy.expose
    def index(self):
        from domoweb.rinor.pipes import EventPipe
        #Set the expected headers...
        cherrypy.response.headers["Content-Type"] = "text/event-stream; charset=utf-8"
        return EventPipe().get_event()
    index._cp_config = {'response.stream': True}
    