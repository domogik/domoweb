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
from django.utils.translation import ugettext_lazy
from django.utils.translation import ugettext as _
from django.conf import settings
from django import forms
from django.forms.widgets import Select
from domoweb.models import Parameter
from domoweb.utils import *
from domoweb.rinor.pipes import *
from domoweb.signals import rinor_changed
from django.utils.encoding import force_unicode
from django.utils.html import escape, conditional_escape

### Domogik Server configuration form
class RINORSetupForm(forms.Form):
    ip = forms.IPAddressField(max_length=15, label="Server IP address")
    port = forms.DecimalField(decimal_places=0, min_value=0, label="Server port")
    prefix = forms.CharField(max_length=50, label="Url prefix (without '/')", required=False)
                             
    def clean(self):
        cleaned_data = self.cleaned_data
        ip = cleaned_data.get("ip")
        port = cleaned_data.get("port")
        prefix = cleaned_data.get("prefix")
        if ip and port:
            # Check RINOR Server access
            if prefix:
                url = "http://%s:%s/%s/" % (ip, port, prefix)
            else:
                url = "http://%s:%s/" % (ip, port)
            try:
                filehandle = urllib.urlopen(url)
            except IOError:
                raise forms.ValidationError("Can not connect the Domogik server, please check ip")

        # Always return the full collection of cleaned data.
        return cleaned_data

class SelectIcon(Select):
    def render_option(self, selected_choices, option_value, option_label):
        option_value = force_unicode(option_value)
        class_html = ' class="icon16-language-%s"' % option_value
        if option_value in selected_choices:
            selected_html = ' selected="selected"'
            if not self.allow_multiple_selected:
                # Only allow for a single selection.
                selected_choices.remove(option_value)
        else:
            selected_html = ''
        return '<option value="%s"%s%s>%s</option>' % (
            escape(option_value), selected_html, class_html,
            conditional_escape(force_unicode(option_label)))


class LanguageForm(forms.Form):
    language = forms.ChoiceField(widget=SelectIcon, label="Language", choices=settings.LANGUAGES)

    def clean(self):
        cleaned_data = self.cleaned_data
        language = cleaned_data.get("language")
        
        # Always return the full collection of cleaned data.
        return cleaned_data
    
def config_welcome(request):
    """
    @param request : the HTTP request
    @return an HttpResponse object
    """

    page_title = "1. %s" % _("Select your language")
    if request.method == 'POST': # If the form has been submitted...
        form = LanguageForm(request.POST) # A form bound to the POST data
        if form.is_valid(): # All validation rules pass
            cd = form.cleaned_data
            p = Parameter(key='language', value=cd["language"])
            p.save()
            return redirect('config_configserver_view') # Redirect after POST
    else:
        try:
            _language = Parameter.objects.get(key='language')
        except Parameter.DoesNotExist:
            _language = 'en'
        else:
            _language = _language.value

        form = LanguageForm(initial={'language': _language}) # An unbound form

    return go_to_page(
        request, 'welcome.html',
        page_title,
        form=form,
    )

def config_configserver(request):
    """
    @param request : the HTTP request
    @return an HttpResponse object
    """

    page_title = "2. %s" % _("Domogik server configuration")

    if request.method == 'POST': # If the form has been submitted...
        form = RINORSetupForm(request.POST) # A form bound to the POST data
        if form.is_valid(): # All validation rules pass
            cd = form.cleaned_data
            p = Parameter(key='rinor_ip', value=cd["ip"])
            p.save()
            p = Parameter(key='rinor_port', value=cd["port"])
            p.save()
            try:
                p = Parameter.objects.get(key='rinor_prefix')
            except Parameter.DoesNotExist:
                pass
            else:
                p.delete()
            if cd["prefix"]:
                p = Parameter(key='rinor_prefix', value=cd["prefix"])
                p.save()
            rinor_changed.send(sender='config_configserver')
            return redirect('config_testserve_view') # Redirect after POST
    else:
        try:
            _ip = Parameter.objects.get(key='rinor_ip')
            _port = Parameter.objects.get(key='rinor_port')
            _prefix = Parameter.objects.get(key='rinor_prefix')
        except Parameter.DoesNotExist:
            _ip = request.META['HTTP_HOST'].split(':')[0]
            if (not ipFormatChk(_ip)) :
                _ip = socket.gethostbyname(_ip)
            _port = 40405
            _prefix = ""
        else:
            _ip = _ip.value
            _language = _port.value
            _prefix = _prefix.value
            
        form = RINORSetupForm(initial={'ip': _ip, 'port': _port, 'prefix': _prefix}) # An unbound form
    
    return go_to_page(
        request, 'configserver.html',
        page_title,
        form=form,
    )

def config_testserver(request):
    """
    @param request : the HTTP request
    @return an HttpResponse object
    """

    page_title = "3. %s" % _("Testing Domogik server")
    
    return go_to_page(
        request, 'testserver.html',
        page_title,
    )