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
import socket
import urllib

from django.utils.http import urlquote
from django.http import HttpResponseRedirect
from django.shortcuts import render_to_response
from django.shortcuts import redirect
from django.template import RequestContext
from django.utils.translation import ugettext_lazy as _
from django.utils.translation import ugettext
from django.conf import settings
from django import forms
from domoweb.models import Parameters, Widget
from domoweb.utils import *
from domoweb.rinor.pipes import *

def index(request):
    """
    Method called when the main page is accessed
    @param request : the HTTP request
    @return an HttpResponse object
    """

    page_title = _("Domogik")
    page_messages = []

    widgets_list = Widget.objects.all()
    usageDict = DeviceUsagePipe().get_dict()
    typeDict = DeviceTypePipe().get_dict()

    areas = AreaExtendedPipe().get_list()
    rooms = RoomExtendedPipe().get_list_noarea()

    house_name = UiConfigPipe().get_house()

    return go_to_page(
        request, 'index.html',
        page_title,
        page_messages,
        widgets=widgets_list,
        device_types=typeDict,
        device_usages=usageDict,
        areas_list=areas,
        rooms_list=rooms,
        house_name=house_name
    )

### Domogik Server configuration form
class DomogikSetupForm(forms.Form):
    ip = forms.IPAddressField(max_length=15, label="Server IP address")
    port = forms.DecimalField(decimal_places=0, min_value=0, label="Server port")
    
    def clean(self):
        cleaned_data = self.cleaned_data
        ip = cleaned_data.get("ip")
        port = cleaned_data.get("port")
        if ip and port:
            # Check RINOR Server access
            url = "http://%s:%s/" % (ip,port)
            try:
                filehandle = urllib.urlopen(url)
            except IOError:
                raise forms.ValidationError("Can not connect the Domogik server, please check ip")

        # Always return the full collection of cleaned data.
        return cleaned_data

def config_welcome(request):
    """
    @param request : the HTTP request
    @return an HttpResponse object
    """

    page_title = _("Domogik - Free home automation under Linux")
    page_messages = []

    return go_to_page(
        request, 'config/welcome.html',
        page_title,
        page_messages,
    )

def config_configserver(request):
    """
    @param request : the HTTP request
    @return an HttpResponse object
    """

    page_title = _("1. Domogik server configuration")
    page_messages = []

    if request.method == 'POST': # If the form has been submitted...
        form = DomogikSetupForm(request.POST) # A form bound to the POST data
        if form.is_valid(): # All validation rules pass
            cd = form.cleaned_data
            p = Parameters(key='rinor_ip', value=cd["ip"])
            p.save();
            p = Parameters(key='rinor_port', value=cd["port"])
            p.save();
            return redirect('config_testserve_view') # Redirect after POST
    else:
        ip = request.META['HTTP_HOST'].split(':')[0]
        if (not ipFormatChk(ip)) :
            ip = socket.gethostbyname(ip)
        form = DomogikSetupForm(initial={'ip': ip, 'port': 40405}) # An unbound form
    
    return go_to_page(
        request, 'config/configserver.html',
        page_title,
        page_messages,
        form=form,
    )

def config_testserver(request):
    """
    @param request : the HTTP request
    @return an HttpResponse object
    """

    page_title = _("2. Testing Domogik server")
    page_messages = []
    
    return go_to_page(
        request, 'config/testserver.html',
        page_title,
        page_messages,
    )