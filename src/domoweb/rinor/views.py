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

Django web UI views

Implements
==========


@author: Domogik project
@copyright: (C) 2007-2010 Domogik project
@license: GPL(v3)
@organization: Domogik
"""
from django.conf import settings
from django.http import HttpResponse
from django.shortcuts import redirect
import simplejson
import datetime

from django_pipes.exceptions import ResourceNotAvailableException
from httplib import BadStatusLine
from domoweb.utils import *
from domoweb.rest import (
    Command, State, Rest, Accounts, Plugins, FeatureAssociations, UIConfigs, Features, Helper, Areas, Devices, Rooms
)

class JSONResponse(HttpResponse):
    def __init__(self, data, key=None):
        if (data.status == 'OK'):
            indent = 2 if settings.DEBUG else None
            if (key):
                if data.items.has_key(key):
                    content = simplejson.dumps(data.items[key], indent=indent)
                else:
                    raise AttributeError
            else:
                content = '{}'
            code = 200
        else:
            content = data.description,
            code = 400
        super(JSONResponse, self).__init__(
            content = content,
            mimetype = "application/json",
        )
        self.status_code = code
        self['Pragma'] = 'no-cache'
        self['Cache-Control'] = 'no-cache, must-revalidate'
        self['Expires'] = '0'        

@rinor_isconfigured
def rinor_command(request, techno, address, command, values=None):
    try:
        data = Command.send(techno, address, command, values)
    except BadStatusLine:
        return redirect("error_badstatusline_view")
    except ResourceNotAvailableException:
        return redirect("error_resourcenotavailable_view")
    return JSONResponse(data)

@rinor_isconfigured
def rinor_state_last(request, device_id, key, nb=1):
    try:
        data = State.get_last(device_id, key, nb)
    except BadStatusLine:
        return redirect("error_badstatusline_view")
    except ResourceNotAvailableException:
        return redirect("error_resourcenotavailable_view")
    return JSONResponse(data, 'stats')

def js_timestamp_from_datetime(dt): 
    return 1000 * time.mktime(dt.timetuple()) 

@rinor_isconfigured
def rinor_state_interval(request, device_id, key, fromtime, totime, interval, selector):
    try:
        data = State.get_interval(device_id, key, fromtime, totime, interval, selector)
    except BadStatusLine:
        return redirect("error_badstatusline_view")
    except ResourceNotAvailableException:
        return redirect("error_resourcenotavailable_view")

    # convert for JS timestamp
#    if data.status == 'OK':
#        if interval == 'minute':
#            for state in data.stats[0].values:
#                result = []
#                dt = datetime(state[0], state[1]-1, state[2], state[3], state[4], state[5])
#                result[0] = s_timestamp_from_datetime(dt)
#                result[1] = state[6]
#                results.append(result)       
#    data.stats[0].values = results

    return JSONResponse(data, 'stats')
    
@rinor_isconfigured
def rinor_info(request):
    try:
        data = Rest.get_info()
    except BadStatusLine:
        return redirect("error_badstatusline_view")
    except ResourceNotAvailableException:
        return redirect("error_resourcenotavailable_view")
    return JSONResponse(data, 'rest')
    
@rinor_isconfigured
def rinor_account_users_list(request):
    try:
        data = Accounts.get_all_users()
    except BadStatusLine:
        return redirect("error_badstatusline_view")
    except ResourceNotAvailableException:
        return redirect("error_resourcenotavailable_view")
    return JSONResponse(data, 'account')

@rinor_isconfigured
def rinor_account_user_add(request, login, password, is_admin, first_name, last_name):
    try:
        data = Accounts.add_user(login, password, is_admin, first_name, last_name)
    except BadStatusLine:
        return redirect("error_badstatusline_view")
    except ResourceNotAvailableException:
        return redirect("error_resourcenotavailable_view")
    return JSONResponse(data, 'account')

@rinor_isconfigured
def rinor_account_user_update(request, id, login, password, is_admin, first_name, last_name):
    try:
        data = Accounts.update_user(id, login, password, is_admin, first_name, last_name)
    except BadStatusLine:
        return redirect("error_badstatusline_view")
    except ResourceNotAvailableException:
        return redirect("error_resourcenotavailable_view")
    return JSONResponse(data, 'user')
    
@rinor_isconfigured
def rinor_account_user_del(request, id):
    try:
        data = Accounts.del_user(id)
    except BadStatusLine:
        return redirect("error_badstatusline_view")
    except ResourceNotAvailableException:
        return redirect("error_resourcenotavailable_view")
    return JSONResponse(data, 'user')

@rinor_isconfigured
def rinor_account_user_password(request, id, old, new):
    try:
        data = Accounts.password_user(id, old, new)
    except BadStatusLine:
        return redirect("error_badstatusline_view")
    except ResourceNotAvailableException:
        return redirect("error_resourcenotavailable_view")
    return JSONResponse(data, 'user')

    
@rinor_isconfigured
def rinor_account_person_add(request, first_name, last_name):
    try:
        data = Accounts.add_person(first_name, last_name)
    except BadStatusLine:
        return redirect("error_badstatusline_view")
    except ResourceNotAvailableException:
        return redirect("error_resourcenotavailable_view")
    return JSONResponse(data, 'person')

@rinor_isconfigured
def rinor_account_person_update(request, id, first_name, last_name):
    try:
        data = Accounts.update_person(id, first_name, last_name)
    except BadStatusLine:
        return redirect("error_badstatusline_view")
    except ResourceNotAvailableException:
        return redirect("error_resourcenotavailable_view")
    return JSONResponse(data, 'person')
    
@rinor_isconfigured
def rinor_account_person_del(request, id):
    try:
        data = Accounts.del_person(id)
    except BadStatusLine:
        return redirect("error_badstatusline_view")
    except ResourceNotAvailableException:
        return redirect("error_resourcenotavailable_view")
    return JSONResponse(data, 'person')
    
@rinor_isconfigured
def rinor_plugin_list(request):
    try:
        data = Plugins.get_all()
    except BadStatusLine:
        return redirect("error_badstatusline_view")
    except ResourceNotAvailableException:
        return redirect("error_resourcenotavailable_view")
    return JSONResponse(data, 'plugin')

@rinor_isconfigured
def rinor_plugin_detail(request, host, name):
    try:
        data = Plugins.get_detail(host, name)
    except BadStatusLine:
        return redirect("error_badstatusline_view")
    except ResourceNotAvailableException:
        return redirect("error_resourcenotavailable_view")
    return JSONResponse(data, 'plugin')

@rinor_isconfigured
def rinor_plugin_config(request, host, name, key=None):
    try:
        if key:
            data = Plugins.get_config_bykey(host, name, key)
        else:
            data = Plugins.get_config(host, name)            
    except BadStatusLine:
        return redirect("error_badstatusline_view")
    except ResourceNotAvailableException:
        return redirect("error_resourcenotavailable_view")
    return JSONResponse(data, 'config')

@rinor_isconfigured
def rinor_plugin_config_del(request, host, name, key=None):
    try:
        if key:
            data = Plugins.del_config_bykey(host, name, key)
        else:
            data = Plugins.del_config(host, name)
    except BadStatusLine:
        return redirect("error_badstatusline_view")
    except ResourceNotAvailableException:
        return redirect("error_resourcenotavailable_view")
    return JSONResponse(data, 'config')

@rinor_isconfigured
def rinor_plugin_config_set(request, host, name, key, value):
    try:
        data = Plugins.set_config(host, name, key, value)
    except BadStatusLine:
        return redirect("error_badstatusline_view")
    except ResourceNotAvailableException:
        return redirect("error_resourcenotavailable_view")
    return JSONResponse(data, 'config')

@rinor_isconfigured
def rinor_plugin_command(request, command, host, name):
    try:
        data = Plugins.command(command, host, name)
    except BadStatusLine:
        return redirect("error_badstatusline_view")
    except ResourceNotAvailableException:
        return redirect("error_resourcenotavailable_view")
    return JSONResponse(data, 'plugin')
    
@rinor_isconfigured
def rinor_featureassociation_del(request, id):
    try:
        data = FeatureAssociations.del_by_id(id)
    except BadStatusLine:
        return redirect("error_badstatusline_view")
    except ResourceNotAvailableException:
        return redirect("error_resourcenotavailable_view")
    return JSONResponse(data, 'feature_association')

@rinor_isconfigured
def rinor_featureassociation_del_association(request, association_type, association_id):
    try:
        data = FeatureAssociations.del_by_association(association_type, association_id)
    except BadStatusLine:
        return redirect("error_badstatusline_view")
    except ResourceNotAvailableException:
        return redirect("error_resourcenotavailable_view")
    return JSONResponse(data, 'feature_association')
    
@rinor_isconfigured
def rinor_featureassociation_add(request, feature_id, association_type, association_id):
    try:
        data = FeatureAssociations.add(feature_id, association_type, association_id)
    except BadStatusLine:
        return redirect("error_badstatusline_view")
    except ResourceNotAvailableException:
        return redirect("error_resourcenotavailable_view")
    return JSONResponse(data, 'feature_association')

@rinor_isconfigured
def rinor_featureassociation_list(request, type, id=None):
    try:
        if (type == 'house'):
            data = FeatureAssociations.get_by_house()
        elif (type == 'area'):
            data = FeatureAssociations.get_by_area(id)
        elif (type == 'room'):
            data = FeatureAssociations.get_by_room(id)
        elif (type == 'feature'):
            data = FeatureAssociations.get_by_room(id)
    except BadStatusLine:
        return redirect("error_badstatusline_view")
    except ResourceNotAvailableException:
        return redirect("error_resourcenotavailable_view")
    return JSONResponse(data, 'feature_association')

@rinor_isconfigured
def rinor_featureassociation_listdeep(request, type, id=None):
    try:
        if (type == 'house'):
            data = FeatureAssociations.get_by_house_deep()
        elif (type == 'area'):
            data = FeatureAssociations.get_by_area_deep(id)
    except BadStatusLine:
        return redirect("error_badstatusline_view")
    except ResourceNotAvailableException:
        return redirect("error_resourcenotavailable_view")
    return JSONResponse(data, 'feature_association')
    
@rinor_isconfigured
def rinor_uiconfig_del(request, reference, id):
    try:
        data = UIConfigs.del_by_reference(reference, id)
    except BadStatusLine:
        return redirect("error_badstatusline_view")
    except ResourceNotAvailableException:
        return redirect("error_resourcenotavailable_view")
    return JSONResponse(data, 'ui_config')

@rinor_isconfigured
def rinor_uiconfig_set(request, name, reference, key, value):
    try:
        data = UIConfigs.set(name, reference, key, value)
    except BadStatusLine:
        return redirect("error_badstatusline_view")
    except ResourceNotAvailableException:
        return redirect("error_resourcenotavailable_view")
    return JSONResponse(data, 'ui_config')

@rinor_isconfigured
def rinor_uiconfig_list(request, reference, id):
    try:
        data = UIConfigs.list_by_reference(reference, id)
    except BadStatusLine:
        return redirect("error_badstatusline_view")
    except ResourceNotAvailableException:
        return redirect("error_resourcenotavailable_view")
    return JSONResponse(data, 'ui_config')
    
@rinor_isconfigured
def rinor_feature_list(request, id):
    try:
        data = Features.get_by_id(id)
    except BadStatusLine:
        return redirect("error_badstatusline_view")
    except ResourceNotAvailableException:
        return redirect("error_resourcenotavailable_view")
    return JSONResponse(data, 'feature')

@rinor_isconfigured
def rinor_feature_list_bydevice(request, id):
    try:
        data = Features.get_by_device(id)
    except BadStatusLine:
        return redirect("error_badstatusline_view")
    except ResourceNotAvailableException:
        return redirect("error_resourcenotavailable_view")
    return JSONResponse(data, 'feature')
    
@rinor_isconfigured
def rinor_helper(request, parameters):
    try:
        data = Helper.get(parameters)
    except BadStatusLine:
        return redirect("error_badstatusline_view")
    except ResourceNotAvailableException:
        return redirect("error_resourcenotavailable_view")
    return JSONResponse(data, 'helper')
    
@rinor_isconfigured
def rinor_area_add(request, name, description):
    try:
        data = Areas.add(name, description)
    except BadStatusLine:
        return redirect("error_badstatusline_view")
    except ResourceNotAvailableException:
        return redirect("error_resourcenotavailable_view")
    return JSONResponse(data, 'area')

@rinor_isconfigured
def rinor_area_update(request, id, name, description):
    try:
        data = Areas.update(id, name, description)
    except BadStatusLine:
        return redirect("error_badstatusline_view")
    except ResourceNotAvailableException:
        return redirect("error_resourcenotavailable_view")
    return JSONResponse(data, 'area')
    
@rinor_isconfigured
def rinor_area_del(request, id):
    try:
        data = Areas.del_by_id(id)
    except BadStatusLine:
        return redirect("error_badstatusline_view")
    except ResourceNotAvailableException:
        return redirect("error_resourcenotavailable_view")
    return JSONResponse(data, 'area')
    
@rinor_isconfigured
def rinor_device_add(request, name, address, type_id, usage_id, description, reference):
    try:
        data = Devices.add(name, address, type_id, usage_id, description, reference)
    except BadStatusLine:
        return redirect("error_badstatusline_view")
    except ResourceNotAvailableException:
        return redirect("error_resourcenotavailable_view")
    return JSONResponse(data, 'device')

@rinor_isconfigured
def rinor_device_del(request, id):
    try:
        data = Devices.del_by_id(id)
    except BadStatusLine:
        return redirect("error_badstatusline_view")
    except ResourceNotAvailableException:
        return redirect("error_resourcenotavailable_view")
    return JSONResponse(data, 'device')
    
@rinor_isconfigured
def rinor_device_update(request, id, name, address, usage_id, description, reference):
    try:
        data = Devices.update(id, name, address, usage_id, description, reference)
    except BadStatusLine:
        return redirect("error_badstatusline_view")
    except ResourceNotAvailableException:
        return redirect("error_resourcenotavailable_view")
    return JSONResponse(data, 'device')

@rinor_isconfigured
def rinor_room_add(request, name, description):
    try:
        data = Rooms.add(name, description)
    except BadStatusLine:
        return redirect("error_badstatusline_view")
    except ResourceNotAvailableException:
        return redirect("error_resourcenotavailable_view")
    return JSONResponse(data, 'room')

@rinor_isconfigured
def rinor_room_update(request, id, name, description):
    try:
        data = Rooms.update(id, name, description)
    except BadStatusLine:
        return redirect("error_badstatusline_view")
    except ResourceNotAvailableException:
        return redirect("error_resourcenotavailable_view")
    return JSONResponse(data, 'room')
    
@rinor_isconfigured
def rinor_room_update_area(request, id, area_id):
    try:
        data = Rooms.update_area(id, area_id)
    except BadStatusLine:
        return redirect("error_badstatusline_view")
    except ResourceNotAvailableException:
        return redirect("error_resourcenotavailable_view")
    return JSONResponse(data, 'room')
    
@rinor_isconfigured
def rinor_room_del(request, id):
    try:
        data = Rooms.del_by_id(id)
    except BadStatusLine:
        return redirect("error_badstatusline_view")
    except ResourceNotAvailableException:
        return redirect("error_resourcenotavailable_view")
    return JSONResponse(data, 'room')
    
@rinor_isconfigured
def rinor_package_update_cache(request):
    try:
        data = Packages.update_cache()
    except BadStatusLine:
        return redirect("error_badstatusline_view")
    except ResourceNotAvailableException:
        return redirect("error_resourcenotavailable_view")
    return JSONResponse(data, 'package')