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

from django.http import HttpResponse
from django.conf.urls.defaults import *
from django.conf import settings
from manifesto.views import ManifestView

js_info_dict = {
    'packages': ('domoweb',),
}

urlpatterns = patterns('',
    (r'^%sjsi18n/$' % settings.URL_PREFIX, 'django.views.i18n.javascript_catalog', js_info_dict),
)

urlpatterns += patterns('',
  url(r'^%smanifest\.appcache$' % settings.URL_PREFIX, ManifestView.as_view(), name="cache_manifest"),
)

urlpatterns += patterns('',
    url(r'^$', 'domoweb.view.views.page', name="index_view"),
    (r'^%srobots\.txt$' % settings.URL_PREFIX, lambda r: HttpResponse("User-agent: *\nDisallow: /", mimetype="text/plain")),
    (r'^%sconfig/' % settings.URL_PREFIX, include('domoweb.config.urls')),
    (r'^%sview/' % settings.URL_PREFIX, include('domoweb.view.urls')),
    (r'^%sadmin/' % settings.URL_PREFIX, include('domoweb.admin.urls')),
    (r'^%srinor/' % settings.URL_PREFIX, include('domoweb.rinor.urls')),
)