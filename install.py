#!/usr/bin/env python
import sys
if sys.version_info < (2, 6):
    print "Sorry, requires Python 2.6 or 2.7."
    sys.exit(1)

import os
euid = os.geteuid()
if euid != 0:
    print "Please restart this script as root!"
    sys.exit(1)

import pwd
import shutil
import re

BLUE = '\033[94m'
OK = '\033[92m'
WARNING = '\033[93m'
FAIL = '\033[91m'
ENDC = '\033[0m'

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
    from optparse import OptionParser
    p = OptionParser(usage="usage: %prog [options]",
                          version="Install for Domoweb 0.4")

    p.add_option('--uninstall',
             dest='uninstall',
             action="store_true",
             help="Uninstall Domoweb")

    p.add_option('--simul',
             dest='simul',
             action="store_true",
             help="Simulation mode for Uninstall")

    p.add_option('--nodeps',
             dest='nodeps',
             action="store_true",
             help="Do not install dependencies")

    p.add_option('-u', '--user',
             dest='user',
             default=None,
             help="User that will run Domoweb (default: domoweb)")

    p.add_option('--libdir',
             dest='libdir',
             default='/var/lib/domoweb',
             help="Folder for domoweb lib files (default: /var/lib/domoweb)")

    p.add_option('--logdir',
             dest='logdir',
             default='/var/log/domoweb',
             help="Folder for domoweb log files (default: /var/log/domoweb)")

    p.add_option('--piddir',
             dest='piddir',
             default='/var/run/domoweb',
             help="Folder for domoweb pid files (default: /var/run/domoweb)")

    p.add_option('--noconfig',
             dest='noconfig',
             action="store_true",
             help="Do not install Init and /etc files")

    p.add_option('--nodbupdate',
             dest='nodbupdate',
             action="store_true",
             help="Do not update the Domoweb DB")

    p.add_option('--notest',
             dest='notest',
             action="store_true",
             help="Do not test Domoweb Installation")

    p.add_option('--db',
             dest='db',
             default='/var/lib/domoweb/domoweb.db',
             help="Force domoweb DB file (default: /var/lib/domoweb/domoweb.db)")

    p.add_option('--noclean',
             dest='noclean',
             action="store_true",
             help="Do not clean old Domoweb install")

    p.add_option('--nousercheck',
             dest='nousercheck',
             action="store_true",
             help="Do not check for user account")

    p.add_option('--nofoldercreation',
             dest='nofoldercreation',
             action="store_true",
             help="Do not create folders")
    
    # parse command line for defined options
    options, args = p.parse_args()

    # Initial Clean
    if not options.noclean:
        clean()

    # Uninstall
    if options.uninstall:
        uninstall(options.simul)
        sys.exit(0)

    # Dependencies
    if options.nodeps:
        warning('Not installing dependencies')
    else:
        info("Installing setuptools...")
        import ez_setup
        ez_setup.main('')
        info("Installing dependencies...")
        install_dependencies()

    # Domoweb User
    if options.nousercheck:
        warning('Not checking user')
    else:
        info("Checking user")
        if options.user:
            user = options.user
        else:
            user = raw_input('Which user will run domogik (default : domoweb)? ')
            if not user:
                user = 'domoweb'
        test_user(user)

    # Domoweb folders creation
    if options.nofoldercreation:
        warning('Not creating folders')
    else:
        info("Checking %s folder" % options.libdir)
        createFolder(options.libdir, user)
        info("Checking %s folder" % options.logdir)
        createFolder(options.logdir, user)
        info("Checking %s folder" % options.piddir)
        createFolder(options.piddir, user)

    # Config files
    if options.noconfig:
        warning('Not installing Init and /etc files')
    else:
        upgradeOld()
        installConfig(user)
        installDefault(user)
        installInit()
        installLogrotate()

    # Update django DB
    if options.nodbupdate:
        warning('Not updating Domoweb DB')
    else:
        info("Updating Domoweb DB...")
        updateDb(user, options.db)

   # Test installation
    if options.notest:
        warning('Not testing Domoweb Installation')
    else:
        ok("Everything seems to be good, DomoWeb should be installed correctly.")
        ok("Testing installation")
        raw_input('Please press Enter when ready.')
        try:
            testImports()
            testConfigFiles()
            testInit()
            testDB(options.db)
            django_url = getDjangoUrl()
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

def upgradeOld():
    # Move previous install from /etc/domoweb/domoweb.cfg to /etc/domoweb.cfg
    if os.path.isdir('/etc/domoweb/'):
        if os.path.isfile('/etc/domoweb/domoweb.cfg'):
            info("Found old config path: moving to /etc/domoweb.cfg")
            shutil.move('/etc/domoweb/domoweb.cfg', '/etc/domoweb.cfg')
        os.rmdir('/etc/domoweb/')

def installConfig(user):
    info("Installing /etc/domoweb.cfg")
    uid = pwd.getpwnam(user).pw_uid
    installpath = "%s/examples/config/domoweb.cfg" % os.path.dirname(os.path.abspath(__file__))
    if os.path.isfile('/etc/domoweb.cfg'):
        keep = raw_input('You already have Domoweb configuration files. Do you want to keep them ? [Y/n] ')
        if keep == 'N' or keep == 'n':
            shutil.copy(installpath, '/etc/')
            os.chown('/etc/domoweb.cfg', uid, -1)
    else:
        shutil.copy(installpath, '/etc/')
        os.chown('/etc/domoweb.cfg', uid, -1)

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
        fail("Init directory does not exist (/etc/init.d or /etc/rc.d)")
        sys.exit(1)

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
    easy_install.main( ['setuptools',
                          'django == 1.4',
                          'django-tastypie == 0.9.11',
                          'django-tables2',
                          'simplejson >= 1.9.2',
                          'httplib2 >= 0.6.0',
                          'Distutils2',
                          'CherryPy >= 3.2.2',
                          'south',
                          'manifesto',
                          'ws4py'])

    __import__('pkg_resources').get_distribution('django').activate()
    __import__('pkg_resources').get_distribution('south').activate()
    __import__('pkg_resources').get_distribution('simplejson').activate()

def updateDb(user, db):
    from django.core import management
    from django.conf import settings
    from StringIO import StringIO
    settings.configure(
        DEBUG = False,
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': db,
            }
        },
        INSTALLED_APPS = (
            'django.contrib.auth',
            'django.contrib.contenttypes',
            'django.contrib.sessions',
            'django.contrib.messages',
            'django.contrib.sites',
            'django.contrib.admin',
            'domoweb',
            'south',
        ),
    )

    info("Initialisation DB migration")
    management.call_command("syncdb", interactive=False)
    info("Apply DB migration scripts")
    management.call_command("migrate", "domoweb", delete_ghosts=True)

    uid = pwd.getpwnam(user).pw_uid
    os.chown(db, uid, -1)

def testImports():
    good = True
    info("Test imports")
    try:
        import django
    except ImportError:
        warning("Can't import django, please install it by hand (>= 1.1)")
        good = False
        import httplib
    except ImportError:
        warning("Can't import httplib, please install it by hand (>= 2)")
        good = False
    try:
        import simplejson
    except ImportError:
        warning("Can't import simplejson, please install it by hand (>= 1.1)")
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

    info("Check user config file contents")
    import ConfigParser
    config = ConfigParser.ConfigParser()
    config.read("/etc/domoweb.cfg")

    #check [global] section
    django = dict(config.items('global'))
    ok("Config file correctly loaded")

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

def getDjangoUrl():
    import ConfigParser
    config = ConfigParser.ConfigParser()
    config.read("/etc/domoweb.cfg")
    cherrypy = dict(config.items('global'))
    return "http://127.0.0.1:%s/" % (cherrypy['server.socket_port'])

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
