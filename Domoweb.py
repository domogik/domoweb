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
from cherrypy.process import plugins

from django.conf import settings

import domoweb
from ws4py.server.cherrypyserver import WebSocketPlugin, WebSocketTool
from mqPlugin import MQPlugin
from eventsPlugin import EventsPlugin
from corePlugin import CorePlugin

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

    # Loading WebSocket service
    WebSocketPlugin(engine).subscribe()
    cherrypy.tools.websocket = WebSocketTool()

    # Loading django config for database connection
    load_django_config(project)

    engine.log("Loading Widgets")
    loadWidgets(os.path.join(domoweb.PACKSPATH, "widgets"))
    engine.log("Loading Iconsets")
    loadIconsets(os.path.join(domoweb.PACKSPATH, "iconsets"))
    engine.log("Loading Themes")
    loadThemes(os.path.join(domoweb.PACKSPATH, "themes"))

#    MQPlugin(engine).subscribe()
    EventsPlugin(engine, project).subscribe()
    CorePlugin(engine, project).subscribe()
    
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

def load_django_config(project):
    cherrypy.engine.log("Configuring the Django application")
    settings.configure(
        DEBUG = True,
        TEMPLATE_DEBUG = True,            
        RINOR_MIN_API = '0.6',
        RINOR_MAX_API = '0.6', #included
        DMG_MIN_VERSION = '0.2.0-alpha1',
        
        PROJECT_PATH = project['path'],
        URL_PREFIX = project['prefix'],
        REST_URL = "/%srinor" % project['prefix'],
        EVENTS_URL = "/%sevents" % project['prefix'],
        CONFIG_URL = "/%sconfig" % project['prefix'],
        ADMIN_URL = "/%sadmin" % project['prefix'],
        VIEW_URL = "/%sview" % project['prefix'],
        LOGIN_URL = '%sadmin/login' % project['prefix'],
        LOGOUT_URL = '%sadmin/logout' % project['prefix'],
        LOGIN_REDIRECT_URL = '%sadmin' % project['prefix'],

        STATIC_DESIGN_URL = project['statics']['design']['url'],
        STATIC_WIDGETS_URL = project['statics']['widgets']['url'],
        STATIC_THEMES_URL = project['statics']['themes']['url'],
        STATIC_ICONSETS_URL = project['statics']['iconsets']['url'],
        DOMOWEB_VERSION = project['version'],
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': "/var/lib/domoweb/domoweb.db",
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
            '%s/domoweb/locale' % project['path'],
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
            '%s/domoweb/templates/' % project['path'],
            '%s/domoweb/config/templates/' % project['path'],
            '%s/domoweb/view/templates/' % project['path'],
            '%s/domoweb/admin/templates/' % project['path'],
            '%s/domoweb/rinor/templates/' % project['path'],
        ),
    )

if __name__ == '__main__':
    main()    