#!/usr/bin/env python
from tornado import web, websocket
from tornado.options import options
from tornado.web import RequestHandler, StaticFileHandler
from domoweb.models import to_json, Section, Widget, DataType, WidgetInstance, WidgetInstanceOption, WidgetInstanceSensor, WidgetInstanceCommand, WidgetInstanceDevice, SectionParam, Sensor
from domoweb.forms import WidgetInstanceForms

import os
import json
import logging
logger = logging.getLogger('domoweb')

import zmq
from domogik.mq.pubsub.subscriber import MQAsyncSub
from domogik.mq.reqrep.client import MQSyncReq
from domogik.mq.message import MQMessage

socket_connections = []

class MainHandler(RequestHandler):
    def get(self, id):
        if not id:
            id = 1
        section = Section.get(id)
        params = dict ((p.key, p.value) for p in SectionParam.getSection(id))
        widgets = Widget.getSection(section_id=id)
        packs = Widget.getSectionPacks(section_id=id)
        self.render('base.html',
            section = section,
            params = params,
            widgets = widgets,
            packs = packs,
            )

class TestHandler(RequestHandler):
    def get(self, id):
        instance = WidgetInstance.get(id);
        self.render('test.html',
            instance = instance,
            )

class ConfigurationHandler(RequestHandler):
    def get(self):
        action = self.get_argument('action', None)
        id = self.get_argument('id', None)
        # Widget section box
        if action=='widget':
            instance = WidgetInstance.get(id);
            forms = WidgetInstanceForms(instance=instance)
            self.render('widgetConfiguration.html', instance=instance, forms=forms)
        elif action=='section':
            section = Section.get(id)
            params = dict ((p.key, p.value) for p in SectionParam.getSection(id))
            backgrounds = [f for f in os.listdir('/var/lib/domoweb/backgrounds') if any(f.lower().endswith(x) for x in ('.jpeg', '.jpg','.gif','.png'))]
            self.render('sectionConfiguration.html', section=section, params=params, backgrounds=backgrounds)

    def post(self):
        action = self.get_argument('action', None)
        id = self.get_argument('id', None)
        if action=='widget':
            instance = WidgetInstance.get(id);
            forms = WidgetInstanceForms(instance=instance, handler=self)
            if forms.validate():
                forms.save();
                d = WidgetInstanceOption.getInstanceDict(instance_id=id)
                jsonoptions = {'instance_id':id, 'options':d}
                d = WidgetInstanceSensor.getInstanceDict(instance_id=id)
                jsonsensors = {'instance_id':id, 'sensors':d}
                d = WidgetInstanceCommand.getInstanceDict(instance_id=id)
                jsoncommands = {'instance_id':id, 'commands':d}
                for socket in socket_connections:
                    socket.sendMessage(['widgetinstance-options', jsonoptions]);
                    socket.sendMessage(['widgetinstance-sensors', jsonsensors]);
                    socket.sendMessage(['widgetinstance-commands', jsoncommands]);
                self.write("{success:true}")
            else:
                self.render('widgetConfiguration.html', instance=instance, forms=forms)
        elif action=='section':
            Section.update(id, self.get_argument('sectionName'), self.get_argument('sectionDescription', None))
            for p, v in self.request.arguments.iteritems():
                if p.startswith( 'params' ):
                    SectionParam.saveKey(section_id=id, key=p[6:], value=v[0])

            json = to_json(Section.get(id))
            json['params'] = dict ((p.key, p.value) for p in SectionParam.getSection(id))
            for socket in socket_connections:
                socket.sendMessage(['section-details', json])
            self.write("{success:true}")

class WSHandler(websocket.WebSocketHandler):
    def open(self):
        socket_connections.append(self)
    def on_close(self):
        socket_connections.remove(self)

    def on_message(self, message):
        logger.info("WS: Received message %s" % message)
        jsonmessage = json.loads(message)
        data = {
            'section-get' : self.WSSectionGet,
            'widget-getall' : self.WSWidgetsGetall,
            'widgetinstance-add' : self.WSWidgetInstanceAdd,
            'widgetinstance-order' : self.WSWidgetInstanceOrder,
            'widgetinstance-remove' : self.WSWidgetInstanceRemove,
            'widgetinstance-getsection' : self.WSWidgetInstanceGetsection,
            'widgetinstance-getoptions' : self.WSWidgetInstanceGetoptions,
            'widgetinstance-getsensors' : self.WSWidgetInstanceGetsensors,
            'widgetinstance-getcommands' : self.WSWidgetInstanceGetcommands,
            'widgetinstance-getdevices' : self.WSWidgetInstanceGetdevices,
            'datatype-getall' : self.WSDatatypesGetall,
            'command-send' : self.WSCommandSend,
            'sensor-gethistory': self.WSSensorGetHistory,
            'sensor-getlast': self.WSSensorGetLast,
        }[jsonmessage[0]](jsonmessage[1])
        if (data):
            self.sendMessage(data)

    def WSSectionGet(self, data):
        section = Section.get(data['id'])
        j = to_json(section)
        j['params'] = dict ((p.key, p.value) for p in SectionParam.getSection(data['id']))
        return ['section-details', j]

    def WSWidgetsGetall(self, data):
        widgets = Widget.getAll()
        return ['widget-list', to_json(widgets)]

    def WSWidgetInstanceAdd(self, data):
        i = WidgetInstance.add(section_id=data['section_id'], widget_id=data['widget_id'])
        json = to_json(i)
        json["widget"] = to_json(i.widget)
        return ['widgetinstance-added', json];

    def WSWidgetInstanceRemove(self, data):
        i = WidgetInstance.delete(data['instance_id'])
        json = to_json(i)
        json["widget"] = to_json(i.widget)
        return ['widgetinstance-removed', json];

    def WSWidgetInstanceOrder(self, data):
        i = WidgetInstance.updateOrder(id=data['instance_id'], order=data['order'])
        json = to_json(i)
        json["widget"] = to_json(i.widget)
        return True;

    def WSWidgetInstanceGetsection(self, data):
        r = WidgetInstance.getSection(section_id=data['section_id'])
        json = {'section_id':data['section_id'], 'instances':to_json(r)}
        for index, item in enumerate(r):
            if item.widget:
                json['instances'][index]["widget"] = to_json(item.widget)
            else: #remove instance
                logger.info("Section: Widget '%s' not installed, removing instance" % item.widget_id)
                WidgetInstance.delete(item.id)
                del json['instances'][index]
        return ['widgetinstance-sectionlist', json];

    def WSWidgetInstanceGetoptions(self, data):
        d = WidgetInstanceOption.getInstanceDict(instance_id=data['instance_id'])
        json = {'instance_id':data['instance_id'], 'options':d}
        return ['widgetinstance-options', json];

    def WSWidgetInstanceGetsensors(self, data):
        d = WidgetInstanceSensor.getInstanceDict(instance_id=data['instance_id'])
        json = {'instance_id':data['instance_id'], 'sensors':d}
        return ['widgetinstance-sensors', json];

    def WSWidgetInstanceGetcommands(self, data):
        d = WidgetInstanceCommand.getInstanceDict(instance_id=data['instance_id'])
        json = {'instance_id':data['instance_id'], 'commands':d}
        return ['widgetinstance-commands', json];

    def WSWidgetInstanceGetdevices(self, data):
        d = WidgetInstanceDevice.getInstanceDict(instance_id=data['instance_id'])
        json = {'instance_id':data['instance_id'], 'devices':d}
        return ['widgetinstance-devices', json];

    def WSDatatypesGetall(self, data):
        datatypes =dict ((o.id, json.loads(o.parameters)) for o in DataType.getAll())
        return ['datatype-list', datatypes]

    def WSCommandSend(self, data):
        cli = MQSyncReq(zmq.Context())
        msg = MQMessage()
        msg.set_action('cmd.send')
        msg.add_data('cmdid', data['command_id'])
        msg.add_data('cmdparams', data['parameters'])
        return cli.request('xplgw', msg.get(), timeout=10).get()

    def WSSensorGetHistory(self, data):
        import requests
        response = requests.get('%s/sensorhistory/id/%d/from/%d/to/%d' % (options.rest_url, data['id'],data['from'],data['to']))
        try:
            history = response.json()
        except ValueError:
            history = []
        json = {'id':data['id'], 'history':history}
        return ['sensor-history', json];

    def WSSensorGetLast(self, data):
        import requests
        response = requests.get('%s/sensorhistory/id/%d/last/%d' % (options.rest_url, data['id'],data['count']))
        try:
            history = response.json()
        except ValueError:
            history = []
        json = {'id':data['id'], 'history':history}
        return ['sensor-history', json];

    def sendMessage(self, content):
        data=json.dumps(content)
        logger.info("WS: Sending message %s" % data)
        self.write_message(data)

class NoCacheStaticFileHandler(web.StaticFileHandler):
    def set_extra_headers(self, path):
        # Disable cache
        self.set_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')

class MQHandler(MQAsyncSub):
    def __init__(self):
        MQAsyncSub.__init__(self, zmq.Context(), 'test', ['device-stats'])

    def on_message(self, msgid, content):
        logger.info(u"MQ: New pub message {0}".format(msgid))
        logger.info(u"MQ: {0}".format(content))

        # If sensor stat, we update the sensor last value
        if msgid == 'device-stats':
            Sensor.update(content["sensor_id"], content["timestamp"], content["stored_value"])

        for socket in socket_connections:
            socket.sendMessage([msgid, content])

class UploadHandler(RequestHandler):
    def post(self):
        from PIL import Image
        original_fname = self.get_argument('qqfile', None)
        fileName, fileExtension = os.path.splitext(original_fname)
        tmpFileName = fileName
        i = 0
        while os.path.isfile("/var/lib/domoweb/backgrounds/%s%s" % (tmpFileName , fileExtension)):
            i += 1
            tmpFileName = "%s_%d" % (fileName, i)

        final_fname = "/var/lib/domoweb/backgrounds/%s%s" % (tmpFileName , fileExtension)
        output_file = open(final_fname, 'wb')
        output_file.write(self.request.body)
        output_file = open(final_fname, 'r+b')

        # Create Thumbnail
        basewidth = 128
        img = Image.open(output_file)
        wpercent = (basewidth / float(img.size[0]))
        hsize = int((float(img.size[1]) * float(wpercent)))
        img.thumbnail((basewidth, hsize), Image.ANTIALIAS)
        img.save("/var/lib/domoweb/backgrounds/thumbnails/%s%s" % (tmpFileName , fileExtension), "JPEG")
        self.finish("{success:true}")

class MultiStaticFileHandler(StaticFileHandler):

    def get(self, ns, lang, file):
        path = "%s/locales/%s/%s" % (ns, lang, file)
        return super(MultiStaticFileHandler, self).get(path)
