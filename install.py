#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys
if sys.version_info < (2, 6):
    print "Sorry, requires Python 2.6 or 2.7."
    sys.exit(1)

import traceback
import os
import os.path
euid = os.geteuid()
if euid != 0:
    print "Please restart this script as root!"
    sys.exit(1)

try:
    import domogikmq
except ImportError:
    print "Please install Domogik MQ first! (https://github.com/domogik/domogik-mq)"
    sys.exit(1)
#from optparse import OptionParser
import argparse

import pwd
import shutil
import re
import site
sitepackages = site.getsitepackages()[0]

BLUE = '\033[94m'
OK = '\033[92m'
WARNING = '\033[93m'
FAIL = '\033[91m'
ENDC = '\033[0m'

#class FakeGlobalSectionHead(object):
#    def __init__(self, fp):
#        self.fp = fp
#        self.sechead = '[global]\n'
#    def readline(self):
#        if self.sechead:
#            try: return self.sechead
#            finally: self.sechead = None
#        else: return self.fp.readline()


def info(msg):
    print "%s [ %s ] %s" % (BLUE,msg,ENDC)
def ok(msg):
    print "%s ==> %s  %s" % (OK,msg,ENDC)
def warning(msg):
    print "%s ==> %s  %s" % (WARNING,msg,ENDC)
def fail(msg):
    print "%s ==> %s  %s" % (FAIL,msg,ENDC)

def main():
    """Main function that is called at the install of Domoweb."""
    p = argparse.ArgumentParser(description='Domoweb installation.')
    p.add_argument('--uninstall',
             dest='uninstall',
             action="store_true",
             help="Uninstall Domoweb")

    p.add_argument('--simul',
             dest='simul',
             action="store_true",
             help="Simulation mode for Uninstall")

    p.add_argument('--nodeps',
             dest='nodeps',
             action="store_true",
             help="Do not install dependencies")

    p.add_argument('-u', '--user',
             dest='user',
             default=None,
             help="User that will run Domoweb (default: domoweb)")

    p.add_argument('--libdir',
             dest='libdir',
             default='/var/lib/domoweb',
             help="Folder for domoweb lib files (default: /var/lib/domoweb)")

    p.add_argument('--logdir',
             dest='logdir',
             default='/var/log/domoweb',
             help="Folder for domoweb log files (default: /var/log/domoweb)")

    p.add_argument('--piddir',
             dest='piddir',
             default='/var/run/domoweb',
             help="Folder for domoweb pid files (default: /var/run/domoweb)")

    p.add_argument('--noconfig',
             dest='noconfig',
             action="store_true",
             help="Do not install Init and /etc files")

    p.add_argument('--nodbupdate',
             dest='nodbupdate',
             action="store_true",
             help="Do not update the Domoweb DB")

    p.add_argument('--notest',
             dest='notest',
             action="store_true",
             help="Do not test Domoweb Installation")

    p.add_argument('--db',
             dest='db',
             default='/var/lib/domoweb/db.sqlite',
             help="Force domoweb DB file (default: /var/lib/domoweb/db.sqlite)")

    p.add_argument('--noclean',
             dest='noclean',
             action="store_true",
             help="Do not clean old Domoweb install")

    p.add_argument('--nousercheck',
             dest='nousercheck',
             action="store_true",
             help="Do not check for user account")

    p.add_argument('--nofoldercreation',
             dest='nofoldercreation',
             action="store_true",
             help="Do not create folders")

    # generate dynamically all arguments for the various config files
    # notice that we MUST NOT have the same sections in the different files!
    p.add_argument('--command-line', dest='command_line', \
            action="store_true", default=False, \
            help='Configure the configuration files from the command line only')
    add_arguments_for_config_file(p, \
            "examples/config/domoweb.cfg")


    # parse command line for defined options
    args = p.parse_args()

    # Initial Clean
    if not args.noclean:
        clean()

    # Uninstall
    if args.uninstall:
        uninstall(args.simul)
        sys.exit(0)

    # Dependencies
    if args.nodeps:
        warning('Not installing dependencies')
    else:
        info("Installing setuptools...")
        import ez_setup
        ez_setup.main('')
        info("Installing dependencies...")
        install_dependencies()

    # Domoweb User
    if args.nousercheck:
        warning('Not checking user')
    else:
        info("Checking user")
        if args.user:
            user = args.user
        else:
            user = raw_input('Which user will run domogik (default : domoweb)? ')
            if not user:
                user = 'domoweb'
        test_user(user)

    # Domoweb folders creation
    if args.nofoldercreation:
        warning('Not creating folders')
    else:
        info("Checking %s folder" % args.libdir)
        createFolder(args.libdir, user)
        info("Checking %s folder" % args.logdir)
        createFolder(args.logdir, user)
        info("Checking %s folder" % args.piddir)
        createFolder(args.piddir, user)
        info("Copying default files")
        installFiles(args.libdir, user)

    # Config files
    if args.noconfig:
        warning('Not installing Init and /etc files')
    else:
        upgradeOld()
        installConfig(user, args.command_line)
        installDefault(user)
        installInit()
        installLogrotate()

    # write config file
    if args.command_line:
        info("Update the config file : /etc/domoweb.cfg")
        write_domoweb_configfile_from_command_line(args)


    # Update DB
    if args.nodbupdate:
        warning('Not updating Domoweb DB')
    else:
        info("Updating Domoweb DB...")
        updateDb(user, args.db)

    # Adding module path to PYTHONPATH
    if sitepackages:
        mypth = os.path.join(sitepackages, "domoweb.pth")
        path_to_add = os.path.abspath(os.path.dirname(__file__))
        ok("Adding %s to site-packages" % path_to_add)
        with open(mypth, "a") as f:
            f.write(path_to_add)
            f.write("\n")
    else:
        fail('site-packages not found')

    # Test installation
    if args.notest:
        warning('Not testing Domoweb Installation')
    else:
        ok("Everything seems to be good, DomoWeb should be installed correctly.")
        ok("Testing installation")
        #raw_input('Please press Enter when ready.')
        try:
            testConfigFiles()
            testInit()
            tornado_url = getTornadoUrl()
            print "\n\n"
            ok("================================================== <==")
            ok(" Everything seems ok, you should be able to start  <==")
            ok("      DomoWeb with /etc/init.d/domoweb start       <==")
            ok("            or /etc/rc.d/domoweb start             <==")
            ok(" DomoWeb UI is available on                        <==")
            ok(" %49s <==" % tornado_url)
            ok("================================================== <==")
        except:
            fail(sys.exc_info()[1])

def upgradeOld():
    # Move previous install from /etc/domoweb/domoweb.cfg to /etc/domoweb.cfg
    if os.path.isdir('/etc/domoweb/'):
        if os.path.isfile('/etc/domoweb/domoweb.cfg'):
            info("Found old config path: moving to /etc/domoweb.cfg")
            shutil.move('/etc/domoweb/domoweb.cfg', '/etc/domoweb.cfg')
        os.rmdir('/etc/domoweb/')

def installConfig(user, command_line):
    info("Installing /etc/domoweb.cfg")
    uid = pwd.getpwnam(user).pw_uid
    installpath = "%s/examples/config/domoweb.cfg" % os.path.dirname(os.path.abspath(__file__))
    if os.path.isfile('/etc/domoweb.cfg'):
        if not command_line:
            keep = raw_input('You already have Domoweb configuration files. Do you want to keep them ? [Y/n] ')
        else:
            keep = 'N'
        if keep == 'N' or keep == 'n':
            shutil.copy(installpath, '/etc/')
            os.chown('/etc/domoweb.cfg', uid, -1)
    else:
        shutil.copy(installpath, '/etc/')
        os.chown('/etc/domoweb.cfg', uid, -1)

def installFiles(libdir, user):
    # Copy default backgrounds
    info("Create backgrounds folder")
    backgroundspath = os.path.join(libdir, 'backgrounds')
    createFolder(backgroundspath, user)
    thumbnailspath = os.path.join(libdir, 'backgrounds', 'thumbnails')
    createFolder(thumbnailspath, user)

def installDefault(user):
    info("Installing /etc/default/domoweb")
    installpath = "%s/examples/default/domoweb" % os.path.dirname(os.path.abspath(__file__))

    if not os.path.isdir('/etc/default/'):
        fail("Can't find the directory where I can copy system-wide config. Usually it is /etc/default/")
        sys.exit(1)
    else:
        shutil.copy(installpath, '/etc/default/')

    if not os.path.isfile('/etc/default/domoweb'):
        fail("Can't find /etc/default/domoweb!")
        sys.exit(1)

    info("Configuring /etc/default/domoweb")
    with open('/etc/default/domoweb') as f:
        s = f.read()

    s = re.sub(r'DOMOWEB_USER=.*', ('DOMOWEB_USER=%s' % user), s)
    s = re.sub(r'DOMOWEB_PATH=.*', ('DOMOWEB_PATH=%s' % os.path.dirname(os.path.abspath(__file__))), s)

    with open('/etc/default/domoweb', "w") as f:
        f.write(s)

def installInit():
    installpath = "%s/examples/init/domoweb" % os.path.dirname(os.path.abspath(__file__))
    if os.path.isdir('/etc/init.d/'):
        info("Installing /etc/init.d/domoweb")
        shutil.copy(installpath, '/etc/init.d/')
        os.chmod('/etc/init.d/domoweb', 0755)
    elif os.path.isdir('/etc/rc.d/'):
        info("Installing /etc/rc.d/domoweb")
        shutil.copy(installpath, '/etc/rc.d/')
        os.chmod('/etc/rc.d/domoweb', 0755)
    else:
        warning("Init directory does not exist (/etc/init.d or /etc/rc.d): require manual install")

def installLogrotate():
    installpath = "%s/examples/logrotate/domoweb" % os.path.dirname(os.path.abspath(__file__))
    if os.path.isdir('/etc/logrotate.d/'):
        info("Installing /etc/logrotate/domoweb")
        shutil.copy(installpath, '/etc/logrotate.d/')
        os.chmod('/etc/logrotate.d/domoweb', 0644)

def createFolder(path, user):
    if not os.path.isdir(path):
        info("%s do not exist... creation" % path)
        os.makedirs(path)

    uid = pwd.getpwnam(user).pw_uid
    info("Updating rights for user %s[%s]" % (user, uid))
    os.chown(path, uid, -1)
    os.chmod(path, 0755)

def test_user(user):
    info("Looking for user %s" % user)
    try:
        pw = pwd.getpwnam(user)
    except KeyError:
        warning("Can't find informations about user %s" % user)
        create_user = raw_input('Do you want to create it? [Y/n] ')
        if not create_user or create_user == 'Y' or create_user == 'y':
            info("Creating user %s" % user)
            os.system("/usr/sbin/adduser %s" % user)
            ok("User %s created" % user)
        else:
            fail("Please restart this script when the user %s will exist." % user)
            sys.exit(1)
    else:
        ok("User %s found" % user)

def install_dependencies():
    from setuptools.command import easy_install
    import pkg_resources
    easy_install.main( ['setuptools',
        'sqlalchemy',
        'alembic',
        'tornado >= 3.1',
        'simplejson >= 1.9.2',
        'WTForms >= 2.0',
        'WTForms-Components',
        'pillow < 4.0.0',
        'pyzmq'
    ])

#    pkg_resources.get_distribution('django').activate()

def updateDb(user, db):
    from domoweb.models import metadata, engine, Session, Section, SectionParam
    from sqlalchemy import create_engine, func
    from alembic.config import Config
    from alembic import command

    alembic_cfg = Config("alembic.ini")
    if not os.path.isfile(db):
        ok("Creating new database: %s" % db)
        metadata.create_all(engine)
        command.stamp(alembic_cfg, "head")
        uid = pwd.getpwnam(user).pw_uid
        os.chown(db, uid, -1)

        ok("Adding initial data")
        session = Session()
        s = Section(name=unicode('Root'), description=unicode('Root dashboard'), left=1, right=2)
        session.add(s)
        p = SectionParam(section_id=1, key='GridWidgetSize', value='50')
        session.add(p)
        p = SectionParam(section_id=1, key='GridWidgetSpace', value='20')
        session.add(p)
        p = SectionParam(section_id=1, key='GridMode', value='3')
        session.add(p)
        session.commit()
    else:
        ok("Upgrading existing database")
        session = Session()
        sections = session.query(Section).all()
        for s in sections:
            p = session.query(SectionParam).filter_by(section_id=s.id).filter(SectionParam.key.in_(['GridWidgetSize', 'GridWidgetSpace', 'GridColumns', 'GridRows'])).count()
            if p == 0:
                ok("Updating section '%s'" % s.name)
                p = SectionParam(section_id=s.id, key='GridWidgetSize', value='50')
                session.add(p)
                p = SectionParam(section_id=s.id, key='GridWidgetSpace', value='20')
                session.add(p)
                p = SectionParam(section_id=s.id, key='GridMode', value='3')
                session.add(p)
                session.commit()

        command.upgrade(alembic_cfg, "head")

def testImports():
    good = True
    info("Test imports")
    try:
        import django
    except ImportError:
        warning("Can't import django, please install it by hand (== 1.4)")
        good = False
        import httplib
    except ImportError:
        warning("Can't import httplib, please install it by hand (>= 2)")
        good = False
    try:
        import simplejson
    except ImportError:
        warning("Can't import simplejson, please install it by hand (>= 1.9.2)")
        good = False
    assert good, "One or more import have failed, please install required packages and restart this script."
    ok("Imports are good")

def testConfigFiles():
    global user
    info("Checking global config file")
    assert os.path.isfile("/etc/conf.d/domoweb") or os.path.isfile("/etc/default/domoweb"), \
            "No global config file found"
    assert not (os.path.isfile("/etc/conf.d/domoweb") and os.path.isfile("/etc/default/domoweb")), \
            "Global config file found at 2 locations. Please put it only at /etc/default/domoweb or \
            /etc/conf.d/domoweb"

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
        elif item.strip() == "DOMOWEB_PATH":
            if not os.path.dirname(os.path.abspath(__file__)) == value:
                fail("DOMOWEB_PATH do not match the current installation folder")
        else:
            warning("Unknown config value in the main config file : %s" % item)
    ok("Global config file exists and contains right stuff")

    info("Test user / config file")

    #Check user config file
    assert os.path.isfile("/etc/domoweb.cfg"), "The domogik config file /etc/domoweb.cfg does not exist. Please report this as a bug."
    ok("Domogik's user exists and has a config file")

#    info("Check user config file contents")
#    import ConfigParser
#    config = ConfigParser.ConfigParser()
#    config.read("/etc/domoweb.cfg")

    #check [global] section
#    django = dict(config.items('global'))
#    ok("Config file correctly loaded")

def testInit():
    info("Checking init.d / rc.d")
    assert os.access("/etc/init.d/domoweb", os.X_OK) or os.access("/etc/rc.d/domoweb", os.X_OK), "/etc/init.d/domoweb and /etc/rc.d/domoweb do not \
            exist or can't be executed.\
            Please copy src/examples/init/domoweb to /etc/init.d or /etc/rc.d depending on your system, and chmod +x /etc/init.d/domoweb"
    ok("/etc/init.d/domoweb or /etc/rc.d/domoweb found with good permissions")

def testDB(db):
    info("Checking Domoweb DB")
    assert os.path.isfile(db), \
            "%s not found" % db
    ok("%s found" % db)

def getTornadoUrl():
    import socket
    from tornado.options import options
    ip = socket.gethostbyname(socket.gethostname())
    # Check config file
    SERVER_CONFIG = '/etc/domoweb.cfg'
    if not os.path.isfile(SERVER_CONFIG):
        sys.stderr.write("Error: Can't find the file '%s'\n" % SERVER_CONFIG)
        sys.exit(1)

    options.define("port", default=40404, help="Launch on the given port", type=int)
    options.parse_config_file(SERVER_CONFIG)

    return "http://%s:%s/" % (ip, options.port)

def add_arguments_for_config_file(parser, fle):
    # read the sample config file

    try:
        with open(fle) as myfile:
            for line in myfile:
                # handle empty lines and comments
                if not line.startswith("#") and not line.strip() == "":
                    name = line.split("=")[0].strip()
                    key = "{0}_{1}".format("domoweb", name)
                    parser.add_argument("--{0}".format(key), dest=key,
                        help="Update key {0} value".format(key))
    except:
        print(u"Error while reading the sample configuration file : {0}. The error is : {1}".format(fle, traceback.format_exc()))

# usefull ?
#def is_domoweb_advanced(advanced_mode, key):
#    advanced_keys = ['sqlite_db', 'port', 'log_file_prefix', 'debug', 'rest_url', 'use_ssl', 'ssl_certificate', 'ssl_key', 'ssl_port']
#    if advanced_mode:
#        return True
#    else:
#        if key not in advanced_keys:
#            return True
#        else:
#            return False

def write_domoweb_configfile_from_command_line(args):
    try:
        config = ""
        with open("/etc/domoweb.cfg") as myfile:
            for line in myfile:
                # handle empty lines and comments
                if not line.startswith("#") and not line.strip() == "":
                    name = line.split("=")[0].strip()
                    value = line.split("=")[1].strip()
                    try:
                        new_value = eval("args.{0}_{1}".format("domoweb", name))
                        if new_value != value and new_value != '' and new_value != None:
                            print("Set value : {0} = {1}".format(name, new_value))
                            config += "{0} = {1}\n".format(name, new_value)
                        else:
                            print("Keep default value : '{0}' = {1}".format(name, value))
                            config += "{0} = {1}\n".format(name, value)
                    except AttributeError:
                        # no such argument given to the command line : keep the default value
                        print("Keep default value : '{0}' = {1}".format(name, value))
                        config += "{0} = {1}\n".format(name, value)

    except:
        print(u"Error while reading the sample configuration file : {0}. The error is : {1}".format("/etc/domoweb.cfg", traceback.format_exc()))

    # write the config file
    with open('/etc/domoweb.cfg', 'wb') as configfile:
        ok("Writing the config file")
        configfile.write(config)




def clean():
    import commands
    status,output = commands.getstatusoutput('which dmg_domoweb')
    if status == 0:
        info("Deleting %s shortcut" % output)
        os.remove(output)

    from distutils.sysconfig import get_python_lib
    sitepackages = get_python_lib()
    dirList=os.listdir(sitepackages)
    for fname in dirList:
        try:
            fname.index('Domoweb')
        except ValueError:
            pass
        else:
            fullpath = os.path.join(sitepackages, fname)
            if os.path.isdir(fullpath):
                info("Deleting old dir %s" % fullpath)
                shutil.rmtree(fullpath)
            else:
                info("Deleting old file %s" % fullpath)
                os.remove(fullpath)

def uninstall(simul):
    ok("This script will uninstall Domoweb")
    if simul: warning('Simulation mode: not deleting')
    sure = raw_input('Are you sure ? [y/N] ')
    if sure == 'Y' or sure == 'y':
        if os.path.isfile('/etc/default/domoweb'):
            info('Deleting /etc/default/domoweb')
            if not simul: os.remove('/etc/default/domoweb')
        if os.path.isfile('/etc/init.d/domoweb'):
            info('Deleting /etc/init.d/domoweb')
            if not simul: os.remove('/etc/init.d/domoweb')
        if os.path.isfile('/etc/rc.d/domoweb'):
            info('Deleting /etc/rc.d/domoweb')
            if not simul: os.remove('/etc/rc.d/domoweb')
        if os.path.isfile('/etc/domoweb.cfg'):
            info('Deleting config file /etc/domoweb.cfg')
            if not simul: os.remove('/etc/domoweb.cfg')
        if os.path.isdir('/var/lib/domoweb'):
            info('Deleting /var/lib/domoweb')
            if not simul: shutil.rmtree('/var/lib/domoweb')
        if os.path.isdir('/var/log/domoweb'):
            info('Deleting /var/log/domoweb')
            if not simul: shutil.rmtree('/var/log/domoweb')
        ok('Deleting complete')
    else:
        warning("Aborting...")

if __name__ == "__main__":
    main()
