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
from django.utils.translation import ugettext as _
from django import forms
from domoweb.utils import *
from domoweb.rinor.pipes import *
from domoweb.models import Widget

# Page configuration form
class PageForm(forms.Form):
    name = forms.CharField(max_length=50, label=_("Page name"), widget=forms.TextInput(attrs={'class':'icon32-form-tag'}), required=True)
    description = forms.CharField(label=_("Page description"), widget=forms.Textarea(attrs={'class':'icon32-form-edit'}), required=False)
    icon = forms.CharField(max_length=50, label=_("Page icon"), required=False)
    
    def clean(self):
        return self.cleaned_data

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

@admin_required
def page_configuration(request, id):
    """
    Method called when a ui page configuration is accessed
    @param request : HTTP request
    @return an HttpResponse object
    """

    page = PagePipe().get_pk(id)
    page_title = "%s %s" % (page.name, _("Configuration"))

    if request.method == 'POST': # If the form has been submitted...
        form = PageForm(request.POST) # A form bound to the POST data
        if form.is_valid(): # All validation rules pass
            cd = form.cleaned_data
            params = {'name': cd["name"], 'description': cd["description"], 'icon': cd["icon"]}
            PagePipe().put_detail(id, params)
            
            return redirect('page_view', id=id) # Redirect after POST
    else:
        form = PageForm(initial={'name': page.name, 'description': page.description, 'icon': page.icon})
        
    return go_to_page(
        request, 'configuration.html',
        page_title,
        page=page,
        form=form
    )

@admin_required
def page_elements(request, id):
    """
    Method called when a ui page widgets is accessed
    @param request : HTTP request
    @return an HttpResponse object
    """

    page = PagePipe().get_pk(id)
    page_title = "%s %s" % (page.name, _("Widgets"))

    return go_to_page(
        request, 'elements.html',
        page_title,
        page=page,
    )