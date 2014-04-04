#!/usr/bin/env python

import sys
if sys.version_info < (2, 6):
    print "Sorry, requires Python 2.6 or 2.7."
    sys.exit(1)    

# MQ
import os
import json
import zmq
from zmq.eventloop import ioloop
from zmq.eventloop.ioloop import IOLoop
ioloop.install()
from domogik.mq.reqrep.client import MQSyncReq
from domogik.mq.message import MQMessage
import domoweb
from domoweb.db.models import Session
from domoweb.handlers import MainHandler, PageHandler, WidgetHandler

#import tornado.ioloop
import tornado.web
from tornado.options import options
import logging

logging.basicConfig(format='%(asctime)s %(name)s:%(levelname)s %(message)s',level=logging.INFO)

logger = logging.getLogger('domoweb')


def packLoader(pack_path):
    from domoweb.db.models import Widget, SectionIcon, SectionTheme, WidgetOption, WidgetCommand, WidgetSensor, WidgetDevice, WidgetJS, WidgetCSS
    from collections import OrderedDict

    # create a Session
    session = Session()

    # Load all Widgets
    logger.info("PACKS: Loading widgets")
    widgets_path = os.path.join(pack_path, 'widgets')
    session.query(Widget).delete()
    session.query(WidgetOption).delete()
    session.query(WidgetCommand).delete()
    session.query(WidgetSensor).delete()
    session.query(WidgetDevice).delete()
    session.query(WidgetJS).delete()
    session.query(WidgetCSS).delete()
    if os.path.isdir(widgets_path):
        for file in os.listdir(widgets_path):
            if not file.startswith('.'): # not hidden file
                info = os.path.join(widgets_path, file, "info.json")
                if os.path.isfile(info):
                    widgetset_file = open(info, "r")
                    widgetset_json = json.load(widgetset_file, object_pairs_hook=OrderedDict)
                    widgetset_id = widgetset_json["identity"]["id"]
                    widgetset_name = widgetset_json["identity"]["name"]
                    widgetset_version = widgetset_json["identity"]["version"]
                    widgetset_widgets = widgetset_json["widgets"]
                    for wid, widget in widgetset_widgets.items():
                        widget_id = "%s-%s" %(widgetset_id, wid)
                        widget_name = "%s [%s]" % (widget['name'], widgetset_name)
                        widget_template = os.path.join(widgets_path, file, "templates", ("%s.html" % wid))
                        w = Widget(id=widget_id, set_id=widgetset_id, set_name=unicode(widgetset_name), version=widgetset_version, name=unicode(widget_name), height=widget['height'], width=widget['width'], template=widget_template)
                        session.add(w)

                        # Options
                        for pid, param in widget['options'].items():
                            id = "%s-%s" % (widget_id, pid)
                            p = WidgetOption(id=id, widget_id=widget_id, key=pid, name=unicode(param['name']), description=unicode(param['description']), type=param['type'])
                            if 'default' in param:
                                p.default = param['default']
                            if 'required' in param:
                                p.required = param['required']
                            else:
                                p.required = True
                            options={}
                            if 'min_length' in param:
                                options['min_length'] = param['min_length']
                            if 'max_length' in param:
                                options['max_length'] = param['max_length']
                            if 'min_value' in param:
                                options['min_value'] = param['min_value']
                            if 'multilignes' in param:
                                options['multilignes'] = param['multilignes']
                            if 'max_value' in param:
                                options['max_value'] = param['max_value']
                            if 'mask' in param:
                                options['mask'] = param['mask']
                            if 'choices' in param:
                                options['choices'] = param['choices']
                            p.options=unicode(json.dumps(options))
                            session.add(p)
                        # Sensors parameters
                        for pid, param in widget['sensors'].items():
                            id = "%s-%s" % (widget_id, pid)
                            p = WidgetSensor(id=id, widget_id=widget_id, key=pid, name=unicode(param['name']), description=unicode(param['description']), types=json.dumps(param['types']))
                            if 'filters' in param:
                                p.filters = ', '.join(param['filters'])
                            if 'required' in param:
                                p.required = param['required']
                            else:
                                p.required = True
                            session.add(p)
                        # Commands parameters
                        for pid, param in widget['commands'].items():
                            id = "%s-%s" % (widget_id, pid)
                            p = WidgetCommand(id=id, widget_id=widget_id, key=pid, name=unicode(param['name']), description=unicode(param['description']), types=json.dumps(param['types']))
                            if 'filters' in param:
                                p.filters = ', '.join(param['filters'])
                            if 'required' in param:
                                p.required = param['required']
                            else:
                                p.required = True
                            session.add(p)
                        # Devices parameters
                        for pid, param in widget['devices'].items():
                            id = "%s-%s" % (widget_id, pid)
                            p = WidgetDevice(id=id, widget_id=widget_id, key=pid, name=unicode(param['name']), description=unicode(param['description']), types=json.dumps(param['types']))
                            if 'required' in param:
                                p.required = param['required']
                            else:
                                p.required = True
                            session.add(p)
                        # CSS Files
                        for name in widget['css']:
                            f = WidgetCSS(widget_id=widget_id, name=name)
                            session.add(f)
                        # JS Files
                        for name in widget['js']:
                            f = WidgetJS(widget_id=widget_id, name=name)
                            session.add(f)
    session.commit()

    # Load all Iconsets
    logger.info("PACKS: Loading iconsets")
    iconsets_path = os.path.join(pack_path, 'iconsets', 'section')
    session.query(SectionIcon).delete()
    if os.path.isdir(iconsets_path):
        for file in os.listdir(iconsets_path):
            if not file.startswith('.'): # not hidden file
                info = os.path.join(iconsets_path, file, "info.json")
                if os.path.isfile(info):
                    iconset_file = open(info, "r")
                    iconset_json = json.load(iconset_file)
                    iconset_id = iconset_json["identity"]["id"]
                    iconset_name = unicode(iconset_json["identity"]["name"])
                    for icon in iconset_json["icons"]:
                        id = iconset_id + '-' + icon["id"]
                        i = SectionIcon(id=id, iconset_id=iconset_id, iconset_name=iconset_name, icon_id=icon["id"], label=unicode(icon["label"]))
                        session.add(i)
    session.commit()

    # Load all Themes
    logger.info("PACKS: Loading themes")
    themes_path = os.path.join(pack_path, 'themes')
    session.query(SectionTheme).delete()
    if os.path.isdir(themes_path):
        for file in os.listdir(themes_path):
            if not file.startswith('.'): # not hidden file
                info = os.path.join(themes_path, file, "info.json")
                if os.path.isfile(info):
                    theme_file = open(info, "r")
                    theme_json = json.load(theme_file)
                    theme_id = theme_json["identity"]["id"]
                    theme_name = unicode(theme_json["identity"]["name"])
                    t = SectionTheme(id=theme_id, label=theme_name)
                    session.add(t)
    session.commit()
    session.close()

def mqDataLoader(cli):
    from domoweb.db.models import DataType, Device
    # create a Session
    session = Session()

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
        r = DataType(id=type, parameters=json.dumps(params))
        session.add(r)
    session.commit()

    # get packages
#    logger.info("MQ: Loading Devices info")
#    msg = MQMessage()
#    msg.set_action('device.get')
#    res = cli.request('manager', msg.get(), timeout=10)
#    if res is not None:
#        _data = res.get_data()
#    else:
#        _data = {}

#    session.query(Device).delete()
#    for device in _data.iteritems():
#        d = Device(id=d.id, name=data.name, type_id=data.device_type_id, reference=data.reference)
#        device.save()
#        if "commands" in data:
#            for cmd in data.commands:
#                command = data.commands[cmd]
#                c = Command(id=command.id, name=command.name, device=device, reference=command.reference, return_confirmation=command.return_confirmation)
#                c.save()
#                for param in command.parameters:
#                    p = CommandParam(command=c, key=param.key, datatype_id=param.data_type)
#                    p.save()
#        if "sensors" in data:
#            for sen in data.sensors:
#                sensor = data.sensors[sen]
#                s = Sensor(id=sensor.id, name=sensor.name, device=device, reference=sensor.reference, datatype_id=sensor.data_type, last_value=sensor.last_value, last_received=sensor.last_received)
#                s.save()

#    session.commit()
    session.close()

domoweb.FULLPATH = os.path.normpath(os.path.abspath(__file__))
domoweb.PROJECTPATH = os.path.dirname(domoweb.FULLPATH)
domoweb.PACKSPATH = os.path.join(domoweb.PROJECTPATH, 'packs')

application = tornado.web.Application(
    handlers=[
        (r"/(\d*)", MainHandler),
        (r"/page", PageHandler),
        (r"/widget", WidgetHandler),
    ],
    template_path=os.path.join(os.path.dirname(__file__), "templates"),
    static_path=os.path.join(os.path.dirname(__file__), "static"),
    debug=True,
    autoreload=True,
)

if __name__ == '__main__':

#    domoweb.VERSION = "dev.%s" % commands.getoutput("cd %s ; hg id -n 2>/dev/null" % domoweb.PROJECTPATH)

    # Check log folder
    if not os.path.isdir("/var/log/domoweb"):
        sys.stderr.write("Error: /var/log/domoweb do not exist")
        sys.exit(1)
    
    # Check config file
    SERVER_CONFIG = '/etc/domoweb.cfg'
    if not os.path.isfile(SERVER_CONFIG):
        sys.stderr.write("Error: Can't find the file '%s'\n" % SERVER_CONFIG)
        sys.exit(1)

    options.define("sqlite_db", default="/var/lib/domoweb/db.sqlite", help="Database file path", type=str)
    options.define("port", default=40404, help="Launch on the given port", type=int)
    options.define("debut", default=False, help="Debug mode", type=bool)
    options.parse_config_file("/etc/domoweb.cfg")

    logger.info("Running from : %s" % domoweb.PROJECTPATH)

    packLoader(domoweb.PACKSPATH)
    cli = MQSyncReq(zmq.Context())
    mqDataLoader(cli)

    logger.info("Starting tornado web server")
    application.listen(options.port)
    ioloop.IOLoop.instance().start() 
