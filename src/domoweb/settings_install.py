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


@author: Cédric Trévisan <ferllings@gmail.com>
@copyright: (C) 2007-2011 Domogik project
@license: GPL(v3)
@organization: Domogik
"""
from settings_base import *

PROJECT_PATH = '/usr/local/share/domoweb'
print PROJECT_PATH

TEMPLATE_DIRS = (
    # Put strings here, like "/home/html/django_templates" or
    # "C:/www/django/templates".
    # Always use forward slashes, even on Windows.
    # Don't forget to use absolute paths, not relative paths.
    '%s/templates/' % PROJECT_PATH,
    '%s/view/templates/' % PROJECT_PATH,
    '%s/admin/templates/' % PROJECT_PATH,
    '%s/rinor/templates/' % PROJECT_PATH,
)

# List the availables widgets
WIDGETS_LIST = []
STATIC_WIDGETS_ROOT = None
STATIC_DESIGN_ROOT = None 

STATIC_DESIGN_ROOT = os.path.join(PROJECT_PATH, "design")
w_path = os.path.join(PROJECT_PATH, "widgets")
STATIC_WIDGETS_ROOT = w_path
if os.path.isdir(w_path):
    for file in os.listdir(w_path):
        main = os.path.join(w_path, file, "main.js")
        if os.path.isfile(main):
            WIDGETS_LIST.append(file)