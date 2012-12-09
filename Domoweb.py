#!/usr/bin/env python

import sys
if sys.version_info < (2, 6):
    print "Sorry, requires Python 2.6 or 2.7."
    sys.exit(1)    

import os, os.path
import pwd
import commands
#import pickle
import simplejson

import cherrypy
#import cherrypy.lib.auth_basic
from cherrypy.process import wspbus, plugins
from httplogger import HTTPLogger

from django.conf import settings
from django.core.handlers.wsgi import WSGIHandler

import domoweb
from events import *

def loadWidgets(root):
    from domoweb.models import Widget
    # List available widgets
    Widget.objects.all().delete()
    if os.path.isdir(root):
        for file in os.listdir(root):
            if not file.startswith('.'): # not hidden file
                main = os.path.join(root, file, "main.js")
                if os.path.isfile(main):
                    w = Widget(id=file)
                    w.save()

def loadIconsets(root):
    from domoweb.models import PageIcon
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

def loadThemes(root):
    from domoweb.models import PageTheme
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
def main():
    """Main function that is called at the startup of Domoweb"""
    from optparse import OptionParser

    p = OptionParser()

    # define command line options
    """
    p.add_option('-d', '--daemon',
                 dest='daemon',
                 action='store_true',
                 help='Run as a daemon')
    """
    p.add_option('--db',
             dest='db',
             default='/var/lib/domoweb/domoweb.db',
             help="Force domoweb DB file (default: /var/lib/domoweb/domoweb.db)")
    
    # parse command line for defined options
    options, args = p.parse_args()

#    if options.daemon:
#        daemonize()

    engine = cherrypy.engine

    domoweb.FULLPATH = os.path.normpath(os.path.abspath(__file__))
    domoweb.PROJECTPATH = os.path.dirname(domoweb.FULLPATH)
    engine.log("Running from : %s" % domoweb.PROJECTPATH)
    domoweb.PACKSPATH = os.path.join(domoweb.PROJECTPATH, 'packs')
    domoweb.VERSION = "dev.%s" % commands.getoutput("cd %s ; hg id -n 2>/dev/null" % domoweb.PROJECTPATH)
    engine.log("Version : %s" % domoweb.VERSION)

    # Check log folder
    if not os.path.isdir("/var/log/domoweb"):
        sys.stderr.write("Error: /var/log/domoweb do not exist")
        sys.exit(1)

    # Check run folder
    if not os.path.isdir("/var/run/domoweb"):
        sys.stderr.write("Error: /var/run/domoweb do not exist")
        sys.exit(1)
    
    # Check config file
    SERVER_CONFIG = '/etc/domoweb.cfg'
    if not os.path.isfile(SERVER_CONFIG):
        sys.stderr.write("Error: Can't find the file '%s'\n" % SERVER_CONFIG)
        sys.exit(1)

    cherrypy.config.update(SERVER_CONFIG)

    url_prefix = cherrypy.config.get("domoweb.url_prefix", "")
    if url_prefix != "":
        url_prefix += "/"

    project = {
        'path' : domoweb.PROJECTPATH,
        'version' : domoweb.VERSION,
        'prefix' : url_prefix,
        'dbfile' : options.db,
        'statics' : {
            'design' : {
                'url' : "/%sdesign" % url_prefix,
                'root' : os.path.join(domoweb.PROJECTPATH, "static")
            },
            'widgets' : {
                'url' : "/%swidgets" % url_prefix,
                'root' : os.path.join(domoweb.PACKSPATH, "widgets")
            },
            'themes' : {
                'url' : "/%sthemes" % url_prefix,
                'root' : os.path.join(domoweb.PACKSPATH, "themes")
            },
            'iconsets' : {
                'url' : "/%siconsets" % url_prefix,
                'root' : os.path.join(domoweb.PACKSPATH, "iconsets")
            }
        }
    }

    plugins.PIDFile(engine, "/var/run/domoweb/domoweb.pid").subscribe()

    coreapp = CoreAppPlugin(engine, project)
    engine.log("Loading Widgets")
    loadWidgets(os.path.join(domoweb.PACKSPATH, "widgets"))
    engine.log("Loading Iconsets")
    loadIconsets(os.path.join(domoweb.PACKSPATH, "iconsets"))
    engine.log("Loading Themes")
    loadThemes(os.path.join(domoweb.PACKSPATH, "themes"))

    EventsPlugin(engine, project).subscribe()
    coreapp.subscribe()
    engine.signal_handler.subscribe()
    if hasattr(engine, "console_control_handler"):
        engine.console_control_handler.subscribe()
    engine.start()
    engine.block()

'''
def runinstall():
    PROJECT_PATH='/usr/share/domoweb'
    os.environ['DOMOWEB_PATH']=PROJECT_PATH
    PROJECT_PACKS='/var/lib/domoweb/packs'
    os.environ['DOMOWEB_PACKS']=PROJECT_PACKS
    fh_in = open("/var/lib/domoweb/domoweb.dat", "rb")
    data = pickle.load(fh_in)
    fh_in.close()
    os.environ['DOMOWEB_REV']=data['rev']
    Server().run(PROJECT_PATH, PROJECT_PACKS)
'''

class EventsPlugin(plugins.SimplePlugin):
    def __init__(self, bus, project):
        self.project = project
        plugins.SimplePlugin.__init__(self, bus)

    def start(self):
        self.bus.log("Mounting Events url")
        cherrypy.tree.mount(Events(), '/%sevents' % self.project['prefix'])

class CoreAppPlugin(plugins.SimplePlugin):
    """
    CherryPy engine plugin to configure and mount
    the Django application onto the CherryPy server.
    """

    def __init__(self, bus, project):
        self.project = project
        plugins.SimplePlugin.__init__(self, bus)
        self.bus.log("Configuring the Django application")

        settings.configure(
            DEBUG = True,
            TEMPLATE_DEBUG = True,            
            RINOR_MIN_API = '0.7',
            RINOR_MAX_API = '0.7', #included
            DMG_MIN_VERSION = '0.3',
            
            PROJECT_PATH = self.project['path'],
            URL_PREFIX = self.project['prefix'],
            REST_URL = "/%srinor" % self.project['prefix'],
            EVENTS_URL = "/%sevents" % self.project['prefix'],
            CONFIG_URL = "/%sconfig" % self.project['prefix'],
            ADMIN_URL = "/%sadmin" % self.project['prefix'],
            VIEW_URL = "/%sview" % self.project['prefix'],
            LOGIN_URL = '%sadmin/login' % self.project['prefix'],
            LOGOUT_URL = '%sadmin/logout' % self.project['prefix'],
            LOGIN_REDIRECT_URL = '%sadmin' % self.project['prefix'],

            STATIC_DESIGN_URL = self.project['statics']['design']['url'],
            STATIC_WIDGETS_URL = self.project['statics']['widgets']['url'],
            STATIC_THEMES_URL = self.project['statics']['themes']['url'],
            STATIC_ICONSETS_URL = self.project['statics']['iconsets']['url'],
            DOMOWEB_VERSION = self.project['version'],
            DATABASES = {
                'default': {
                    'ENGINE': 'django.db.backends.sqlite3',
                    'NAME': project['dbfile'],
                }
            },
            TIME_ZONE = 'Europe/Paris',
            LANGUAGE_CODE = 'en',
            LANGUAGES = (
              ('en', 'English'),
              ('fr', 'Fran?ais'),
              ('nl_BE', 'Flemish'),
            ),
            LOCALE_PATHS = (
                '%s/domoweb/locale' % self.project['path'],
            ),
            DEFAULT_CHARSET = 'utf-8',
            SITE_ID = 1,
            USE_I18N = True,
            SECRET_KEY = 'i#=g$uo$$qn&0qtz!sbimt%#d+lb!stt#12hr@%vp-u)yw3s+b',
            TEMPLATE_LOADERS = (
                'django.template.loaders.filesystem.Loader',
                'django.template.loaders.app_directories.Loader',
                'django.template.loaders.eggs.Loader',
            ),
            MIDDLEWARE_CLASSES = (
                'django.contrib.sessions.middleware.SessionMiddleware',
                'django.middleware.locale.LocaleMiddleware',
                'django.middleware.common.CommonMiddleware',
                'django.contrib.auth.middleware.AuthenticationMiddleware',
                'django.contrib.messages.middleware.MessageMiddleware',
                'domoweb.middleware.RinorMiddleware',
            ),
            ROOT_URLCONF = 'domoweb.urls',
            TEMPLATE_CONTEXT_PROCESSORS = (
                'django.contrib.auth.context_processors.auth',
                'django.core.context_processors.debug',
                'django.core.context_processors.i18n',
                'django.core.context_processors.request',
                'django.contrib.messages.context_processors.messages',
                'domoweb.context_processors.domoweb',
            ),
            INSTALLED_APPS = (
                'django.contrib.auth',
                'django.contrib.contenttypes',
                'django.contrib.sessions',
                'django.contrib.messages',
                'django.contrib.sites',
                'django.contrib.admin',
                'tastypie',
                'manifesto',
                'django_tables2',
                'domoweb',
                'domoweb.config',
                'domoweb.view',
                'domoweb.admin',
                'domoweb.rinor',
            ),
            MANIFESTO_EXCLUDED_MANIFESTS = (
                    'randomapp.manifest.WrongManifest',
            ),
            SESSION_ENGINE = 'django.contrib.sessions.backends.cache',
            MESSAGE_STORAGE = 'django.contrib.messages.storage.session.SessionStorage',
            API_LIMIT_PER_PAGE = 0, #Tastypie
            TEMPLATE_DIRS = (
                '%s/domoweb/templates/' % self.project['path'],
                '%s/domoweb/config/templates/' % self.project['path'],
                '%s/domoweb/view/templates/' % self.project['path'],
                '%s/domoweb/admin/templates/' % self.project['path'],
                '%s/domoweb/rinor/templates/' % self.project['path'],
            ),
        )
        
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

if __name__ == '__main__':
    main()    