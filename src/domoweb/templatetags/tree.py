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


@author: Domogik project
@copyright: (C) 2007-2010 Domogik project
@license: GPL(v3)
@organization: Domogik
"""

from django import template
from django.utils.encoding import force_unicode
from django.utils.safestring import mark_safe
from django.utils.translation import ugettext as _

register = template.Library()

@register.filter
def cache_tree_children(queryset):
    """
    Takes a list/queryset of model objects in MPTT left (depth-first) order,
    and caches the children on each node so that no further queries are needed.
    This makes it possible to have a recursively included template without worrying
    about database queries.

    Returns a list of top-level nodes.
    """

    current_path = []
    top_nodes = []
    if queryset:
        root_level = None
        for obj in queryset:
            node_level = obj.left
            if root_level is None:
                root_level = node_level
            if node_level < root_level:
                raise ValueError(_("cache_tree_children was passed nodes in the wrong order!"))
            obj._cached_children = []

            while len(current_path) > node_level - root_level:
                current_path.pop(-1)

            if node_level == root_level:
                top_nodes.append(obj)
            else:
                current_path[-1]._cached_children.append(obj)
            current_path.append(obj)
    return top_nodes

class RecurseTreeNode(template.Node):
    def __init__(self, template_nodes, queryset_var):
        self.template_nodes = template_nodes
        self.queryset_var = queryset_var

    def _render_node(self, context, node):
        bits = []
        node.is_leaf_node = False
        context.push()
        for child in node._cached_children:
            context['node'] = child
            bits.append(self._render_node(context, child))
        if len(bits) == 0:
            node.is_leaf_node = True
        context['node'] = node
        context['children'] = mark_safe(u''.join(bits))
        rendered = self.template_nodes.render(context)
        context.pop()
        return rendered

    def render(self, context):
        queryset = self.queryset_var.resolve(context)
        roots = cache_tree_children(queryset)
        bits = [self._render_node(context, node) for node in roots]
        return ''.join(bits)


@register.tag
def recursetree(parser, token):
    """
    Iterates over the nodes in the tree, and renders the contained block for each node.
    This tag will recursively render children into the template variable {{ children }}.
    Only one database query is required (children are cached for the whole tree)

    Usage:
            <ul>
                {% recursetree nodes %}
                    <li>
                        {{ node.name }}
                        {% if not node.is_leaf_node %}
                            <ul>
                                {{ children }}
                            </ul>
                        {% endif %}
                    </li>
                {% endrecursetree %}
            </ul>
    """
    bits = token.contents.split()
    if len(bits) != 2:
        raise template.TemplateSyntaxError(_('%s tag requires a queryset') % bits[0])

    queryset_var = template.Variable(bits[1])

    template_nodes = parser.parse(('endrecursetree',))
    parser.delete_first_token()

    return RecurseTreeNode(template_nodes, queryset_var)