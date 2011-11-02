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

from domoweb.tools.configloader import Loader

DEBUG = True
TEMPLATE_DEBUG = DEBUG

RINOR_MIN_API = '0.2'
DMG_MIN_VERSION = '0.1.1-alpha1'

ADMINS = (
    # ('Your Name', 'your_email@domain.com'),
)

MANAGERS = ADMINS

### Get DomoWeb Version
# Change to static number on package 
#DOMOWEB_FULL_VERSION =  commands.getoutput("cd %s ; hg branch | xargs hg log -l1 --template '{branch}.{rev} ({latesttag}) - {date|isodate}' -b" % PROJECT_PATH)
#DOMOWEB_VERSION = commands.getoutput("cd %s ; hg branch | xargs hg log -l1 --template '{latesttag} ({branch})' -b" % PROJECT_PATH)
DOMOWEB_FULL_VERSION =  "0.2.0-alpha1"
DOMOWEB_VERSION = "0.2.0-alpha1"

print DOMOWEB_FULL_VERSION

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

# For login Auth
LOGIN_URL = '/admin/login'
LOGOUT_URL = '/admin/logout'
LOGIN_REDIRECT_URL = '/admin/'
