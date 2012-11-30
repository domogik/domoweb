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
from tastypie.api import Api
from domoweb.rinor.resources import *

rinor_api = Api(api_name='api')
rinor_api.register(FeatureResource())
rinor_api.register(StateResource())
rinor_api.register(PluginResource())
rinor_api.register(PluginDetailResource())
rinor_api.register(PluginConfigResource())
rinor_api.register(DeviceResource())
rinor_api.register(UserResource())
rinor_api.register(PersonResource())
rinor_api.register(InfoResource())
rinor_api.register(HelperResource())
rinor_api.register(PackageInstalledResource())
rinor_api.register(PackageAvailableResource())
rinor_api.register(PackageDependencyResource())
rinor_api.register(RepositoryResource())
rinor_api.register(CommandResource())
rinor_api.register(HostResource())
rinor_api.register(PageResource())

urlpatterns = patterns('',
    (r'', include(rinor_api.urls)),
)