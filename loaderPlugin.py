#!/usr/bin/env python
import sys
import os
import threading
import cherrypy
import simplejson
from cherrypy.process import plugins
from ws4py.messaging import TextMessage

class LoaderTask(threading.Thread):
    def __init__(self, project):
        self.status = None
        threading.Thread.__init__(self) # init the thread
        self.project = project
        # Mounting design folder
        static_handler = cherrypy.tools.staticdir.handler(
            section="/",
            dir=project['statics']['root'],
        )
        cherrypy.tree.mount(static_handler, project['statics']['url'])
    
    def updateStatus(self, status):
        cherrypy.engine.publish('websocket-broadcast', TextMessage('loader-%s' % status))
        cherrypy.engine.publish('loader-status', status)

    def run(self):
        self.updateStatus('started')
#        self.updateStatus('db-checking')
#        self.updateDb()
#        self.updateStatus('db-checked')
        cherrypy.engine.log("Loading Widgets")
        self.updateStatus('widgets-loading')
        self.loadWidgets()
        self.updateStatus('widgets-loaded')
        cherrypy.engine.log("Loading Iconsets")
        self.updateStatus('iconsets-loading')
        self.loadIconsets()
        self.updateStatus('iconsets-loaded')
        cherrypy.engine.log("Loading Themes")
        self.updateStatus('themes-loading')
        self.loadThemes()
        self.updateStatus('theme-loaded')
        
        cherrypy.engine.log("Setting up the static directory to be served")
        self.updateStatus('statics-mounting')
        for (id, static) in self.project['packs'].items():
            static_handler = cherrypy.tools.staticdir.handler(
                section="/",
                dir=static['root'],
            )
            cherrypy.tree.mount(static_handler, static['url'])
            print "Mounted '%s' on '%s'" % (static['root'], static['url'])
        self.updateStatus('statics-mounted')
        self.updateStatus('finished')

    def loadWidgets(self):
        from domoweb.models import Widget
        root = self.project['packs']['widgets']['root']
        # List available widgets
        Widget.objects.all().delete()
        if os.path.isdir(root):
            for file in os.listdir(root):
                if not file.startswith('.'): # not hidden file
                    main = os.path.join(root, file, "main.js")
                    if os.path.isfile(main):
                        w = Widget(id=file)
                        w.save()
    
    def loadIconsets(self):
        from domoweb.models import PageIcon
        root = self.project['packs']['iconsets']['root']
        # List available page iconsets
        PageIcon.objects.all().delete()
        STATIC_ICONSETS_PAGE = os.path.join(root, "page")
        if os.path.isdir(STATIC_ICONSETS_PAGE):
            for file in os.listdir(STATIC_ICONSETS_PAGE):
                if not file.startswith('.'): # not hidden file
                    info = os.path.join(STATIC_ICONSETS_PAGE, file, "info.json")
                    if os.path.isfile(info):
                        iconset_file = open(info, "r")
                        iconset_json = simplejson.load(iconset_file)
                        iconset_id = iconset_json["identity"]["id"]
                        iconset_name = iconset_json["identity"]["name"]
                        for icon in iconset_json["icons"]:
                            id = iconset_id + '-' + icon["id"]
                            i = PageIcon(id=id, iconset_id=iconset_id, iconset_name=iconset_name, icon_id=icon["id"], label=icon["label"])
                            i.save()
    
    def loadThemes(self):
        from domoweb.models import PageTheme
        root = self.project['packs']['themes']['root']
        # List available page themes
        PageTheme.objects.all().delete()
        if os.path.isdir(root):
            for file in os.listdir(root):
                if not file.startswith('.'): # not hidden file
                    info = os.path.join(root, file, "info.json")
                    if os.path.isfile(info):
                        theme_file = open(info, "r")
                        theme_json = simplejson.load(theme_file)
                        theme_id = theme_json["identity"]["id"]
                        theme_name = theme_json["identity"]["name"]
                        t = PageTheme(id=theme_id, label=theme_name)
                        t.save()
    """
    def updateDb(self):
        from django.core import management
        from StringIO import StringIO 
        sys.stdout = buffer = StringIO()
        if not os.path.isfile("/var/lib/domoweb/domoweb.db"):
            self.updateStatus('db-creating')
            management.call_command("syncdb", interactive=False)
            self.updateStatus('db-created')

        self.updateStatus('db-updating')
        management.call_command("migrate", "domoweb", show_list=True, interactive=False)
        management.call_command("migrate", "domoweb", delete_ghosts=True)
        self.updateStatus('db-updated')
        cherrypy.engine.log(buffer.getvalue())
        sys.stdout = sys.__stdout__
    """

class Loader(object):
    def __init__(self, project):
        self.project = project
        self.status = 'loader-started'
        cherrypy.engine.subscribe('loader-status', self.loader)
    
    def loader(self, status):
        self.status = 'loader-%s' % status

    @cherrypy.expose
    def index(self):
        return """<html>
<head>
  <script type="application/javascript" src="%(statics_url)s/libraries/jquery-1.7.1/jquery-1.7.1.min.js"></script>
  <script type="application/javascript">
    $(document).ready(function() {
      websocket = "ws://" + location.host + "%(websocket_url)s";
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
      ws.onmessage = function (evt) {
        updateStatus(evt.data);
        if (evt.data == 'domoweb-ready') {
            ws.close();
            location.reload();        
        }
        //var data = $.parseJSON(evt.data);
      };
      updateStatus('%(status)s');
    });
    function updateStatus(status) {
        switch(status)
        {
            case 'loader-started':
                statusText = '0&#37; - Starting';
                break;
            case 'loader-widgets-loading':
                statusText = '0&#37; - Loading widgets';
                break;
            case 'loader-widgets-loaded':
                statusText = '10&#37; - Widgets loaded';
                break;
            case 'loader-iconsets-loading':
                statusText = '10&#37; - Loading iconsets';
                break;
            case 'loader-iconsets-loaded':
                statusText = '60&#37; - Iconsets loaded';
                break;
            case 'loader-themes-loading':
                statusText = '60&#37; - Loading themes';
                break;
            case 'loader-theme-loaded':
                statusText = '90&#37; - Themes loaded';
                break;
            case 'loader-statics-mounting':
                statusText = '90&#37; - Mounting static folders';
                break;
            case 'loader-statics-mounted':
                statusText = '100&#37; - Static folders mounted';
                break;
            case 'loader-finished':
                statusText = '100&#37; - Ready - Launching Domoweb';
                break;
        }
        $("#data").html(statusText);
    }
  </script>
  <style type="text/css">
    #data {
        text-align:center;
        font-size: 3em;
        font-family:arial;
    }
  </style>
</head>
<body>
  <div id="data"></div>
</body>
</html>
""" % {'websocket_url': self.project['websocket']['url'], 'statics_url': self.project['statics']['url'], 'status': self.status}

    @cherrypy.expose
    def ws(self):
        cherrypy.log("Handler created: %s" % repr(cherrypy.request.ws_handler))
        
class LoaderPlugin(plugins.SimplePlugin):
    def __init__(self, bus, project):
        self.project = project
        plugins.SimplePlugin.__init__(self, bus)
        self.task = LoaderTask(project)

    def start(self):
        cherrypy.tree.mount(Loader(self.project), '/')
        self.task.start()