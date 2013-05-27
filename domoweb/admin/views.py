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
import urllib
import urllib2
import pyinfo
import mimetypes
import django_tables2 as tables
from django.http import HttpResponse
from django.http import HttpResponseRedirect
from django.shortcuts import render_to_response
from django.shortcuts import redirect
from django.template import RequestContext
from django.utils.translation import ugettext_lazy as _
from django.utils.translation import ugettext
from django.contrib import messages
from django.conf import settings
from domoweb.utils import *
from domoweb.rinor.pipes import *
from domoweb.exceptions import RinorError, RinorNotConfigured
from domoweb.models import Parameter, Widget, PageIcon, WidgetInstance, PageTheme, Page

def login(request):
    """
    Login process
    @param request : HTTP request
    @return an HttpResponse object
    """
    next = request.GET.get('next', '')

    page_title = _("Login page")
    if request.method == 'POST':
        return _auth(request, next)
    else:
        users = UserPipe().get_list()
        return go_to_page(
            request, 'login.html',
            page_title,
            next=next,
            account_list=users
        )

def logout(request):
    """
    Logout process
    @param request: HTTP request
    @return an HttpResponse object
    """
    next = request.GET.get('next', '')

    request.session.clear()
    if next != '':
        return HttpResponseRedirect(next)
    else:
        return HttpResponseRedirect('/')


def _auth(request, next):
    # An action was submitted => login action
    user_login = request.POST.get("login",'')
    user_password = request.POST.get("password",'')
    try:
        account = UserPipe().get_auth(user_login, user_password)
        request.session['user'] = {
            'login': account.login,
            'is_admin': (account.is_admin == "True"),
            'first_name': account.person.first_name,
            'last_name': account.person.last_name,
            'skin_used': account.skin_used
        }
        if next != '':
            return HttpResponseRedirect(next)
        else:
            return HttpResponseRedirect('/')

    except RinorError:
        # User not found, ask again to log in
        error_msg = ugettext(u"Sorry unable to log in. Please check login name / password and try again.")
        return HttpResponseRedirect('%s/?status=error&msg=%s' % (settings.LOGIN_URL, error_msg))


@admin_required
def admin_management_accounts(request):
    """
    Method called when the admin accounts page is accessed
    @param request : HTTP request
    @return an HttpResponse object
    """
    
    page_title = _("Accounts management")
    users = UserPipe().get_list()
    people = PersonPipe().get_list()
    return go_to_page(
        request, 'management/accounts.html',
        page_title,
        nav1_admin = "selected",
        nav2_management_accounts = "selected",
        accounts_list=users,
        people_list=people
    )


@admin_required
def admin_organization_devices(request):
    """
    Method called when the admin devices organization page is accessed
    @param request : HTTP request
    @return an HttpResponse object
    """

    page_title = _("Devices organization")

    id = request.GET.get('id', 0)
    devices = DeviceExtendedPipe().get_list()
    usages = DeviceUsagePipe().get_list()
    types = DeviceTypePipe().get_list()

    return go_to_page(
        request, 'organization/devices.html',
        page_title,
        nav1_admin = "selected",
        nav2_organization_devices = "selected",
        id=id,
        devices_list=devices,
        usages_list=usages,
        types_list=types
    )

@admin_required
def admin_organization_pages(request):
    """
    Method called when the admin pages organization page is accessed
    @param request : HTTP request
    @return an HttpResponse object
    """

    page_title = _("Pages organization")

    id = request.GET.get('id', 0)
    pages = Page.objects.get_tree()

    return go_to_page(
        request, 'organization/pages.html',
        page_title,
        nav1_admin = "selected",
        nav2_organization_pages = "selected",
        id=id,
        pages_list=pages
    )

@admin_required
def admin_plugins_plugin(request, plugin_host, plugin_id, plugin_type):
    """
    Method called when the admin plugin command page is accessed
    @param request : HTTP request
    @return an HttpResponse object
    """
    
    plugin = PluginPipe().get_detail(plugin_host, plugin_id)
    if plugin_type == "plugin":
        page_title = _("Plugin")
        dependencies = PluginDependencyPipe().get_list(plugin_host, plugin_id)
        udevrules = PluginUdevrulePipe().get_list(plugin_host, plugin_id)
        return go_to_page(
            request, 'plugins/plugin.html',
            page_title,
            nav1_admin = "selected",
            nav2_plugins_plugin = "selected",
            plugin=plugin,
            dependencies=dependencies,
            udevrules=udevrules
        )
    if plugin_type == "external":
        page_title = _("External Member")
        return go_to_page(
            request, 'plugins/external.html',
            page_title,
            nav1_admin = "selected",
            nav2_plugins_plugin = "selected",
            plugin=plugin
        )


@admin_required
def admin_core_helpers(request):
    """
    Method called when the admin helpers tool page is accessed
    @param request : HTTP request
    @return an HttpResponse object
    """

    page_title = _("Helpers tools")

    return go_to_page(
        request, 'core/helpers.html',
        page_title,
        nav1_admin = "selected",
        nav2_core_helpers = "selected",
    )


@admin_required
def admin_core_rinor(request):
    """
    Method called when the admin Python Info page is accessed
    @param request : HTTP request
    @return an HttpResponse object
    """

    page_title = _("RINOR informations")

    info = InfoPipe().get_info()
    hosts = HostPipe().get_list()
    host = ''
    for h in hosts:
        if h.primary == 'True':
            host = h.id
    return go_to_page(
        request, 'core/rinor.html',
        page_title,
        nav1_admin = "selected",
        nav2_core_rinor = "selected",
        rinor=info,
        host=host
    )


@admin_required
def admin_core_pyinfo(request):
    """
    Method called when the admin Python info page is accessed
    @param request : HTTP request
    @return an HttpResponse object
    """

    page_title = _("Python informations")
    
    return go_to_page(
        request, 'core/pyinfo.html',
        page_title,
        nav1_admin = "selected",
        nav2_core_pyinfo = "selected",
        pyinfo=pyinfo.foo.fullText()
    )
    
HIDDEN_SETTINGS = re.compile('SECRET|PASSWORD|PROFANITIES_LIST|SIGNATURE')
CLEANSED_SUBSTITUTE = u'********************'

def cleanse_setting(key, value):
    """Cleanse an individual setting key/value of sensitive content.

    If the value is a dictionary, recursively cleanse the keys in
    that dictionary.
    """
    try:
        if HIDDEN_SETTINGS.search(key):
            cleansed = CLEANSED_SUBSTITUTE
        else:
            if isinstance(value, dict):
                cleansed = dict((k, cleanse_setting(k, v)) for k,v in value.items())
            else:
                cleansed = value
    except TypeError:
        # If the key isn't regex-able, just return as-is.
        cleansed = value
    return cleansed

def get_safe_settings():
    "Returns a dictionary of the settings module, with sensitive settings blurred out."
    settings_dict = {}
    for k in dir(settings):
        if k.isupper():
            settings_dict[k] = cleanse_setting(k, getattr(settings, k))
    return settings_dict


@admin_required
def admin_core_djangoinfo(request):
    """
    Method called when the admin Django Info page is accessed
    @param request : HTTP request
    @return an HttpResponse object
    """
    from django import get_version
    import sys
    
    page_title = _("Django informations")
    
    return go_to_page(
        request, 'core/djangoinfo.html',
        page_title,
        nav1_admin = "selected",
        nav2_core_djangoinfo = "selected",
        settings=get_safe_settings(),
        sys_executable=sys.executable,
        sys_version_info='%d.%d.%d' % sys.version_info[0:3],
        django_version_info=get_version(),
        sys_path=sys.path,
    )

class WidgetTable(tables.Table):
    class Meta:
        model = Widget

class ParameterTable(tables.Table):
    class Meta:
        model = Parameter

class PageIconTable(tables.Table):
    class Meta:
        model = PageIcon

class WidgetInstanceTable(tables.Table):
    class Meta:
        model = WidgetInstance

class PageThemeTable(tables.Table):
    class Meta:
        model = PageTheme

class PageTable(tables.Table):
    class Meta:
        model = Page
        
@admin_required
def admin_core_domowebdata(request):
    """
    Method called when the admin Domoweb Data page is accessed
    @param request : HTTP request
    @return an HttpResponse object
    """
    
    page_title = _("Domoweb Data")
    
    widget_table = WidgetTable(Widget.objects.all())
    parameter_table = ParameterTable(Parameter.objects.all())
    pageicon_table = PageIconTable(PageIcon.objects.all())
    widgetinstance_table = WidgetInstanceTable(WidgetInstance.objects.all())
    pagetheme_table = PageThemeTable(PageTheme.objects.all())
    page_table = PageTable(Page.objects.all())
    
    return go_to_page(
        request, 'core/domowebdata.html',
        page_title,
        nav1_admin = "selected",
        nav2_core_domowebdata = "selected",
        parameter_table = parameter_table,
        widget_table = widget_table,
        pageicon_table = pageicon_table,
        widgetinstance_table = widgetinstance_table,
        pagetheme_table = pagetheme_table,
        page_table = page_table,
    )
    
@admin_required
def admin_host(request, id):
    """
    Method called when the admin plugins page is accessed
    @param request : HTTP request
    @return an HttpResponse object
    """

    host = HostPipe().get_detail(id)
    repositories = RepositoryPipe().get_list()
        
    page_title = _("Host %s" % id)
    
    return go_to_page(
        request, 'hosts/host.html',
        page_title,
        nav1_admin = "selected",
        nav2_hosts_host = "selected",
        repositories=repositories,
        id=id,
        host=host
    )

@admin_required
def admin_resource_icon_package_installed(request, type, id):
    try:
        ip = Parameter.objects.get(key='rinor_ip')
        port = Parameter.objects.get(key='rinor_port')
    except Parameter.DoesNotExist:
        raise RinorNotConfigured
    else:
        try:
            prefix = Parameter.objects.get(key='rinor_prefix')
        except Parameter.DoesNotExist:
            uri = "http://%s:%s/package/icon/installed/%s/%s" % (ip.value, port.value, type, id)
        else:
            uri = "http://%s:%s/%s/package/icon/installed/%s/%s" % (ip.value, port.value, prefix.value, type, id)

    contents = urllib2.urlopen(uri).read()
    mimetype = mimetypes.guess_type(uri)
    response = HttpResponse(contents, mimetype=mimetype)
    return response

@admin_required
def admin_resource_icon_package_available(request, type, id, version):
    try:
        ip = Parameter.objects.get(key='rinor_ip')
        port = Parameter.objects.get(key='rinor_port')
    except Parameter.DoesNotExist:
        raise RinorNotConfigured
    else:
        try:
            prefix = Parameter.objects.get(key='rinor_prefix')
        except Parameter.DoesNotExist:
            uri = "http://%s:%s/package/icon/available/%s/%s/%s" % (ip.value, port.value, type, id, version)
        else:
            uri = "http://%s:%s/%s/package/icon/available/%s/%s/%s" % (ip.value, port.value, prefix.value, type, id, version)

    contents = urllib2.urlopen(uri).read()
    mimetype = mimetypes.guess_type(uri)
    response = HttpResponse(contents, mimetype=mimetype)
    return response

@admin_required
def admin_core_devicesstats(request):
    """
    Method called when the admin Domoweb Data page is accessed
    @param request : HTTP request
    @return an HttpResponse object
    """
    
    page_title = _("Devices Stats Logs")
    
    devicesevents = StatePipe().get_last(100, '*', '*')
    devicesevents.reverse()
    
    return go_to_page(
        request, 'core/devicesstats.html',
        page_title,
        devicesevents_list = devicesevents,
        nav1_admin = "selected",
        nav2_core_domowebdata = "selected",
        parameter_data = Parameter.objects.all()
    )
