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

from domoweb.rest import (
    House, Areas, Rooms, Devices, DeviceUsages, DeviceTechnologies, DeviceTypes,
    Features, FeatureAssociations, Plugins, Accounts, Rest, Packages
)

from django_pipes.exceptions import ResourceNotAvailableException
from httplib import BadStatusLine

def index(request):
    """
    Method called when the main page is accessed
    @param request : the HTTP request
    @return an HttpResponse object
    """

    page_title = _("Domogik")
    page_messages = []

    widgets_list = settings.WIDGETS_LIST

    try:
        device_types =  DeviceTypes.get_dict()
        device_usages =  DeviceUsages.get_dict()

        result_all_areas = Areas.get_all()
        result_all_areas.merge_rooms()
        result_all_areas.merge_uiconfig()

        result_house = House()

        result_house_rooms = Rooms.get_without_area()
        result_house_rooms.merge_uiconfig()

    except BadStatusLine:
        return HttpResponseRedirect("/rinor/error/BadStatusLine")
    except ResourceNotAvailableException:
        return HttpResponseRedirect("/rinor/error/ResourceNotAvailable")

    return go_to_page(
        request, 'index.html',
        page_title,
        page_messages,
        widgets=widgets_list,
        device_types=device_types,
        device_usages=device_usages,
        areas_list=result_all_areas.area,
        rooms_list=result_house_rooms.room,
        house=result_house
    )