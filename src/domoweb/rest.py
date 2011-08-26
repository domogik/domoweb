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

class RinorServer(pipes.DmgPipe) :
    host = None
    @staticmethod
    def set_uri(path):
        # Generate host if not availble yet
        if (not RinorServer.host):
            try:
                ip = Parameters.objects.get(key='rinor_ip')
                port = Parameters.objects.get(key='rinor_port')
                RinorServer.host = "http://%s:%s" % (ip.value, port.value)
            except Parameters.DoesNotExist:
                raise RinorNotConfigured
        RinorServer.uri = RinorServer.host + path
    

class Rest(RinorServer):
    path = "/"
    @staticmethod
    def get_info():
        RinorServer.set_uri(Rest.path)
        return Rest.objects.get()

class House(object):
    def __init__(self):
        self.config = UIConfigs.get_by_reference('house', '0')
        if self.config.has_key('name') :
            self.name = self.config['name']

class Areas(RinorServer):
    path = "/base/area"

    @staticmethod
    def get_all():
        RinorServer.set_uri(Areas.path)
        return Areas.objects.get({'parameters':"list"})

    @staticmethod
    def get_by_id(id):
        RinorServer.set_uri(Areas.path)
        return Areas.objects.get({'parameters':"list/by-id/" + str(id)})

    @staticmethod
    def add(name, description):
        RinorServer.set_uri(Areas.path)
        return Areas.objects.get({'parameters':"add/name/" + name + "/description/" + description})

    @staticmethod
    def update(id, name, description):
        RinorServer.set_uri(Areas.path)
        return Areas.objects.get({'parameters':"update/id/" + str(id) + "/name/" + name + "/description/" + description})

    @staticmethod
    def del_by_id(id):
        RinorServer.set_uri(Areas.path)
        return Areas.objects.get({'parameters':"del/" + str(id)})

    def merge_rooms(self):
        for area in self.area:
            rooms = Rooms.get_by_area(area.id)
            area.room = rooms.room
            
    def merge_uiconfig(self):
        for area in self.area:
            area.config = UIConfigs.get_by_reference('area', area.id)

            # If has rooms
            if hasattr(area, 'room') and (area.room):
                for room in area.room:
                    room.config = UIConfigs.get_by_reference('room', room.id)

class Rooms(RinorServer):
    path = "/base/room"

    @staticmethod
    def get_all():
        RinorServer.set_uri(Rooms.path)
        return Rooms.objects.get({'parameters':"list"})

    @staticmethod
    def get_by_id(id):
        RinorServer.set_uri(Rooms.path)
        return Rooms.objects.get({'parameters':"list/by-id/" + str(id)})

    @staticmethod
    def get_by_area(id):
        RinorServer.set_uri(Rooms.path)
        return Rooms.objects.get({'parameters':"list/by-area/" + str(id)})

    @staticmethod
    def get_without_area():
        RinorServer.set_uri(Rooms.path)
        return Rooms.objects.get({'parameters':"list/by-area//"})

    @staticmethod
    def add(name, description):
        RinorServer.set_uri(Rooms.path)
        return Rooms.objects.get({'parameters':"add/name/" + name + "/description/" + description})

    @staticmethod
    def update(id, name, description):
        RinorServer.set_uri(Rooms.path)
        return Rooms.objects.get({'parameters':"update/id/" + str(id) + "/name/" + name + "/description/" + description})

    @staticmethod
    def update_area(id, area_id):
        RinorServer.set_uri(Rooms.path)
        return Rooms.objects.get({'parameters':"update/id/" + str(id) + "/area_id/" + str(area_id)})

    @staticmethod
    def del_by_id(id):
        RinorServer.set_uri(Rooms.path)
        return Rooms.objects.get({'parameters':"del/" + str(id)})

    def merge_uiconfig(self):
        for room in self.room:
            room.config = UIConfigs.get_by_reference('room', room.id)

            # If is associated with area
            if hasattr(room, 'area') and (room.area) :
                room.area.config = UIConfigs.get_by_reference('area', room.area.id)

class Devices(RinorServer):
    path = "/base/device"

    @staticmethod
    def get_all():
        RinorServer.set_uri(Devices.path)
        return Devices.objects.get({'parameters':"list"})

    @staticmethod
    def add(name, address, type_id, usage_id, description, reference):
        RinorServer.set_uri(Devices.path)
        return Devices.objects.get({'parameters':"add/name/" + name + "/address/" + address + "/type_id/" + type_id + "/usage_id/" + usage_id + "/description/" + description + "/reference/" + reference})

    @staticmethod
    def update(id, name, address, usage_id, description, reference):
        RinorServer.set_uri(Devices.path)
        return Devices.objects.get({'parameters':"update/id/" + str(id) + "/name/" + name + "/address/" + address + "/usage_id/" + usage_id + "/description/" + description + "/reference/" + reference})

    @staticmethod
    def del_by_id(id):
        RinorServer.set_uri(Devices.path)
        return Devices.objects.get({'parameters':"del/" + str(id)})


    def merge_uiconfig(self):
        for device in self.device:
            # If is associated with room
            if hasattr(device, 'room') and (device.room) :
                device.room.config = UIConfigs.get_by_reference('room', device.room.id)

    def merge_features(self):
        for device in self.device:
            features = Features.get_by_device(device.id)
            device.features = features.feature

class DeviceTechnologies(RinorServer):
    path = "/base/device_technology"

    @staticmethod
    def get_all():
        RinorServer.set_uri(DeviceTechnologies.path)
        return DeviceTechnologies.objects.get({'parameters':"list"})

class DeviceTypes(RinorServer):
    path = "/base/device_type"
    _dict = None
    
    @staticmethod
    def get_all():
        RinorServer.set_uri(DeviceTypes.path)
        return DeviceTypes.objects.get({'parameters':"list"})

    @staticmethod
    def get_dict():
        if DeviceTypes._dict is None:
            print "device types downloading"
            types = DeviceTypes.get_all()
            DeviceTypes._dict = {}
            for type in types.device_type:
                DeviceTypes._dict[type.id] = type
        else:
            print "device types already downloaded"
        return DeviceTypes._dict

    @staticmethod
    def get_dict_item(key):
        dict = DeviceTypes.get_dict()
        return dict[key]

class DeviceUsages(RinorServer):
    path = "/base/device_usage"
    _dict = None

    @staticmethod
    def get_all():
        RinorServer.set_uri(DeviceUsages.path)
        return DeviceUsages.objects.get({'parameters':"list"})
    
    @staticmethod
    def get_dict():
        if DeviceUsages._dict is None:
            print "device usages downloading"
            usages = DeviceUsages.get_all()
            DeviceUsages._dict = {}
            for usage in usages.device_usage:
                DeviceUsages._dict[usage.id] = usage
        else:
            print "device usages already downloaded"
        return DeviceUsages._dict

    @staticmethod
    def get_dict_item(key):
        dict = DeviceUsages.get_dict()
        return dict[key]

class Features(RinorServer):
    path = "/base/feature"

    @staticmethod
    def get_by_id(id):
        RinorServer.set_uri(Features.path)
        return Features.objects.get({'parameters':"list/by-id/" + str(id)})

    @staticmethod
    def get_by_device(device_id):
        RinorServer.set_uri(Features.path)
        return Features.objects.get({'parameters':"list/by-device_id/" + str(device_id)})

class FeatureAssociations(RinorServer):
    path = "/base/feature_association"

    @staticmethod
    def get_by_house():
        RinorServer.set_uri(FeatureAssociations.path)
        return FeatureAssociations.objects.get({'parameters':"list/by-house"})

    @staticmethod
    def get_by_house_deep():
        RinorServer.set_uri(FeatureAssociations.path)
        return FeatureAssociations.objects.get({'parameters':"listdeep/by-house"})

    @staticmethod
    def get_by_area(area_id):
        RinorServer.set_uri(FeatureAssociations.path)
        return FeatureAssociations.objects.get({'parameters':"list/by-area/" + str(area_id)})

    @staticmethod
    def get_by_area_deep(area_id):
        RinorServer.set_uri(FeatureAssociations.path)
        return FeatureAssociations.objects.get({'parameters':"listdeep/by-area/" + str(area_id)})

    @staticmethod
    def get_by_room(room_id):
        RinorServer.set_uri(FeatureAssociations.path)
        return FeatureAssociations.objects.get({'parameters':"list/by-room/" + str(room_id)})
        
    @staticmethod
    def get_by_feature(feature_id):
        RinorServer.set_uri(FeatureAssociations.path)
        return FeatureAssociations.objects.get({'parameters':"list/by-feature/" + str(feature_id)})

    @staticmethod
    def del_by_id(association_id):
        RinorServer.set_uri(FeatureAssociations.path)
        return FeatureAssociations.objects.get({'parameters':"del/id/" + str(association_id)})

    @staticmethod
    def del_by_association(association_type, association_id):
        RinorServer.set_uri(FeatureAssociations.path)
        return FeatureAssociations.objects.get({'parameters':"del/association_type/" + association_type + "/association_id/" + str(association_id)})

    @staticmethod
    def add(feature_id, association_type, association_id):
        RinorServer.set_uri(FeatureAssociations.path)
        return FeatureAssociations.objects.get({'parameters':"add/feature_id/" + str(feature_id) + "/association_type/" + association_type + "/association_id/" + str(association_id)})
    
class UIConfigs(RinorServer):
    path = "/base/ui_config"

    @staticmethod
    def get_by_key(name, key):
        RinorServer.set_uri(UIConfigs.path)
        resp = {}
        uiconfigs = UIConfigs.objects.get({'parameters':"list/by-key/" + name + "/" + key})
        if uiconfigs :
            for uiconfig in uiconfigs.ui_config:
                if (uiconfig.value) :
                    if (uiconfig.value[0] == '{') : # json structure 
                        resp[uiconfig.key] = simplejson.loads(unescape(uiconfig.value))
                    else :
                        resp[uiconfig.key] = uiconfig.value
            return resp

    @staticmethod
    def get_by_reference(name, reference):
        RinorServer.set_uri(UIConfigs.path)
        resp = {}
        uiconfigs = UIConfigs.objects.get({'parameters':"list/by-reference/" + name + "/" + str(reference)})
        if uiconfigs :
            for uiconfig in uiconfigs.ui_config:
                if (uiconfig.value) :
                    if (uiconfig.value[0] == '{') : # json structure 
                        resp[uiconfig.key] = simplejson.loads(unescape(uiconfig.value))
                    else :
                        resp[uiconfig.key] = uiconfig.value
            return resp

    @staticmethod
    def list_by_reference(name, reference):
        RinorServer.set_uri(UIConfigs.path)
        return UIConfigs.objects.get({'parameters':"list/by-reference/" + name + "/" + str(reference)})
        
    @staticmethod
    def del_by_reference(name, reference):
        RinorServer.set_uri(UIConfigs.path)
        return UIConfigs.objects.get({'parameters':"del/by-reference/" + name + "/" + reference})
    
    @staticmethod
    def set(name, reference, key, value):
        RinorServer.set_uri(UIConfigs.path)
        return UIConfigs.objects.get({'parameters':"set/name/" + name + "/reference/" + reference + "/key/" + key + "/value/" + value})
    
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

class Accounts(RinorServer):
    path = "/account"

    @staticmethod
    def auth(login, password):
        RinorServer.set_uri(Accounts.path)
        return Accounts.objects.get({'parameters':"auth/" + login + "/" + password})

    @staticmethod
    def get_user(id):
        RinorServer.set_uri(Accounts.path)
        return Accounts.objects.get({'parameters':"user/list/by-id/" + id})

    @staticmethod
    def get_all_users():
        RinorServer.set_uri(Accounts.path)
        return Accounts.objects.get({'parameters':"user/list"})

    @staticmethod
    def get_all_people():
        RinorServer.set_uri(Accounts.path)
        return Accounts.objects.get({'parameters':"person/list"})

    @staticmethod
    def add_user(login, password, is_admin, first_name, last_name):
        RinorServer.set_uri(Accounts.path)
        return Accounts.objects.get({'parameters':"user/add/login/" + login + "/password/" + password + "/is_admin/" + is_admin + "/skin_used//first_name/" + first_name + "/last_name/" + last_name})

    @staticmethod
    def update_user(id, login, password, is_admin, first_name, last_name):
        RinorServer.set_uri(Accounts.path)
        return Accounts.objects.get({'parameters':"user/update/id/" + str(id) + "/login/" + login + "/password/" + password + "/is_admin/" + is_admin + "/skin_used//first_name/" + first_name + "/last_name/" + last_name})

    @staticmethod
    def password_user(id, old, new):
        RinorServer.set_uri(Accounts.path)
        return Accounts.objects.get({'parameters':"user/password/id/" + str(id) + "/old/" + old + "/new/" + new})

    @staticmethod
    def del_user(id):
        RinorServer.set_uri(Accounts.path)
        return Accounts.objects.get({'parameters':"user/del/" + str(id)})

    @staticmethod
    def add_person(first_name, last_name):
        RinorServer.set_uri(Accounts.path)
        return Accounts.objects.get({'parameters':"person/add/first_name/" + first_name + "/last_name/" + last_name})

    @staticmethod
    def update_person(id, first_name, last_name):
        RinorServer.set_uri(Accounts.path)
        return Accounts.objects.get({'parameters':"person/update/id/" + str(id) + "/first_name/" + first_name + "/last_name/" + last_name})

    @staticmethod
    def del_person(id):
        RinorServer.set_uri(Accounts.path)
        return Accounts.objects.get({'parameters':"person/del/" + str(id)})

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