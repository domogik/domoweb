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

Test domogik configuration

Implements
==========


@author: Maxence Dunnewind <maxence@dunnewind.net>
@copyright: (C) 2007-2009 Domogik project
@license: GPL(v3)
@organization: Domogik
"""

import os
import pwd
import sys
from multiprocessing import Process, Pipe
from socket import gethostbyname, gethostname

BLUE = '\033[94m'
OK = '\033[92m'
WARNING = '\033[93m'
FAIL = '\033[91m'
ENDC = '\033[0m'

user = ''

def info(msg):
    print "%s [ %s ] %s" % (BLUE,msg,ENDC)
def ok(msg):
    print "%s ==> %s  %s" % (OK,msg,ENDC)
def warning(msg):
    print "%s ==> %s  %s" % (WARNING,msg,ENDC)
def fail(msg):
    print "%s ==> %s  %s" % (FAIL,msg,ENDC)

def am_i_root():
    info("Check this script is started as root")
    assert os.getuid() == 0, "This script must be started as root"
    ok("Correctly started with root privileges.")

def test_imports():
    good = True
    info("Test imports")
    try:
        import django
    except ImportError:
        warning("Can't import django, please install it by hand (>= 1.1) or exec ./setup.py develop or ./setup.py install")
        good = False
        import httplib
    except ImportError:
        warning("Can't import httplib, please install it by hand (>= 2) or exec ./setup.py develop or ./setup.py install")
        good = False
    try:
        import simplejson
    except ImportError:
        warning("Can't import simplejson, please install it by hand (>= 1.1) or exec ./setup.py develop or ./setup.py install")
        good = False
    assert good, "One or more import have failed, please install required packages and restart this script."
    ok("Imports are good")

def test_config_files():
    global user
    info("Test global config file")
    assert os.path.isfile("/etc/conf.d/domoweb") or os.path.isfile("/etc/default/domoweb"), \
            "No global config file found, please exec install.sh if you did not exec it before."
    assert not (os.path.isfile("/etc/conf.d/domoweb") and os.path.isfile("/etc/default/domoweb")), \
            "Global config file found at 2 locations. Please put it only at /etc/default/domoweb or \
            /etc/conf.d/domoweb then restart test_config.py as root"
    if os.path.isfile("/etc/default/domoweb"):
        file = "/etc/default/domoweb"
    else:
        file = "/etc/conf.d/domoweb"
    f = open(file,"r")
    r = f.readlines()
    lines = filter(lambda x: not x.startswith('#') and x != '\n',r)
    f.close()
    for line in lines:
        item,value = line.strip().split("=")
        if item.strip() == "DOMOWEB_USER":
            user = value
        else:
            warning("Unknown config value in the main config file : %s" % item)
    ok("Global config file exists and contains right stuff")

    info("Test user / config file")

    #Check user config file
    try:
        user_entry = pwd.getpwnam(user)
    except KeyError:
        raise KeyError("The user %s does not exists, you MUST create it or change the DOMOWEB_USER parameter in %s. Please report this as a bug if you used install.sh." % (user, file))
    user_home = user_entry.pw_dir
    assert os.path.isfile("%s/.domogik/domoweb.cfg" % user_home), "The domogik config file %s/.domogik/domoweb.cfg does not exist. Please report this as a bug if you used install.sh." % user_home
    ok("Domogik's user exists and has a config file")
    
    test_user_config_file(user_home, user_entry)

def _test_user_can_write(conn, path, user_entry):
    os.setgid(user_entry.pw_gid)
    os.setuid(user_entry.pw_uid)
    conn.send(os.access(path, os.W_OK))
    conn.close()

def test_user_config_file(user_home, user_entry):
    info("Check user config file contents")
    import ConfigParser
    config = ConfigParser.ConfigParser()
    config.read("%s/.domogik/domoweb.cfg" % user_home)
    
    #check [domogik] section
    django = dict(config.items('django'))
    ok("Config file correctly loaded")

#    parent_conn, child_conn = Pipe()
#    p = Process(target=_test_user_can_write, args=(child_conn, dmg['log_dir_path'],user_entry,))
#    p.start()
#    p.join()
#    assert parent_conn.recv(), "The directory %s for log does not exist or does not have right permissions" % dmg['log_dir_path']

def test_init():
    info("Check init.d / rc.d")
    assert os.access("/etc/init.d/domoweb", os.X_OK) or os.access("/etc/rc.d/domoweb", os.X_OK), "/etc/init.d/domoweb and /etc/rc.d/domoweb do not \
            exist or can't be executed.\
            Please copy src/examples/init/domoweb to /etc/init.d or /etc/rc.d depending on your system, and chmod +x /etc/init.d/domoweb"
    ok("/etc/init.d/domoweb or /etc/rc.d/domoweb found with good permissions")

def test_version():
    info("Check python version")
    v = sys.version_info
    assert not (v[0] == 2 and v[1] < 6), "Python version is %s.%s, it must be >= 2.6, please upgrade" % (v[0], v[1])
    ok("Python version is >= 2.6")

def get_django_url():
    user_entry = pwd.getpwnam(user)
    user_home = user_entry.pw_dir
    import ConfigParser
    config = ConfigParser.ConfigParser()
    config.read("%s/.domogik/domoweb.cfg" % user_home)
    django = dict(config.items('django'))
    return "http://%s:%s/" % (django['django_server_ip'], django['django_server_port'])
     
try:
    am_i_root()
    test_imports()
    test_config_files()
    test_init()
    test_version()
    django_url = get_django_url()
    print "\n\n"
    ok("================================================== <==")
    ok(" Everything seems ok, you should be able to start  <==")
    ok("      DomoWeb with /etc/init.d/domoweb start       <==")
    ok("            or /etc/rc.d/domoweb start             <==")
    ok(" DomoWeb UI is available on                        <==")
    ok(" %49s <==" % django_url)
    ok(" Default login is 'admin', password is '123'       <==") 
    ok("================================================== <==")
except:
    fail(sys.exc_info()[1])

