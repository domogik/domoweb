# -*- coding: utf-8 -*-
#
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions are
# met:
#
#     * Redistributions of source code must retain the above copyright
# notice, this list of conditions and the following disclaimer.
#     * Redistributions in binary form must reproduce the above
# copyright notice, this list of conditions and the following disclaimer
# in the documentation and/or other materials provided with the
# distribution.
#     * Neither the name of Sylvain Hellegouarch nor the names of his
# contributors may be used to endorse or promote products derived from
# this software without specific prior written permission.
#
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
# "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
# LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
# A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
# OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
# SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
# LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
# DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
# THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
# (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
# OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
#

__author__ = "Sylvain Hellegouarch"
__version__ = "0.1.0"
__doc__ = """
Module to host a Django application from within a CherryPy server.

Instead of creating a clone to `runserver` like other similar
packages do, we simply setup and host the Django application
using WSGI and CherryPy's capabilities to serve it.

In order to configure the application, we use the `settings.configure(...)`
function provided by Django.

Finally, since the CherryPy WSGI server doesn't offer a log
facility, we add a straightforward WSGI middleware to do so, based
on the CherryPy built-in logger. Obviously any other log middleware
can be used instead.
"""

import sys
import logging
import os, os.path
import pwd
import commands
import pickle

import cherrypy
from cherrypy import _cplogging, _cperror
import cherrypy.lib.auth_basic
from cherrypy.process import wspbus, plugins
from django.conf import settings
from django.core.handlers.wsgi import WSGIHandler
from django.http import HttpResponseServerError
from domoweb.rinor.events import *

os.environ['DJANGO_SETTINGS_MODULE']='domoweb.settings'

class Server(object):
    def run(self, PROJECT_PATH):
        ETC_PATH = '/etc/domoweb'
        SERVER_CONFIG = '%s/domoweb.cfg' % ETC_PATH

        # Set static content
        STATIC_DESIGN_URL = "/design"
        STATIC_DESIGN_ROOT = os.path.join(PROJECT_PATH, "design")
        os.environ['DOMOWEB_STATIC_DESIGN'] = STATIC_DESIGN_ROOT

        STATIC_WIDGETS_URL = "/widgets"
        STATIC_WIDGETS_ROOT = os.path.join(PROJECT_PATH, "widgets")
        os.environ['DOMOWEB_STATIC_WIDGETS'] = STATIC_WIDGETS_ROOT
        STATICS = {STATIC_DESIGN_URL:STATIC_DESIGN_ROOT, STATIC_WIDGETS_URL:STATIC_WIDGETS_ROOT}
        
        settings = __import__(os.environ['DJANGO_SETTINGS_MODULE'])
        try:
            cherrypy.config.update(SERVER_CONFIG)
        except IOError:
            sys.stderr.write("Error: Can't find the file '%s/domoweb.cfg'\n" % ETC_PATH)
            sys.exit(1)
        engine = cherrypy.engine
        plugins.PIDFile(engine, "/var/run/domoweb/domoweb.pid").subscribe()
        DjangoAppPlugin(engine, STATICS).subscribe()
        engine.signal_handler.subscribe()
        if hasattr(engine, "console_control_handler"):
            engine.console_control_handler.subscribe()
        engine.start()
        engine.block()


class DjangoAppPlugin(plugins.SimplePlugin):
    """
    CherryPy engine plugin to configure and mount
    the Django application onto the CherryPy server.
    """
    STATICS = None
    def __init__(self, bus, statics):
        self.STATICS = statics
        super(DjangoAppPlugin, self).__init__(bus)

    def start(self):
        self.bus.log("Mounting the Django application")
        cherrypy.tree.graft(HTTPLogger(WSGIHandler()))
        
        self.bus.log("Setting up the static directory to be served")
        settings = __import__(os.environ['DJANGO_SETTINGS_MODULE'])

        cherrypy.tree.mount(Events(), '/events')

        for (url, root) in self.STATICS.items():
            static_handler = cherrypy.tools.staticdir.handler(
                section="/",
                dir=root,
            )
            cherrypy.tree.mount(static_handler, url)
            print "Mounted '%s' on '%s'" % (root, url)

class HTTPLogger(_cplogging.LogManager):

    def __init__(self, app):
        _cplogging.LogManager.__init__(self, id(self), cherrypy.log.logger_root)
        self.app = app

    def __call__(self, environ, start_response):
        """
        Called as part of the WSGI stack to log the incoming request
        and its response using the common log format. If an error bubbles up
        to this middleware, we log it as such.
        """
        try:
            response = self.app(environ, start_response)
            self.access(environ, response)
            return response
        except:
            self.error(traceback=True)
            return HttpResponseServerError(_cperror.format_exc())

    def access(self, environ, response):
        """
        Special method that logs a request following the common
        log format. This is mostly taken from CherryPy and adapted
        to the WSGI's style of passing information.
        """
        atoms = {'h': environ.get('REMOTE_ADDR', ''),
                 'l': '-',
                 'u': "-",
                 't': self.time(),
                 'r': "%s %s %s" % (environ['REQUEST_METHOD'], environ['REQUEST_URI'], environ['SERVER_PROTOCOL']),
                 's': response.status_code,
                 'b': str(len(response.content)),
                 'f': environ.get('HTTP_REFERER', ''),
                 'a': environ.get('HTTP_USER_AGENT', ''),
                 }
        for k, v in atoms.items():
            if isinstance(v, unicode):
                v = v.encode('utf8')
            elif not isinstance(v, str):
                v = str(v)
            # Fortunately, repr(str) escapes unprintable chars, \n, \t, etc
            # and backslash for us. All we have to do is strip the quotes.
            v = repr(v)[1:-1]
            # Escape double-quote.
            atoms[k] = v.replace('"', '\\"')

        try:
            self.access_log.log(logging.INFO, self.access_log_format % atoms)
        except:
            self.error(traceback=True)


def rundevelop():
    PROJECT_PATH=os.path.dirname(os.path.abspath(__file__))
    os.environ['DOMOWEB_PATH']=PROJECT_PATH
    os.environ['DOMOWEB_BRANCH']=commands.getoutput("cd %s ; hg id -b 2>/dev/null" % PROJECT_PATH)
    os.environ['DOMOWEB_REV']=commands.getoutput("cd %s ; hg id -n 2>/dev/null" % PROJECT_PATH)
    os.environ['DOMOWEB_TAG']=commands.getoutput("cd %s ; hg id -t 2>/dev/null" % PROJECT_PATH)
    Server().run(PROJECT_PATH)

def runinstall():
    PROJECT_PATH='/usr/share/domoweb'
    os.environ['DOMOWEB_PATH']=PROJECT_PATH
    fh_in = open("/var/lib/domoweb/domoweb.dat", "rb")
    data = pickle.load(fh_in)
    fh_in.close()
    os.environ['DOMOWEB_BRANCH']=data['branch']
    os.environ['DOMOWEB_REV']=data['rev']
    os.environ['DOMOWEB_TAG']=data['tag']
    Server().run(PROJECT_PATH)
    
if __name__ == '__main__':
    rundevelop()
