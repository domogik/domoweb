#!/usr/bin/python
# -*- coding: utf-8 -*-

""" This file is part of B{Domogik} project (U{http://www.domogik.org}).

License
=======

B{Domogik} is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

B{Domogik} is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Domogik. If not, see U{http://www.gnu.org/licenses}.

Module purpose
==============



Implements
==========


@author: Marc Schneider <marc@mirelsol.org>
@copyright: (C) 2007-2009 Domogik project
@license: GPL(v3)
@organization: Domogik
"""

import os
import pwd
import commands

from domogik.common.configloader import Loader

PROJECT_PATH = os.path.dirname(os.path.abspath(__file__))

DEBUG = True
TEMPLATE_DEBUG = DEBUG

RINOR_MIN_API = '0.2'
DMG_MIN_VERSION = '0.1.0-alpha1'

ADMINS = (
    # ('Your Name', 'your_email@domain.com'),
)

MANAGERS = ADMINS

### Get DomoWeb Version
SOURCES_VERSION =  commands.getoutput("cd %s ; hg branch | xargs hg log -l1 --template '{branch}.{rev} ({latesttag}) - {date|isodate}' -b" % PROJECT_PATH)
PACKAGE_VERSION = '0.2.0'
print SOURCES_VERSION

### Find User home
if os.path.isfile("/etc/default/domoweb"):
    file = "/etc/default/domoweb"
else:
    file = "/etc/conf.d/domoweb"
f = open(file,"r")
r = f.readlines()
lines = filter(lambda x: not x.startswith('#') and x != '\n',r)
f.close()
for line in lines:
    item,value = line.strip().split("=")
    if item.strip() == "DOMOWEB_USER":
        user = value
    else:
        raise KeyError("Unknown config value in the main config file : %s" % item)
try:
    user_entry = pwd.getpwnam(user)
except KeyError:
    raise KeyError("The user %s does not exists, you MUST create it or change the DOMOWEB_USER parameter in %s. Please report this as a bug if you used install.sh." % (user, file))
user_home = user_entry.pw_dir

### UI Database settings
DATABASE_ENGINE = 'sqlite3'
DATABASE_NAME = "%s/.domogik/domoweb.db" % user_home

### Rest settings
cfg_rest = Loader('django')
config_django = cfg_rest.load()
conf_django = dict(config_django[1])

# Local time zone for this installation. Choices can be found here:
# http://en.wikipedia.org/wiki/List_of_tz_zones_by_name
# although not all choices may be available on all operating systems.
# If running in a Windows environment this must be set to the same as your
# system time zone.
TIME_ZONE = 'Europe/Paris'

# Language code for this installation. All choices can be found here:
# http://www.i18nguy.com/unicode/language-identifiers.html
LANGUAGE_CODE = 'en-us'

SITE_ID = 1

# If you set this to False, Django will make some optimizations so as not
# to load the internationalization machinery.
USE_I18N = True

# Absolute path to the directory that holds media.
# Example: "/home/media/media.lawrence.com/"
MEDIA_ROOT = ''

# URL that handles the media served from MEDIA_ROOT. Make sure to use a
# trailing slash if there is a path component (optional in other cases).
# Examples: "http://media.lawrence.com", "http://example.com/media/"
MEDIA_URL = ''

# URL prefix for admin media -- CSS, JavaScript and images. Make sure to use a
# trailing slash.
# Examples: "http://foo.com/media/", "/media/".
ADMIN_MEDIA_PREFIX = '/media/'

# Make this unique, and don't share it with anybody.
SECRET_KEY = 'i#=g$uo$$qn&0qtz!sbimt%#d+lb!stt#12hr@%vp-u)yw3s+b'

# List of callables that know how to import templates from various sources.
TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.load_template_source',
    'django.template.loaders.app_directories.load_template_source',
#     'django.template.loaders.eggs.load_template_source',
)

MIDDLEWARE_CLASSES = (
    'django.contrib.sessions.middleware.SessionMiddleware',
    # TODO : uncomment this once multi-languages will be supported
    # 'django.middleware.locale.LocaleMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
)

ROOT_URLCONF = 'domoweb.urls'

TEMPLATE_DIRS = (
    # Put strings here, like "/home/html/django_templates" or
    # "C:/www/django/templates".
    # Always use forward slashes, even on Windows.
    # Don't forget to use absolute paths, not relative paths.
    '%s/templates/' % PROJECT_PATH,
    '%s/view/templates/' % PROJECT_PATH,
    '%s/admin/templates/' % PROJECT_PATH,
    '%s/rinor/templates/' % PROJECT_PATH,
    '/usr/local/share/domoweb/templates/',
    '/usr/local/share/domoweb/view/templates/',
    '/usr/local/share/domoweb/admin/templates/',
    '/usr/local/share/domoweb/rinor/templates/',
)

TEMPLATE_CONTEXT_PROCESSORS = (
    'django.core.context_processors.auth',
    'django.core.context_processors.debug',
    'django.core.context_processors.i18n',
    'django.core.context_processors.request',
)

INSTALLED_APPS = (
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.admin',
    'tastypie',
    'domoweb',
    'domoweb.view',
    'domoweb.admin',
    'domoweb.rinor',
)


# Session stuff
# Other options are :
### 'django.contrib.sessions.backends.db'
### 'django.contrib.sessions.backends.file'
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'

PIPES_CACHE_EXPIRY=0
PIPES_SOCKET_TIMEOUT=600 # 600 sec

#Tastypie
API_LIMIT_PER_PAGE = 0

try:
    from settings_local import *
except ImportError:
    pass

# List the availables widgets
WIDGETS_LIST = []
STATIC_WIDGETS_ROOT = None
#STATIC_DESIGN_ROOT = None 

#Only loads the widgets from the FIRST existing directory in TEMPLATE_DIRS
for t_path in (PROJECT_PATH, '/usr/local/share/domoweb/',):
    if os.path.isdir(t_path):
        STATIC_DESIGN_ROOT = '%s/design' % t_path
        w_path = os.path.join(t_path, "widgets")
        STATIC_WIDGETS_ROOT = w_path
        if os.path.isdir(w_path):
            for file in os.listdir(w_path):
                main = os.path.join(w_path, file, "main.js")
                if os.path.isfile(main):
                    WIDGETS_LIST.append(file)
        break


# For login Auth
AUTHENTICATION_BACKENDS = ('domoweb.backends.RestBackend',)
LOGIN_URL = '/admin/login'
LOGOUT_URL = '/admin/logout'
LOGIN_REDIRECT_URL = '/admin/'
