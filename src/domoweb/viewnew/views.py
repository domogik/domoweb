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
from django.utils.http import urlquote
from django.http import HttpResponseRedirect
from django.shortcuts import render_to_response
from django.shortcuts import redirect
from django.template import RequestContext
from django.utils.translation import ugettext_lazy as _
from django.utils.translation import ugettext
from django.conf import settings
from domoweb.utils import *
from domoweb.rinor.pipes import *
from domoweb.models import Widget

def page(request, id=1):
    """
    Method called when a ui page is accessed
    @param request : HTTP request
    @return an HttpResponse object
    """

    page = PagePipe().get_pk(id)
    page_path = PagePipe().get_path(id)
    page_title = page.name

    widgets_list = Widget.objects.all()

    usageDict = DeviceUsagePipe().get_dict()
    typeDict = DeviceTypePipe().get_dict()


    return go_to_page(
        request, 'page.html',
        page_title,
        widgets=widgets_list,
        device_types=typeDict,
        device_usages=usageDict,
        page=page,
        page_path=page_path
    )
