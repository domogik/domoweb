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

from math import cos, sin, radians
from django import template
from django.utils.encoding import force_unicode
from django.utils.safestring import mark_safe
from django.utils.translation import ugettext as _

register = template.Library()

class RecurseTreeNode(template.Node):
    def __init__(self, template_nodes, tree_var):
        self.template_nodes = template_nodes
        self.tree_var = tree_var

    def _render_node(self, context, node):
        bits = []
        context.push()
        if not node.is_leaf:
            for child in node.childrens:
                context['node'] = child
                bits.append(self._render_node(context, child))
            context['children'] = mark_safe(u''.join(bits))
        context['node'] = node
        rendered = self.template_nodes.render(context)
        context.pop()
        return rendered

    def render(self, context):
        tree = self.tree_var.resolve(context)
        return self._render_node(context, tree)


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

    tree_var = template.Variable(bits[1])

    template_nodes = parser.parse(('endrecursetree',))
    parser.delete_first_token()

    return RecurseTreeNode(template_nodes, tree_var)

class RecurseMenuNode(template.Node):
    def __init__(self, template_nodes, tree_var, distance):
        self.template_nodes = template_nodes
        self.tree_var = tree_var
        self.start_min_angle = 0
        self.start_max_angle = 360
        self.distance = distance

    def _render_node(self, context, parent, node, min_angle, max_angle, originex, originey, distance):
        bits = []
        total_leafs = node.leafs
        if node.level > 0:
            angle_position = ((max_angle - min_angle) / 2) + min_angle
            node.angle = angle_position
            radian_position = radians(angle_position)
            node.x = int(cos(radian_position) * (node.level * distance) + originex)
            node.y = int(sin(radian_position) * (node.level * distance) + originey)
            node.fromx = parent.x
            node.fromy = parent.y
#            print u"%s angle:%d (%d %d), level:%d, cos:%f, sin:%f, x:%d, y:%d" % (node.name, angle_position, min_angle, max_angle, node.level, cos(radian_position), sin(radian_position), node.x, node.y)
        else:
            node.x = originex
            node.y = originey
            node.fromx = 0
            node.fromy = 0
            node.margin = (node.max_level * distance) + 40
            node.size = (node.margin * 2)
#            print u"%s angle:aucun (%d %d), level:%d, x:%d, y:%d" % (node.name, min_angle, max_angle, node.level, node.x, node.y)

        current_angle = min_angle
        context.push()
        if not node.is_leaf:
            for child in node.childrens:
                context['node'] = child
                if (child.leafs > 0 ):
                    angle = (max_angle - min_angle) * child.leafs / total_leafs
                else:
                    angle = (max_angle - min_angle) / total_leafs
                next_angle = current_angle + angle
                bits.append(self._render_node(context, node, child, current_angle, next_angle, originex, originey, distance))
                current_angle = next_angle
            context['children'] = mark_safe(u''.join(bits))
        context['node'] = node
        rendered = self.template_nodes.render(context)
        context.pop()
        return rendered

    def render(self, context):
        tree = self.tree_var.resolve(context)
        distance = self.distance.resolve(context)
        max_level = tree.max_level
        originex = (max_level * distance) + (distance / 2)
        originey = (max_level * distance) + (distance / 2)
#        print u"X:%d - Y:%d" % (originex, originey)
        return self._render_node(context, None, tree, self.start_min_angle, self.start_max_angle, originex, originey, distance)
        
@register.tag
def recursemenu(parser, token):
    bits = token.contents.split()
    if len(bits) != 3:
        raise template.TemplateSyntaxError(_('%s tag requires 3 arguments') % bits[0])

    tree = template.Variable(bits[1])
    distance = template.Variable(bits[2])

    template_nodes = parser.parse(('endrecursemenu',))
    parser.delete_first_token()

    return RecurseMenuNode(template_nodes, tree, distance)
    
class LevelNode(template.Node):
    def __init__(self, tree_var, distance):
        self.tree_var = tree_var
        self.distance = distance
        self.levels = []
        self.current_level = -1

    def _list_levels(self, node, originex, originey, distance):
        if (node.level > self.current_level):
            self.current_level = node.level
            radius = (node.level * distance) + (distance / 2)
            level = {'num': node.level, 'radius': radius, 'x': originex, 'y': originey}
            self.levels.append(level)
        if not node.is_leaf:
            for child in node.childrens:
                self._list_levels(child, originex, originey, distance)

    def render(self, context):
        tree = self.tree_var.resolve(context)
        distance = self.distance.resolve(context)
        max_level = tree.max_level
        originex = (max_level * distance) + (distance / 2)
        originey = (max_level * distance) + (distance / 2)

        self._list_levels(tree, originex, originey, distance)
        context['levels'] = self.levels
        return ""
        
@register.tag
def list_levels(parser, token):
    bits = token.contents.split()
    if len(bits) != 3:
        raise template.TemplateSyntaxError(_('%s tag requires 3 arguments') % bits[0])

    tree = template.Variable(bits[1])
    distance = template.Variable(bits[2])
    return LevelNode(tree, distance)