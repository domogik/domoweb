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

from tastypie.resources import Resource
from tastypie.bundle import Bundle
from django.core.exceptions import ObjectDoesNotExist
from tastypie.exceptions import NotFound, ImmediateHttpResponse
from tastypie.http import HttpBadRequest
from tastypie.utils import dict_strip_unicode_keys
from domoweb.exceptions import RinorError
from django.http import HttpResponse

# Missing from tastypie 0.9.9
class HttpNotFound(HttpResponse):
    status_code = 404

class RinorResource(Resource):
    
    # adapted this from ModelResource
    def get_resource_uri(self, bundle_or_obj):
        kwargs = {
            'resource_name': self._meta.resource_name,
        }
        if isinstance(bundle_or_obj, Bundle):
            kwargs['pk'] = bundle_or_obj.obj.id # pk is referenced in ModelResource
        else:
            kwargs['pk'] = bundle_or_obj.id
        
        if self._meta.api_name is not None:
            kwargs['api_name'] = self._meta.api_name
        
        return self._build_reverse_url('api_dispatch_detail', kwargs = kwargs)

    def get_object_list(self, request):
        # inner get of object list... this is where you'll need to
        # fetch the data from what ever data source
        try:
            _data = self._meta.rinor_pipe.get_list()
        except RinorError, e:
            raise ImmediateHttpResponse(response=HttpBadRequest(e.reason))
        else:
            return _data

    def get_object_pk(self, request, pk):
        # inner get of object list... this is where you'll need to
        # fetch the data from what ever data source
        try:
            data = self._meta.rinor_pipe.get_pk(pk)
        except RinorError, e:
            if e.code == 404:
                raise ImmediateHttpResponse(response=NotFound(e.reason))
            else:
                raise ImmediateHttpResponse(response=HttpBadRequest(e.reason))
        else:
            return data
        
    def apply_filters(self, request, applicable_filters):
        """
        An ORM-specific implementation of ``apply_filters``.

        The default simply applies the ``applicable_filters`` as ``**kwargs``,
        but should make it possible to do more advanced things.
        """
        _list = self.get_object_list(request)
        _filtered_list = []
        return _filtered_list

    def post_list(self, request, **kwargs):
        deserialized = self.deserialize(request, request.raw_post_data, format=request.META.get('CONTENT_TYPE', 'application/json'))
        bundle = dict_strip_unicode_keys(deserialized)
        updated_bundle = self.obj_create(bundle, request=request, **self.remove_api_resource_names(kwargs))
        return self.create_response(request, updated_bundle)

    def put_list(self, request, **kwargs):
        deserialized = self.deserialize(request, request.raw_post_data, format=request.META.get('CONTENT_TYPE', 'application/json'))
        bundle = dict_strip_unicode_keys(deserialized)
        updated_bundle = self.obj_update_list(bundle, request=request, **self.remove_api_resource_names(kwargs))
        return self.create_response(request, updated_bundle)
        
    def put_detail(self, request, **kwargs):
        deserialized = self.deserialize(request, request.raw_post_data, format=request.META.get('CONTENT_TYPE', 'application/json'))
        bundle = dict_strip_unicode_keys(deserialized)
        updated_bundle = self.obj_update(bundle, request=request, **self.remove_api_resource_names(kwargs))
        return self.create_response(request, updated_bundle)

    def delete_detail(self, request, **kwargs):
        deleted_bundle = self.obj_delete(request=request, **self.remove_api_resource_names(kwargs))
        return self.create_response(request, deleted_bundle)

    def get_detail(self, request, **kwargs):
        try:
            _obj = self.obj_get(request=request, **self.remove_api_resource_names(kwargs))
        except ObjectDoesNotExist:
            return HttpNotFound()
        return self.create_response(request, _obj)

    def obj_get_list(self, request = None, **kwargs):
        # outer get of object list... this calls get_object_list and
        # could be a point at which additional filtering may be applied
        
        '''
        filters = {}
        
        if hasattr(request, 'GET'):
            # Grab a mutable copy.
            filters = request.GET.copy()
        print request.GET
        # Update with the provided kwargs.
        filters.update(kwargs)
        applicable_filters = self.build_filters(filters=filters)

        try:
            base_object_list = self.apply_filters(request, applicable_filters)
#            return self.apply_authorization_limits(request, base_object_list)
        except ValueError, e:
            raise BadRequest("Invalid resource lookup data provided (mismatched type).")
        '''
        return self.get_object_list(request)

    def obj_get(self, request = None, **kwargs):
        # get one object from data source
        return self.get_object_pk(request, kwargs['pk'])
    
    def obj_create(self, bundle, request = None, **kwargs):
        # create a new row
        bundle.obj = Row()
        
        # full_hydrate does the heavy lifting mapping the
        # POST-ed payload key/values to object attribute/values
        bundle = self.full_hydrate(bundle)
        
        # we add it to our in-memory data dict for fun
        data[bundle.obj.id] = bundle.obj
        return bundle
    
    def obj_update(self, bundle, request = None, **kwargs):
        # update an existing row
        pk = int(kwargs['pk'])
        try:
            bundle.obj = data[pk]
        except KeyError:
            raise NotFound("Object not found")
        
        # let full_hydrate do its work
        bundle = self.full_hydrate(bundle)
        
        # update existing row in data dict
        data[pk] = bundle.obj
        return bundle