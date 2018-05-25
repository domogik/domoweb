
import os
import json
import zmq

from domoweb.models import Session, SessionLock, Widget, Theme, WidgetOption, WidgetCommand, WidgetSensor, WidgetDevice, DataType, Device, Command, Sensor, CommandParam, WidgetInstance
from collections import OrderedDict
from domogikmq.reqrep.client import MQSyncReq
from domogikmq.message import MQMessage
from sqlalchemy.orm import joinedload

import logging
import time
import traceback

logger = logging.getLogger('domoweb')
cli = MQSyncReq(zmq.Context())

class packLoader:
    @classmethod
    def loadWidgets(cls, pack_path, develop):
        with SessionLock :
            session = Session()

            # Load all Widgets
            logger.info(u"PACKS: Loading widgets")
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
                                logger.error(u"Parsing error : {0}: {1}".format(info, str(e)))
    #                            raise e
                            else:
                                widgetset_id = widgetset_json["identity"]["id"]
                                widgetset_name = widgetset_json["identity"]["name"]
                                widgetset_version = widgetset_json["identity"]["version"]
                                widgetset_widgets = widgetset_json["widgets"]
                                for wid, widget in widgetset_widgets.items():
                                    if develop or (not develop and not 'dev' in widget):
                                        # Handle json without size limits
                                        if not 'min_height' in widget : widget['min_height'] = widget['height']
                                        if not 'min_width' in widget : widget['min_width'] = widget['width']
                                        if not 'max_height' in widget : widget['max_height'] = widget['height']
                                        if not 'max_width' in widget : widget['max_width'] = widget['width']
                                        widget_id = "%s-%s" %(widgetset_id, wid)
                                        w = Widget(id=widget_id, set_id=widgetset_id, set_name=unicode(widgetset_name), set_ref=wid, version=widgetset_version,
                                                    name=unicode(widget['name']), height=widget['height'], width=widget['width'],
                                                    min_height = widget['min_height'],
                                                    min_width = widget['min_width'],
                                                    max_height = widget['max_height'],
                                                    max_width = widget['max_width'])
                                        session.add(w)
                                        if 'default_style' in widget:
                                            w.default_style = (widget['default_style'] == True)
                                        else:
                                            w.default_style = True
                                        # Specific Style
                                        if 'style' in widget:
                                            w.style = unicode(json.dumps(widget['style']))

                                        # Options
                                        if 'options' in widget:
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
                                        if 'sensors' in widget:
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
                                                if 'group' in param:
                                                    p.group = param['group']
                                                if 'groupmin' in param:
                                                    p.groupmin = param['groupmin']
                                                if 'groupmax' in param:
                                                    p.groupmax = param['groupmax']
                                                session.add(p)
                                        if 'commands' in widget:
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
                                        if 'devices' in widget:
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

            # Remove instances of missing widgets
            session = Session()
            wis = session.query(WidgetInstance).options(joinedload('section')).outerjoin(Widget).filter(Widget.id==None).all()
            for i, wi in enumerate(wis):
                logger.warning(u"Widget %s not found. Deleting instance {0} section '{1}'".format(wi.widget_id, wi.id, wi.section.name))
                session.delete(wi)
            session.commit()
            session.close()


    @classmethod
    def loadThemes(cls, pack_path, develop):
        with SessionLock :
            session = Session()
            # Load all Themes
            logger.info(u"PACKS: Loading themes")
            themes_path = os.path.join(pack_path, 'themes')
            session.query(Theme).delete()
            if os.path.isdir(themes_path):
                for file in os.listdir(themes_path):
                    if not file.startswith('.'): # not hidden file
                        info = os.path.join(themes_path, file, "info.json")
                        if os.path.isfile(info):
                            theme_file = open(info, "r")
                            theme_json = json.load(theme_file)
                            theme_id = theme_json["identity"]["id"]
                            theme_name = unicode(theme_json["identity"]["name"])
                            theme_version = theme_json["identity"]["version"]
                            t = Theme(id=theme_id, name=theme_name, version=theme_version, style=unicode(json.dumps(theme_json['style'])))
                            if 'description' in theme_json["identity"]:
                                t.description = theme_json["identity"]["description"]
                            session.add(t)
            session.commit()
            session.close()

class mqDataLoader:
    @classmethod
    def loadDatatypes(cls, develop):
        with SessionLock :
            session = Session()

            # get all datatypes
            logger.info(u"MQ: Loading Datatypes")
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
    def loadDevices(cls, develop):
        logger.info(u"MQ: Loading Devices info")
        Device.clean()
        msg = MQMessage()
        msg.set_action('client.list.get')
        res = cli.request('manager', msg.get(), timeout=10)
        if res is None:
            _datac = {}
            logger.info(u"MQ: No client find. No devices to load.")
        else:
            _datac = res.get_data()
            data = mqDataLoader._loadDevices([], _datac)
            with SessionLock :
                session = Session()
                for d in data :
                    session.add(d)
                session.commit()
                session.flush()

    @classmethod
    def _loadDevices(cls, data, clients=None, nbTry=1) :
        retryClients = {}
        global cli
        for client in clients.itervalues():
            # for each plugin client, we request the list of devices
            if client["type"] == "plugin":
                clientId = u"{0}-{1}.{2}".format("plugin", client["name"], client["host"])
                msg = MQMessage()
                msg.set_action('device.get')
                msg.add_data('type', 'plugin')
                msg.add_data('name', client["name"])
                msg.add_data('host', client["host"])
                logger.info(u"MQ: Get devices list for client {0} [Try : {1}]".format(clientId, nbTry))
                try :
                    res = cli.request('admin', msg.get(), timeout=10)
                except zmq.ZMQError as e:
                    logger.error(u"MQ FAIL to get list [try : {0}] for client {1}, ZMQError : {2}".format(nbTry, clientId, e))
                    logger.info(u"Loading device wait 5s ... and reload ZMQ")
                    time.sleep(5)
                    cli = MQSyncReq(zmq.Context())
                except :
                    logger.error(u"FAIL to get list [try : {0}] for client {1} : {2}".format(nbTry, clientId, traceback.format_exc()))
                    retryClients.update({clientId: client})
                else :
                    if res is not None:
                        _datad = res.get_data()
                        if _datad['name'] == client["name"] and _datad['host'] == client["host"] :
                            if 'devices' in _datad:
                                logger.info(u"MQ: {0} device(s) for {1} OK".format(len(_datad["devices"]), clientId))
                                for device in _datad["devices"]:
                                    logger.info(u"- {0}".format(device["name"]))
                                    d = Device(id=device["id"], name=device["name"], type=device["device_type_id"], reference=device["reference"])
                                    data.append(d)
                                    if "commands" in device:
                                        for ref, command  in device["commands"].iteritems():
                                            c = Command(id=command["id"], name=command["name"], device_id=device["id"], reference=ref, return_confirmation=command["return_confirmation"])
                                            data.append(c)
                                            c.datatypes = ""
                                            for param in command["parameters"]:
                                                p = CommandParam(command_id=c.id, key=param["key"], datatype_id=param["data_type"])
                                                data.append(p)
                                                c.datatypes += param["data_type"]
                                            data.append(c)
                                    if "sensors" in device:
                                        for ref, sensor in device["sensors"].iteritems():
                                            s = Sensor(id=sensor["id"], name=sensor["name"], device_id=device["id"], reference=ref, datatype_id=sensor["data_type"], last_value=sensor["last_value"], last_received=sensor["last_received"], timeout=sensor["timeout"])
                                            data.append(s)
                            else :
                                logger.info(u"MQ: no devices for {0}".format(clientId))
                        else :
                            logger.warning(u"MQ: reply for bad client {0}-{1}.{2} instead of {3} (queueing retry {4}/3)".format("plugin", _datad["name"], _datad["host"], clientId, nbTry+1))
                            retryClients.update({clientId: client})
                    else :
                        _datad = {}
                        logger.warning(u"MQ: ERROR None response for {0} (queueing retry {1}/3)".format(clientId, nbTry+1))
                        retryClients.update({clientId: client})
        if retryClients !={}:
            if nbTry < 3 :
                nbTry+=1
                time.sleep(nbTry*3)
                data = mqDataLoader._loadDevices(data, retryClients, nbTry)
            else :
                logger.error(u"MQ: Critical ERROR on loading devices client : {0}".format(retryClients))
        return data

    @classmethod
    def loadPersons(cls, develop):
        logger.info(u"MQ: Loading Persons info")
        msg = MQMessage()
        msg.set_action('person.get')
        res = cli.request('admin', msg.get(), timeout=10)
        if res is not None:
            persons = res.get_data()["persons"]
        else:
            persons = []
        with SessionLock :
            session = Session()
            for person in persons:
                logger.info(u"- person '{0} {1}'".format(person['first_name'], person['last_name']))
                if person["location_sensor"] != None:
                    # TODO : grab from MQ or complete the person MQ result to include the sensor informations
                    s = Sensor(id=person["location_sensor"],
                               name="{0} {1} location".format(person['first_name'], person['last_name']),
                               device_id=0,
                               reference="",
                               datatype_id=0,
                               last_value=0,
                               last_received=0,
                               timeout=0)
                    session.add(s)

            session.commit()
            session.flush()
