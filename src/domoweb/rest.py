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


@author: Domogik project
@copyright: (C) 2007-2009 Domogik project
@license: GPL(v3)
@organization: Domogik
"""
from django.db import models

from htmlentitydefs import name2codepoint
import re
import simplejson
import dmg_pipes as pipes
from domoweb.models import Parameters
from domoweb.exceptions import RinorNotConfigured

def unescape(s):
    "unescape HTML code refs; c.f. http://wiki.python.org/moin/EscapingHtml"
    return re.sub('&(%s);' % '|'.join(name2codepoint),
              lambda m: unichr(name2codepoint[m.group(1)]), s)

class Plugins(RinorServer):
    path = "/plugin"

    @staticmethod
    def get_all():
        RinorServer.set_uri(Plugins.path)
        return Plugins.objects.get({'parameters':"list"})

    @staticmethod
    def get_by_name(name):
        RinorServer.set_uri(Plugins.path)
        return Plugins.objects.get({'parameters':"list/by-name/" + name})

    @staticmethod
    def get_detail(host, name):
        RinorServer.set_uri(Plugins.path)
        return Plugins.objects.get({'parameters':"detail/" + host + "/" + name})

    @staticmethod
    def enable(host, name, action):
        RinorServer.set_uri(Plugins.path)
        return Plugins.objects.get({'parameters':action + "/" + host + "/" + name})

    @staticmethod
    def get_config(host, name):
        RinorServer.set_uri(Plugins.path)
        return Plugins.objects.get({'parameters':"config/list/by-name/" + host + "/" + name})

    @staticmethod
    def get_config_bykey(host, name, key):
        RinorServer.set_uri(Plugins.path)
        return Plugins.objects.get({'parameters':"config/list/by-name/" + host + "/" + name + "/by-key/" + key})

    @staticmethod
    def del_config(host, name):
        RinorServer.set_uri(Plugins.path)
        return Plugins.objects.get({'parameters':"config/del/" + host + "/" + name})

    @staticmethod
    def del_config_bykey(host, name, key):
        RinorServer.set_uri(Plugins.path)
        return Plugins.objects.get({'parameters':"config/del/" + host + "/" + name + "/by-key/" + key})

    @staticmethod
    def set_config(host, name, key, value):
        RinorServer.set_uri(Plugins.path)
        return Plugins.objects.get({'parameters':"config/set/hostname/" + host + "/name/" + name + "/key/" + key + "/value/" + value})

    @staticmethod
    def command(command, host, name):
        RinorServer.set_uri(Plugins.path)
        return Plugins.objects.get({'parameters': command+ "/" + host + "/" + name})

class Packages(RinorServer):
    path = "/package"

    @staticmethod
    def update_cache():
        RinorServer.set_uri(Packages.path)
        return Packages.objects.get({'parameters':"update-cache"})

    @staticmethod
    def get_list_repo():
        RinorServer.set_uri(Packages.path)
        return Packages.objects.get({'parameters':"list-repo"})
    
    @staticmethod
    def get_list():
        RinorServer.set_uri(Packages.path)
        return Packages.objects.get({'parameters':"list"})
    
    @staticmethod
    def get_list_installed():
        RinorServer.set_uri(Packages.path)
        return Packages.objects.get({'parameters':"list-installed"})
        
    @staticmethod
    def install(host, name, release):
        RinorServer.set_uri(Packages.path)
        return Packages.objects.get({'parameters':"install/" + host + "/" + name + "/" + release})
    
    @staticmethod
    def get_mode():
        RinorServer.set_uri(Packages.path)
        return Packages.objects.get({'parameters':"get-mode"})

class Command(RinorServer):
    path = "/command"

    @staticmethod
    def send(techno, address, command, values):
        RinorServer.set_uri(Command.path)
        # Change to PUT
        return Command.objects.get({'parameters':techno + "/" + address + "/" + command + "/" + values})

class State(RinorServer):
    path = "/stats"

    @staticmethod
    def get_latest(id, key):
        RinorServer.set_uri(State.path)
        return State.objects.get({'parameters':str(id) + "/" + key + "/latest"})

    @staticmethod
    def get_last(id, key, nb):
        RinorServer.set_uri(State.path)
        return State.objects.get({'parameters':str(id) + "/" + key + "/last/" + nb})

    @staticmethod
    def get_interval(id, key, fromtime, totime, interval, selector):
        RinorServer.set_uri(State.path)
        return State.objects.get({'parameters':str(id) + "/" + key + "/from/" + fromtime + "/to/" + totime + "/interval/" + interval + "/selector/" + selector})

class Helper(RinorServer):
    path = "/helper"

    @staticmethod
    def get(parameters):
        RinorServer.set_uri(Helper.path)
        return Helper.objects.get({'parameters': parameters})
        
class Events(RinorServer):
    path = "/events"

    @staticmethod
    def new(devices):
        RinorServer.set_uri(Events.path)
        return Events.objects.get({'parameters': 'request/new/' + devices})

    @staticmethod
    def get(ticket):
        RinorServer.set_uri(Events.path)
        return Events.objects.get({'parameters': 'request/get/' + ticket})