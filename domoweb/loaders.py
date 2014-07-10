
import os
import json
import zmq

from domoweb.models import Session, Widget, SectionIcon, WidgetOption, WidgetCommand, WidgetSensor, WidgetDevice, DataType, Device, Command, Sensor, CommandParam
from collections import OrderedDict
from domogik.mq.reqrep.client import MQSyncReq
from domogik.mq.message import MQMessage

import logging

logger = logging.getLogger('domoweb')
cli = MQSyncReq(zmq.Context())

class packLoader:
    @classmethod
    def loadWidgets(cls, pack_path):
        session = Session()

        # Load all Widgets
        logger.info("PACKS: Loading widgets")
        widgets_path = os.path.join(pack_path, 'widgets')
        session.query(Widget).delete()
        session.query(WidgetOption).delete()
        session.query(WidgetCommand).delete()
        session.query(WidgetSensor).delete()
        session.query(WidgetDevice).delete()
        if os.path.isdir(widgets_path):
            for file in os.listdir(widgets_path):
                if not file.startswith('.'): # not hidden file
                    info = os.path.join(widgets_path, file, "info.json")
                    if os.path.isfile(info):
                        widgetset_file = open(info, "r")
                        try:
                            widgetset_json = json.load(widgetset_file, object_pairs_hook=OrderedDict)
                        except Exception, e:
                            logger.error("Parsing error : %s: %s" % (info, str(e)) );
#                            raise e
                        else: 
                            widgetset_id = widgetset_json["identity"]["id"]
                            widgetset_name = widgetset_json["identity"]["name"]
                            widgetset_version = widgetset_json["identity"]["version"]
                            widgetset_widgets = widgetset_json["widgets"]
                            for wid, widget in widgetset_widgets.items():
                                widget_id = "%s-%s" %(widgetset_id, wid)
                                w = Widget(id=widget_id, set_id=widgetset_id, set_name=unicode(widgetset_name), set_ref=wid, version=widgetset_version, name=unicode(widget['name']), height=widget['height'], width=widget['width'])
                                session.add(w)
                                if 'default_style' in widget:
                                    w.default_style = (widget['default_style'] == True)
                                else:
                                    w.default_style = True

                                # Options
                                for pid, param in widget['options'].items():
                                    id = "%s-%s" % (widget_id, pid)
                                    try:
                                        description = unicode(param['description'])
                                    except KeyError:
                                        description = None
                                    p = WidgetOption(id=id, widget_id=widget_id, key=pid, name=unicode(param['name']), type=param['type'])
                                    if 'description' in param:
                                        p.description = unicode(param['description'])
                                    if 'default' in param:
                                        p.default = param['default']
                                    if 'required' in param:
                                        p.required = param['required']
                                    else:
                                        p.required = True
                                    parameters={}
                                    if 'min_length' in param:
                                        parameters['min_length'] = param['min_length']
                                    if 'max_length' in param:
                                        parameters['max_length'] = param['max_length']
                                    if 'min_value' in param:
                                        parameters['min_value'] = param['min_value']
                                    if 'multilignes' in param:
                                        parameters['multilignes'] = param['multilignes']
                                    if 'max_value' in param:
                                        parameters['max_value'] = param['max_value']
                                    if 'mask' in param:
                                        parameters['mask'] = param['mask']
                                    if 'choices' in param:
                                        parameters['choices'] = param['choices']
                                    p.parameters=unicode(json.dumps(parameters))
                                    session.add(p)
                                # Sensors parameters
                                for pid, param in widget['sensors'].items():
                                    id = "%s-%s" % (widget_id, pid)
                                    p = WidgetSensor(id=id, widget_id=widget_id, key=pid, name=unicode(param['name']), types=json.dumps(list(param['types'])))
                                    if 'description' in param:
                                        p.description = unicode(param['description'])
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
                                    p = WidgetCommand(id=id, widget_id=widget_id, key=pid, name=unicode(param['name']), types=json.dumps(param['types']))
                                    if 'description' in param:
                                        p.description = unicode(param['description'])
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
        session.commit()
        session.close()

    @classmethod
    def loadIconsets(cls, pack_path):
        session = Session()
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
        session.close()

class mqDataLoader:
    @classmethod
    def loadDatatypes(cls):
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
        session.flush()

    @classmethod
    def loadDevices(cls):
        logger.info("MQ: Loading Devices info")
        Device.clean()
        msg = MQMessage()
        msg.set_action('client.list.get')
        res = cli.request('manager', msg.get(), timeout=10)
        if res is not None:
            _datac = res.get_data()
        else:
            _datac = {}
        session = Session()
        for client in _datac.itervalues(): 
            # for each plugin client, we request the list of devices
            if client["type"] == "plugin":
                msg = MQMessage()
                msg.set_action('device.get')
                msg.add_data('type', 'plugin')
                msg.add_data('name', client["name"])
                msg.add_data('host', client["host"])
                res = cli.request('dbmgr', msg.get(), timeout=10)
                if res is not None:
                    _datad = res.get_data()
                else:
                    _datad = {}
                if 'devices' in _datad:
                    for device in _datad["devices"]:
                        d = Device(id=device["id"], name=device["name"], type=device["device_type_id"], reference=device["reference"])
                        session.add(d)
                        if "commands" in device:
                            for ref, command  in device["commands"].iteritems():
                                c = Command(id=command["id"], name=command["name"], device_id=device["id"], reference=ref, return_confirmation=command["return_confirmation"])
                                session.add(c)
                                c.datatypes = ""
                                for param in command["parameters"]:
                                    p = CommandParam(command_id=c.id, key=param["key"], datatype_id=param["data_type"])
                                    session.add(p)
                                    c.datatypes += param["data_type"]
                                session.add(c)
                        if "sensors" in device:
                            for ref, sensor in device["sensors"].iteritems():
                                s = Sensor(id=sensor["id"], name=sensor["name"], device_id=device["id"], reference=ref, datatype_id=sensor["data_type"], last_value=sensor["last_value"], last_received=sensor["last_received"])
                                session.add(s)

        session.commit()
        session.flush()
