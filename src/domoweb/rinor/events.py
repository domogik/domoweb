import cherrypy

class Events:
    @cherrypy.expose
    def index(self):
        from domoweb.rinor.pipes import EventPipe
        #Set the expected headers...
        cherrypy.response.headers["Content-Type"] = "text/event-stream"
        return EventPipe().get_event()
    index._cp_config = {'response.stream': True}
    