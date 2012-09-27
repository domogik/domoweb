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


urlpatterns = patterns('domoweb.admin.views',
    url(r'login/$', 'login', name='login_view'),
    url(r'logout/$', 'logout', name='logout_view'),

    url(r'^$', 'admin_organization_pages', name="admin_index_view"),
    url(r'management/accounts/$', 'admin_management_accounts', name="admin_management_accounts_view"),
    url(r'organization/$', 'admin_organization_pages', name="admin_organization_view"),
    url(r'organization/devices/$', 'admin_organization_devices', name="admin_organization_devices_view"),
    url(r'organization/pages/$', 'admin_organization_pages', name="admin_organization_pages_view"),
    url(r'plugin/(?P<plugin_host>[a-zA-Z0-9_.-]+)/(?P<plugin_id>[a-zA-Z0-9_.-]+)/(?P<plugin_type>\w+)/$', 'admin_plugins_plugin', name="admin_plugins_plugin_view"),
    url(r'core/helpers/$', 'admin_core_helpers', name="admin_core_helpers_view"),
    url(r'core/rinor/$', 'admin_core_rinor', name="admin_core_rinor_view"),
    url(r'core/pyinfo/$', 'admin_core_pyinfo', name="admin_core_pyinfo_view"),
    url(r'core/djangoinfo/$', 'admin_core_djangoinfo', name="admin_core_djangoinfo_view"),
    url(r'core/domowebdata/$', 'admin_core_domowebdata', name="admin_core_domowebdata_view"),
    url(r'host/(?P<id>[a-zA-Z0-9_.-]+)/$', 'admin_host', name="admin_host_view"),
    url(r'resource/icon/package/installed/(?P<type>(plugin|external))/(?P<id>[\w\d_-]+)$', 'admin_resource_icon_package_installed', name="admin_resource_icon_package_installed_view"),
    url(r'resource/icon/package/available/(?P<type>(plugin|external))/(?P<id>[\w\d_-]+)/(?P<version>.+)$', 'admin_resource_icon_package_available', name="admin_resource_icon_package_available_view"),
    url(r'core/devicesstats/$','admin_core_devicesstats',name='admin_devicesstats_view'),
)
