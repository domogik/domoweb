#!/usr/bin/env python

import sys
if sys.version_info < (2, 6):
    print "Sorry, requires Python 2.6 or 2.7."
    sys.exit(1)    

# MQ
import os
import simplejson
import zmq
from zmq.eventloop import ioloop
from zmq.eventloop.ioloop import IOLoop
ioloop.install()
from domogik.mq.reqrep.client import MQSyncReq
from domogik.mq.message import MQMessage

#import tornado.ioloop
import tornado.web
from tornado.options import options
import domoweb
from domoweb.db.models import engine, Widget, PageIcon, PageTheme, DataType, Package, PackageDeviceType, PackageDependency, PackageUdevRule, PackageProduct
from sqlalchemy.orm import sessionmaker

import logging
logging.basicConfig(format='%(asctime)s %(name)s:%(levelname)s %(message)s',level=logging.INFO)

logger = logging.getLogger('domoweb')

class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.write("Hello, world")

application = tornado.web.Application([
    (r"/", MainHandler),
])


def packLoader(session, pack_path):

    # Load all Widgets
    logger.info("PACKS: Loading widgets")
    widgets_path = os.path.join(pack_path, 'widgets')
    session.query(Widget).delete()
    if os.path.isdir(widgets_path):
        for file in os.listdir(widgets_path):
            if not file.startswith('.'): # not hidden file
                main = os.path.join(widgets_path, file, "main.js")
                if os.path.isfile(main):
                    w = Widget(id=file)
                    session.add(w)
    session.commit()

    # Load all Iconsets
    logger.info("PACKS: Loading iconsets")
    iconsets_path = os.path.join(pack_path, 'iconsets', 'page')
    session.query(PageIcon).delete()
    if os.path.isdir(iconsets_path):
        for file in os.listdir(iconsets_path):
            if not file.startswith('.'): # not hidden file
                info = os.path.join(iconsets_path, file, "info.json")
                if os.path.isfile(info):
                    iconset_file = open(info, "r")
                    iconset_json = simplejson.load(iconset_file)
                    iconset_id = iconset_json["identity"]["id"]
                    iconset_name = unicode(iconset_json["identity"]["name"])
                    for icon in iconset_json["icons"]:
                        id = iconset_id + '-' + icon["id"]
                        i = PageIcon(id=id, iconset_id=iconset_id, iconset_name=iconset_name, icon_id=icon["id"], label=unicode(icon["label"]))
                        session.add(i)
    session.commit()

    # Load all Themes
    logger.info("PACKS: Loading themes")
    themes_path = os.path.join(pack_path, 'themes')
    session.query(PageTheme).delete()
    if os.path.isdir(themes_path):
        for file in os.listdir(themes_path):
            if not file.startswith('.'): # not hidden file
                info = os.path.join(themes_path, file, "info.json")
                if os.path.isfile(info):
                    theme_file = open(info, "r")
                    theme_json = simplejson.load(theme_file)
                    theme_id = theme_json["identity"]["id"]
                    theme_name = unicode(theme_json["identity"]["name"])
                    t = PageTheme(id=theme_id, label=theme_name)
                    session.add(t)
    session.commit()

def mqDataLoader(session, cli):
    # get all datatypes
    logger.info("MQ: Loading Datatypes")
    msg = MQMessage()
    msg.set_action('datatype.get')
    res = cli.request('manager', msg.get(), timeout=10)
    if res is not None:
        _data = res.get_data()['datatypes']
    else:
        _data = {}

    session.query(DataType).delete()
    for type, params in _data.iteritems():
        r = DataType(id=type, parameters=simplejson.dumps(params))
        session.add(r)
    session.commit()

    # get packages
    logger.info("MQ: Loading Packages info")
    msg = MQMessage()
    msg.set_action('package.detail.get')
    res = cli.request('manager', msg.get(), timeout=10)
    if res is not None:
        _data = res.get_data()
    else:
        _data = {}

    session.query(Package).delete()
    session.query(PackageDeviceType).delete()
    session.query(PackageDependency).delete()
    session.query(PackageUdevRule).delete()
    session.query(PackageProduct).delete()
    for id, attributes in _data.iteritems():
        identity = attributes['identity']
        p = Package(id=id, name=unicode(identity['name']), type=identity['type'], version=identity['version']
                    , author = identity['author'], author_email = identity['author_email']
                    , description = identity['description'])
        if 'tags' in attributes:
            p.tags = ', '.join(identity['tags'])
        session.add(p)
        if 'device_types' in attributes:
            for id, device_type in attributes['device_types'].iteritems():
                d = PackageDeviceType(package_id=p.id, id=id, name=unicode(device_type['name']), description=unicode(device_type['description']))
                session.add(d)
        if 'dependencies' in identity:
            for dependency in identity['dependencies']:
                d = PackageDependency(package_id=p.id, id=dependency['id'], type=dependency['type'])
                session.add(d)
        if 'udev_rules' in attributes:
            for udev_rule in attributes['udev_rules']:
                u = PackageUdevRule(package_id=p.id, filename=unicode(udev_rule['filename']), rule=unicode(udev_rule['rule']), description=unicode(udev_rule['description']), model=unicode(udev_rule['model']))
                session.add(u)
        if 'products' in attributes:
            for product in attributes['products']:
                pp = PackageProduct(package_id=p.id, id=product['id'], name=unicode(product['name']), documentation=unicode(product['documentation']), device_type=product['type'])
                session.add(pp)
    session.commit()

if __name__ == '__main__':

    domoweb.FULLPATH = os.path.normpath(os.path.abspath(__file__))
    domoweb.PROJECTPATH = os.path.dirname(domoweb.FULLPATH)
#    engine.log("Running from : %s" % domoweb.PROJECTPATH)
    domoweb.PACKSPATH = os.path.join(domoweb.PROJECTPATH, 'packs')
#    domoweb.VERSION = "dev.%s" % commands.getoutput("cd %s ; hg id -n 2>/dev/null" % domoweb.PROJECTPATH)
#    engine.log("Version : %s" % domoweb.VERSION)

    # Check log folder
    if not os.path.isdir("/var/log/domoweb"):
        sys.stderr.write("Error: /var/log/domoweb do not exist")
        sys.exit(1)

    # Check run folder
#    if not os.path.isdir("/var/run/domoweb"):
#        sys.stderr.write("Error: /var/run/domoweb do not exist")
#        sys.exit(1)
    
    # Check config file
    SERVER_CONFIG = '/etc/domoweb.cfg'
    if not os.path.isfile(SERVER_CONFIG):
        sys.stderr.write("Error: Can't find the file '%s'\n" % SERVER_CONFIG)
        sys.exit(1)

    options.define("sqlite_db", default="/var/lib/domoweb/db.sqlite", help="Database file path", type=str)
    options.define("port", default=40404, help="run on the given port", type=int)
    options.parse_config_file("/etc/domoweb.cfg")

    # create a configured "Session" class
    Session = sessionmaker(bind=engine)
    # create a Session
    session = Session()
    packLoader(session, domoweb.PACKSPATH)
    cli = MQSyncReq(zmq.Context())
    mqDataLoader(session, cli)

    logger.info("Starting tornado web server")
    application.listen(options.port)
    ioloop.IOLoop.instance().start() 
