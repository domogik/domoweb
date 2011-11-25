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


@author: Cédric Trévisan <cedric@domogik.org>
@copyright: (C) 2007-2011 Domogik project
@license: GPL(v3)
@organization: Domogik
"""

from django.conf.urls.defaults import *
from django.conf import settings

urlpatterns = patterns('domoweb.views',
    url(r'^$', 'index', name="index_view"),
    url(r'error/BadStatusLine$', 'error_badstatusline', name="error_badstatusline_view"),
    url(r'error/ResourceNotAvailable$', 'error_resourcenotavailable', name="error_resourcenotavailable_view"),
    url(r'error/BadDomogikVersion$', 'error_baddomogikversion', name="error_baddomogikversion_view"),
    url(r'^config/welcome$', 'config_configserver', name="config_welcome_view"),
    url(r'^config/configserver$', 'config_configserver', name="config_configserver_view"),
    url(r'^config/testserver$', 'config_testserver', name="config_testserve_view"),
)
urlpatterns += patterns('',
    (r'^view/', include('domoweb.view.urls')),
    (r'^admin/', include('domoweb.admin.urls')),
    (r'^rinor/', include('domoweb.rinor.urls')),
    (r'^commands$', 'rpc4django.views.serve_rpc_request'),
)