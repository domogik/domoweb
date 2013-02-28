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
from django.http import HttpResponseRedirect, HttpResponse
from django.shortcuts import render_to_response, redirect
from django.template import RequestContext, Context, Template
from django.utils.translation import ugettext as _
from django import forms
from domoweb.utils import *
from domoweb.rinor.pipes import *
from domoweb.models import Widget, PageIcon, WidgetInstance, WidgetInstanceParam, WidgetInstanceSensor, WidgetInstanceCommand, PageTheme, DeviceType, DeviceUsage, Device, Sensor, Command
from domoweb import fields
    
class ThemeChoiceField(forms.ModelChoiceField):
    def label_from_instance(self, obj):
        return obj.label
    
# Page configuration form
class PageForm(forms.Form):
    name = forms.CharField(max_length=50, label=_("Page name"), widget=forms.TextInput(attrs={'class':'icon32-form-tag'}), required=True)
    description = forms.CharField(label=_("Page description"), widget=forms.Textarea(attrs={'class':'icon32-form-edit'}), required=False)
    icon = fields.IconChoiceField(label=_("Choose the icon"), required=False, empty_label="No icon", queryset=PageIcon.objects.all())
    theme = ThemeChoiceField(label=_("Choose a theme"), required=False, empty_label="No theme", queryset=PageTheme.objects.all())

"""    
    def clean(self):
        cd = self.cleaned_data
        if cd['icon']:
            cd['icon'] = cd['icon_id'].id
        else:
            cd['icon'] = ''
        return cd
"""

def page(request, id=1):
    """
    Method called when a ui page is accessed
    @param request : HTTP request
    @return an HttpResponse object
    """

    page = Page.objects.get(id=id)
    page_path = Page.objects.get_path(id)
    page_tree = Page.objects.get_tree()
    
    page_title = page.name

    iconsets = PageIcon.objects.values('iconset_id', 'iconset_name').distinct()

    widgets = WidgetInstance.objects.filter(page_id=id).values('widget_id').distinct()
    widgetinstances = WidgetInstance.get_page_list(id)

    return go_to_page(
        request, 'page.html',
        page_title,
        widgets=widgets,
        page=page,
        page_path=page_path,
        page_tree=page_tree,
        iconsets=iconsets,
        widgetinstances=widgetinstances,
    )

@admin_required
def page_configuration(request, id):
    """
    Method called when a ui page configuration is accessed
    @param request : HTTP request
    @return an HttpResponse object
    """

    page = Page.objects.get(id=id)
    page_title = "%s %s" % (page.name, _("Configuration"))

    iconsets = PageIcon.objects.values('iconset_id', 'iconset_name').distinct()
    
    if request.method == 'POST': # If the form has been submitted...
        form = PageForm(request.POST) # A form bound to the POST data
        if form.is_valid(): # All validation rules pass
            cd = form.cleaned_data
            page.name = cd["name"]
            page.description = cd["description"]
            page.icon = cd["icon"]
            page.theme = cd["theme"]
            page.save()
            return redirect('page_view', id=id) # Redirect after POST
    else:
        form = PageForm(initial={'name': page.name, 'description': page.description, 'icon': page.icon, 'theme': page.theme})

    return go_to_page(
        request, 'configuration.html',
        page_title,
        page=page,
        form=form,
        iconsets=iconsets
    )

@admin_required
def page_elements(request, id):
    """
    Method called when a ui page widgets is accessed
    @param request : HTTP request
    @return an HttpResponse object
    """

    page = Page.objects.get(id=id)
    page_title = "%s %s" % (page.name, _("Widgets"))

    iconsets = PageIcon.objects.values('iconset_id', 'iconset_name').distinct()

    if request.method == 'POST': # If the form has been submitted...
        instances = getDictArray(request.POST, 'instance')
        keys = []
        for key in instances.keys():
            try:
                keys.append(int(key)) # Convert to int and remove new instances
            except ValueError:
                pass
        widgetinstances = WidgetInstance.objects.filter(page_id=id).exclude(id__in=keys).delete()
        for instanceid, instance in instances.items():
            if 'widgetid' in instance:
                w = WidgetInstance(order=0, page=page, widget_id=instance['widgetid'])
                w.save()
                if (instance['featuretype'].startswith('sensor')):
                    s = Sensor.objects.get(id=instance['featureid'])
                    ws = WidgetInstanceSensor(instance=w, key="primary", sensor=s)
                    ws.save()
                else:
                    c = Command.objects.get(id=instance['featureid'])
                    wc = WidgetInstanceCommand(instance=w, key="primary", command=c)
                    wc.save()
                    s = Sensor.objects.get(id=instance['sensor'])
                    ws = WidgetInstanceSensor(instance=w, key="event", sensor=s)
                    ws.save()
            else:
                if 'sensor' in instance: # A command with a sensor
                    w = WidgetInstance.objects.get(id=instanceid)
                    s = Sensor.objects.get(id=instance['sensor'])
                    try:
                        ws = WidgetInstanceSensor.objects.get(instance=w, key="event")
                        ws.sensor = s
                        ws.save()
                    except WidgetInstanceSensor.DoesNotExist:
                        ws = WidgetInstanceSensor(instance=w, key="event", sensor=s)
                        ws.save()
        return redirect('page_view', id=id) # Redirect after POST

    devices = Device.objects.all()
    widgets = Widget.objects.all()
    widgetinstances = WidgetInstance.get_page_list(id)
    
    return go_to_page(
        request, 'elements.html',
        page_title,
        page=page,
        iconsets=iconsets,
        devices=devices,
        widgets=widgets,
        widgetinstances=widgetinstances,
    )

@admin_required
def page_elements_widgetparams(request, instanceid, featureid, featuretype):
    if featuretype.startswith("sensor"):
        html=""
    else:
        cmd = Command.objects.get(id=featureid)
        t = Template("<div class='row'><label for='instance_{{ instanceid }}_sensor'>Sensor :</label>"
                     "<select id='instance_{{ instanceid }}_sensor' name='instance[{{ instanceid }}][sensor]'>"
                     "{% for sensor in command.device.sensor_set.all %}"
                     "<option value='{{ sensor.id }}'>{{ sensor.name }}</option>"
                     "{% endfor %}"
                     "</select></div>")
        c = Context({'command': cmd, 'instanceid': instanceid})
        html = t.render(c)
    return HttpResponse(html)