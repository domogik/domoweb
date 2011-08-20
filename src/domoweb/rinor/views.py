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
from django.conf import settings
from django.http import HttpResponse
from django.template import RequestContext
from django.shortcuts import render_to_response
from django.shortcuts import redirect
import simplejson

from django_pipes.exceptions import ResourceNotAvailableException
from httplib import BadStatusLine

from domoweb.rinor import (
    Command, State
)

class JSONResponse(HttpResponse):
    def __init__(self, data, key=None):
        if (data.status == 'OK'):
            indent = 2 if settings.DEBUG else None
            if (key):
                if data.items.has_key(key):
                    content = simplejson.dumps(data.items[key], indent=indent)
                else:
                    raise AttributeError
            else:
                content = 'OK'
            code = 200
        else:
            content = data.description,
            code = 400
        super(JSONResponse, self).__init__(
            content = content,
            mimetype = "application/json",
        )
        self.status_code = code
        self['Pragma'] = 'no-cache'
        self['Cache-Control'] = 'no-cache, must-revalidate'
        self['Expires'] = '0'        

        
def error_badstatusline(request):
    return render_to_response('error/BadStatusLine.html')
        
def error_resourcenotavailable(request):
    return render_to_response('error/ResourceNotAvailable.html')

def rinor_command(request, techno, address, command, values=None):
    try:
        data = Command.send(techno, address, command, values)
    except BadStatusLine:
        HttpResponseRedirect("/rinor/error/BadStatusLine")
    except ResourceNotAvailableException:
        return HttpResponseRedirect("/rinor/error/ResourceNotAvailable")
    return JSONResponse(data)

def rinor_state_last(request, device_id, key, nb=1):
    try:
        data = State.get_last(device_id, key, nb)
    except BadStatusLine:
        HttpResponseRedirect("/rinor/error/BadStatusLine")
    except ResourceNotAvailableException:
        return HttpResponseRedirect("/rinor/error/ResourceNotAvailable")
    return JSONResponse(data, 'stats')
