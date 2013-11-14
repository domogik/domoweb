#!/usr/bin/env python

import sys
if sys.version_info < (2, 6):
    print "Sorry, requires Python 2.6 or 2.7."
    sys.exit(1)    

import os, os.path
import pwd
import commands
#import pickle

import cherrypy
from cherrypy.process import plugins
from django.conf import settings

import domoweb
from wsPlugin import WSPlugin
#from mqPlugin import MQPlugin
from eventsPlugin import EventsPlugin
from corePlugin import CorePlugin
from loaderPlugin import LoaderPlugin

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
        'websocket' : {
            'url' : "/%sws/" % (url_prefix),
        },
        'statics' : {
            'url' : "/%sdesign" % url_prefix,
            'root' : os.path.join(domoweb.PROJECTPATH, "static")
        },
        'packs' : {
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
    WSPlugin(engine).subscribe()

    # Loading django config for database connection
    load_config(project)
    LoaderPlugin(engine, project).subscribe()

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
def load_config(project):
    cherrypy.engine.log("Configuring the Django application")
    settings.configure(
        DEBUG = True,
        TEMPLATE_DEBUG = True,            
        RINOR_MIN_API = '0.6',
        RINOR_MAX_API = '0.6', #included
        DMG_MIN_VERSION = '0.3',
        
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

        STATIC_DESIGN_URL = project['statics']['url'],
        STATIC_WIDGETS_URL = project['packs']['widgets']['url'],
        STATIC_THEMES_URL = project['packs']['themes']['url'],
        STATIC_ICONSETS_URL = project['packs']['iconsets']['url'],
        DOMOWEB_VERSION = project['version'],
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
            '%s/domoweb/locale' % project['path'],
        ),
        DEFAULT_CHARSET = 'utf-8',
        SITE_ID = 1,
        USE_I18N = True,
        SECRET_KEY = 'i#=g$uo$$qn&0qtz!sbimt%#d+lb!stt#12hr@%vp-u)yw3s+b',
        TEMPLATE_LOADERS = (
            'django.template.loaders.filesystem.Loader',
            'django.template.loaders.app_directories.Loader',
#            'django.template.loaders.eggs.Loader',
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
            'manifesto',
            'south',
            'tastypie',
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