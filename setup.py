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

Help to manage DomoWeb installation

Implements
==========


@author: Domogik project
@copyright: (C) 2007-2009 Domogik project
@license: GPL(v3)
@organization: Domogik
"""

import ez_setup
ez_setup.use_setuptools()

import os
from setuptools import setup, find_packages
import platform

import sys
def list_all_files(path, dst):
    """
    List all files and subdirectories contained in a path
    @param path : the path from where to get files and subdirectories
    @param dst : The based destination path
    @return : a list of tuples for each directory in path (including path itself)
    """
    d = []
    files = []
    for i in os.listdir(path):
        if not os.path.isdir(os.path.join(path, i)):
            files.append(os.path.join(path, i))
        else:
            d.extend(list_all_files(os.path.join(path, i), os.path.join(dst, i)))
    d.append((dst, files))
    return d

arch = platform.architecture()

d_files = [
        ('/etc/init.d/', ['src/examples/init/domoweb']),
        ('/etc/default/', ['src/examples/default/domoweb'])
]

# Still needed for 'install' mode, because setuptools does not add html files in .egg
d_files.extend(list_all_files('src/domoweb/templates/', '/usr/share/domoweb/templates/')),
d_files.extend(list_all_files('src/domoweb/config/templates/', '/usr/share/domoweb/config/templates/')),
d_files.extend(list_all_files('src/domoweb/admin/templates/', '/usr/share/domoweb/admin/templates/')),
d_files.extend(list_all_files('src/domoweb/view/templates/', '/usr/share/domoweb/view/templates/')),
d_files.extend(list_all_files('src/domoweb/design/', '/usr/share/domoweb/design/')),
d_files.extend(list_all_files('src/domoweb/locale/', '/usr/share/domoweb/locale/')),

setup(
    name = 'DomoWeb',
    version = '0.3-beta1',
    url = 'http://www.domogik.org/',
    description = 'Domogik Web UI',
    author = 'Domogik team',
    author_email = 'domogik-general@lists.labs.libre-entreprise.org',
    install_requires=['setuptools',
                      'django == 1.4',
                      'django-tastypie == 0.9.11',
                      'django-tables2',
                      'simplejson >= 1.9.2',
                      'httplib2 >= 0.6.0',
                      'Distutils2',
                      'CherryPy >= 3.2.2',
                      'south',
                      'manifesto'],

    zip_safe = False,
    license = 'GPL v3',
    # namespace_packages = ['domogik', 'mpris', 'tools'],
    # include_package_data = True,
    packages = find_packages('src'),
    package_dir = {'': 'src'},
#    test_suite = 'domogik.tests',
    # Include all files of the ui/djangodomo directory
    # in data files.
    package_data = {
        'domoweb': list_all_files('src/domoweb/','.')[0][1],
        'domoweb': ['locale/*.po', 'locale/*.mo'],
#        'domogik.ui.djangodomo.core': list_all_files('src/domogik/ui/djangodomo/core/templates/'),
    },
    data_files = d_files,

    entry_points = {
        'console_scripts': [
            """
            dmg_domoweb = domoweb.runserver:runinstall
            """
        ],
    } if (sys.argv[1] == 'install') else {
        'console_scripts': [
            """
            dmg_domoweb = domoweb.runserver:rundevelop
            """
        ],
    },
)
