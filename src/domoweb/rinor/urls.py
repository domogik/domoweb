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

from django.conf.urls.defaults import *

urlpatterns = patterns('domoweb.rinor.views',
    url(r'info/$', 'rinor_info'),
    url(r'account/user/list/$', 'rinor_account_users_list'),
    url(r'account/user/add/login/(?P<login>[a-zA-Z0-9_.-]+)/password/(?P<password>[a-zA-Z0-9_.-]+)/is_admin/(?P<is_admin>(True|False))/first_name/(?P<first_name>[a-zA-Z0-9_.-]+)/last_name/(?P<last_name>[a-zA-Z0-9_.-]+)/$', 'rinor_account_user_add'),
    url(r'account/user/update/id/(?P<id>\d+)/login/(?P<login>[a-zA-Z0-9_.-]+)/password/(?P<password>[a-zA-Z0-9_.-]+)/is_admin/(?P<is_admin>(True|False))/first_name/(?P<first_name>[a-zA-Z0-9_.-]+)/last_name/(?P<last_name>[a-zA-Z0-9_.-]+)/$', 'rinor_account_user_update'),
    url(r'account/user/del/(?P<id>\d+)/$', 'rinor_account_user_del'),
    url(r'account/user/password/id/(?P<id>\d+)/old/(?P<old>[a-zA-Z0-9_.-]+)/new/(?P<new>[a-zA-Z0-9_.-]+)/$', 'rinor_account_user_password'),
    url(r'account/person/add/first_name/(?P<first_name>[a-zA-Z0-9_.-]+)/last_name/(?P<last_name>[a-zA-Z0-9_.-]+)/$', 'rinor_account_person_add'),
    url(r'account/person/update/id/(?P<id>\d+)/first_name/(?P<first_name>[a-zA-Z0-9_.-]+)/last_name/(?P<last_name>[a-zA-Z0-9_.-]+)/$', 'rinor_account_person_update'),
    url(r'account/person/del/(?P<id>\d+)/$', 'rinor_account_person_del'),
    url(r'plugin/list/$', 'rinor_plugin_list'),
    url(r'plugin/detail/(?P<host>[a-zA-Z0-9_.-]+)/(?P<name>[a-zA-Z0-9_.-]+)/$', 'rinor_plugin_detail'),
    url(r'plugin/config/list/by-name/(?P<host>[a-zA-Z0-9_.-]+)/(?P<name>[a-zA-Z0-9_.-]+)/$', 'rinor_plugin_config'),
    url(r'plugin/config/list/by-name/(?P<host>[a-zA-Z0-9_.-]+)/(?P<name>[a-zA-Z0-9_.-]+)/by-key/(?P<key>[a-zA-Z0-9_.-]+)/$', 'rinor_plugin_config'),
    url(r'plugin/config/del/(?P<host>[a-zA-Z0-9_.-]+)/(?P<name>[a-zA-Z0-9_.-]+)/$', 'rinor_plugin_config_del'),
    url(r'plugin/config/del/(?P<host>[a-zA-Z0-9_.-]+)/(?P<name>[a-zA-Z0-9_.-]+)/by-key/(?P<key>[a-zA-Z0-9_.-]+)/$', 'rinor_plugin_config_del'),
    url(r'plugin/config/set/hostname/(?P<host>[a-zA-Z0-9_.-]+)/name/(?P<name>[a-zA-Z0-9_.-]+)/key/(?P<key>[a-zA-Z0-9_.-]+)/value/(?P<value>[a-zA-Z0-9_.-]+)/$', 'rinor_plugin_config_set'),
    url(r'plugin/(?P<command>(start|stop))/(?P<host>[a-zA-Z0-9_.-]+)/(?P<name>[a-zA-Z0-9_.-]+)/$', 'rinor_plugin_command'),
    url(r'command/(?P<techno>[a-zA-Z0-9_.-]+)/(?P<address>[a-zA-Z0-9_.-]+)/(?P<command>[a-zA-Z0-9_.-]+)/(?P<values>.*)$', 'rinor_command'),
    url(r'state/(?P<device_id>\d+)/(?P<key>[a-zA-Z0-9_.-]+)/last/(?P<nb>\d+)/$', 'rinor_state_last'),
    url(r'state/(?P<device_id>\d+)/(?P<key>[a-zA-Z0-9_.-]+)/from/(?P<fromtime>\d+)/to/(?P<totime>\d+)/interval/(?P<interval>(year|month|week|day|hour|minute|second))/selector/(?P<selector>(min|max|avg|first|last))/$', 'rinor_state_interval'),    
    url(r'base/feature_association/del/id/(?P<id>\d+)/$', 'rinor_featureassociation_del'),
    url(r'base/feature_association/del/association_type/(?P<association_type>(house|area|room))/association_id/(?P<association_id>\d+)/$', 'rinor_featureassociation_del_association'),
    url(r'base/feature_association/add/feature_id/(?P<feature_id>\d+)/association_type/(?P<association_type>(house|area|room))/association_id/(?P<association_id>\d+)/$', 'rinor_featureassociation_add'),
    url(r'base/feature_association/list/by-(?P<type>(house|area|room|feature))/(?P<id>\d+)/$', 'rinor_featureassociation_list'),
    url(r'base/feature_association/listdeep/by-house/$', 'rinor_featureassociation_listdeep', {'type':'house'}),
    url(r'base/feature_association/listdeep/by-area/(?P<id>\d+)/$', 'rinor_featureassociation_listdeep', {'type':'area'}),
    url(r'base/ui_config/del/by-reference/(?P<reference>[a-zA-Z0-9_.-]+)/(?P<id>[a-zA-Z0-9_.-]+)/$', 'rinor_uiconfig_del'),
    url(r'base/ui_config/set/name/(?P<name>[a-zA-Z0-9_.-]+)/reference/(?P<reference>[a-zA-Z0-9_.-]+)/key/(?P<key>[a-zA-Z0-9_.-]+)/value/(?P<value>[a-zA-Z0-9_.-]+)/$', 'rinor_uiconfig_set'),
    url(r'base/ui_config/list/by-reference/(?P<reference>[a-zA-Z0-9_.-]+)/(?P<id>[a-zA-Z0-9_.-]+)/$', 'rinor_uiconfig_list'),
    url(r'base/feature/list/by-id/(?P<id>\d+)/$', 'rinor_feature_list'),
    url(r'base/feature/list/by-device_id/(?P<id>\d+)/$', 'rinor_feature_list_bydevice'),
    url(r'helper/(?P<parameters>.*)$', 'rinor_helper'),
    url(r'base/area/add/name/(?P<name>[a-zA-Z0-9_.-]+)/description/(?P<description>[a-zA-Z0-9_.-]+)/$', 'rinor_area_add'),
    url(r'base/area/update/id/(?P<id>\d+)/name/(?P<name>[a-zA-Z0-9_.-]+)/description/(?P<description>[a-zA-Z0-9_.-]+)/$', 'rinor_area_update'),
    url(r'base/area/del/(?P<id>\d+)/$', 'rinor_area_del'),
    url(r'base/device/add/name/(?P<name>[a-zA-Z0-9_.-]+)/address/(?P<address>[a-zA-Z0-9_.-]+)/type_id/(?P<type_id>[a-zA-Z0-9_.-]+)/usage_id/(?P<usage_id>[a-zA-Z0-9_.-]+)/description/(?P<description>[a-zA-Z0-9_.-]+)/reference/(?P<reference>[a-zA-Z0-9_.-]+)/$', 'rinor_device_add'),
    url(r'base/device/del/(?P<id>\d+)/$', 'rinor_device_del'),
    url(r'base/device/update/id/(?P<id>\d+)/name/(?P<name>[a-zA-Z0-9_.-]+)/address/(?P<address>[a-zA-Z0-9_.-]+)/usage_id/(?P<usage_id>[a-zA-Z0-9_.-]+)/description/(?P<description>[a-zA-Z0-9_.-]+)/reference/(?P<reference>[a-zA-Z0-9_.-]+)/$', 'rinor_device_update'),
    url(r'base/room/add/name/(?P<name>[a-zA-Z0-9_.-]+)/description/(?P<description>[a-zA-Z0-9_.-]+)/$', 'rinor_room_add'),
    url(r'base/room/update/id/(?P<id>\d+)/name/(?P<name>[a-zA-Z0-9_.-]+)/description/(?P<description>[a-zA-Z0-9_.-]+)/$', 'rinor_room_update'),
    url(r'base/room/update/id/(?P<id>\d+)/area_id/(?P<area_id>\d+)/$', 'rinor_room_update_area'),
    url(r'base/room/del/(?P<id>\d+)/$', 'rinor_room_del'),
    url(r'package/update-cache/$', 'rinor_package_update_cache'),
)
