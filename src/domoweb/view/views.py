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

from django_pipes.exceptions import ResourceNotAvailableException
from httplib import BadStatusLine

@rinor_isconfigured
def house(request):
    """
    Method called when the show index page is accessed
    @param request : HTTP request
    @return an HttpResponse object
    """

    page_title = _("View House")
    page_messages = []

    widgets_list = settings.WIDGETS_LIST

    try:
        usageDict = DeviceUsagePipe().get_dict()
        typeDict = DeviceTypePipe().get_dict()

        areas = AreaExtendedPipe().get_list()
        rooms = RoomExtendedPipe().get_list_noarea()

        house = UiConfigPipe().get_filtered(name='house')[0]

    except BadStatusLine:
        return redirect("error_badstatusline_view")
    except ResourceNotAvailableException:
        return redirect("error_resourcenotavailable_view")
    return go_to_page(
        request, 'house.html',
        page_title,
        page_messages,
        widgets=widgets_list,
        nav1_show = "selected",
        device_types=typeDict,
        device_usages=usageDict,
        areas_list=areas,
        rooms_list=rooms,
        house_name=house.value
    )

@admin_required
def house_edit(request, from_page):
    """
    Method called when the show index page is accessed
    @param request : HTTP request
    @return an HttpResponse object
    """

    page_title = _("Edit House")
    page_messages = []

    widgets_list = settings.WIDGETS_LIST

    try:
        house = UiConfigPipe().get_filtered(name='house')[0]
        devices = DeviceExtendedPipe().get_list()
    except BadStatusLine:
        return redirect("error_badstatusline_view")
    except ResourceNotAvailableException:
        return redirect("error_resourcenotavailable_view")
    return go_to_page(
        request, 'house.edit.html',
        page_title,
        page_messages,
        widgets=widgets_list,
        nav1_show = "selected",
        from_page = from_page,
        house_name=house.value,
        devices_list=devices
    )

@rinor_isconfigured
def area(request, area_id):
    """
    Method called when the show area page is accessed
    @param request : HTTP request
    @return an HttpResponse object
    """

    page_messages = []

    widgets_list = settings.WIDGETS_LIST

    try:
        usageDict = DeviceUsagePipe().get_dict()
        typeDict = DeviceTypePipe().get_dict()

        area = AreaExtendedPipe().get_pk(area_id)

        house = UiConfigPipe().get_filtered(name='house')[0]

    except BadStatusLine:
        return redirect("error_badstatusline_view")
    except ResourceNotAvailableException:
        return redirect("error_resourcenotavailable_view")

    page_title = _("View ") + area.name
    return go_to_page(
        request, 'area.html',
        page_title,
        page_messages,
        widgets=widgets_list,
        nav1_show = "selected",
        device_types=typeDict,
        device_usages=usageDict,
        area=area,
        house_name=house.value
    )

@rinor_isconfigured
@admin_required
def area_edit(request, area_id, from_page):
    """
    Method called when the show area page is accessed
    @param request : HTTP request
    @return an HttpResponse object
    """

    page_messages = []
    widgets_list = settings.WIDGETS_LIST

    try:
        area = AreaExtendedPipe().get_pk(area_id)
        house = UiConfigPipe().get_filtered(name='house')[0]        
        devices = DeviceExtendedPipe().get_list()

    except BadStatusLine:
        return redirect("error_badstatusline_view")
    except ResourceNotAvailableException:
        return redirect("error_resourcenotavailable_view")

    page_title = _("Edit ") + area.name
    return go_to_page(
        request, 'area.edit.html',
        page_title,
        page_messages,
        widgets=widgets_list,
        nav1_show = "selected",
        from_page = from_page,
        area=area,
        house_name=house.value,
        devices_list=devices
    )

@rinor_isconfigured
def room(request, room_id):
    """
    Method called when the show room page is accessed
    @param request : HTTP request
    @return an HttpResponse object
    """
    
    page_messages = []
    widgets_list = settings.WIDGETS_LIST

    try:
        usageDict = DeviceUsagePipe().get_dict()
        typeDict = DeviceTypePipe().get_dict()

        room = RoomExtendedPipe().get_pk(room_id)

        house = UiConfigPipe().get_filtered(name='house')[0]        

    except BadStatusLine:
        return redirect("error_badstatusline_view")
    except ResourceNotAvailableException:
        return redirect("error_resourcenotavailable_view")

    page_title = _("View ") + room.name
    return go_to_page(
        request, 'room.html',
        page_title,
        page_messages,
        widgets=widgets_list,
        nav1_show = "selected",
        device_types=typeDict,
        device_usages=usageDict,
        room=room,
        house=house.value
    )

@rinor_isconfigured
@admin_required
def room_edit(request, room_id, from_page):
    """
    Method called when the show room page is accessed
    @param request : HTTP request
    @return an HttpResponse object
    """

    page_messages = []
    widgets_list = settings.WIDGETS_LIST

    try:
        room = RoomExtendedPipe().get_pk(room_id)
        house = UiConfigPipe().get_filtered(name='house')[0]        
        devices = DeviceExtendedPipe().get_list()

    except BadStatusLine:
        return redirect("error_badstatusline_view")
    except ResourceNotAvailableException:
        return redirect("error_resourcenotavailable_view")

    page_title = _("Edit ") + room.name
    return go_to_page(
        request, 'room.edit.html',
        page_title,
        page_messages,
        widgets=widgets_list,
        nav1_show = "selected",
        from_page = from_page,
        room=room,
        house_name=house.value,
        devices_list=devices
    )
