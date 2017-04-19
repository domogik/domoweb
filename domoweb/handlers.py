#!/usr/bin/env python
from tornado import web, websocket, gen
from tornado.options import options
from tornado.web import RequestHandler, StaticFileHandler, authenticated
from tornado.gen import Return
from tornado.escape import json_decode
from tornado.httpclient import AsyncHTTPClient, HTTPClient, HTTPError, HTTPRequest

from domoweb.models import to_json, Section, Widget, DataType, WidgetInstance, WidgetInstanceOption, WidgetInstanceSensor, WidgetInstanceCommand, WidgetInstanceDevice, SectionParam, Sensor, Theme
from domoweb.forms import WidgetInstanceForms, WidgetStyleForm
from domoweb.loaders import mqDataLoader

import os
import json
import logging
logger = logging.getLogger('domoweb')

import zmq
from domogikmq.pubsub.subscriber import MQAsyncSub
from domogikmq.reqrep.client import MQSyncReq
from domogikmq.message import MQMessage
from domogikmq.pubsub.publisher import MQPub


import traceback
import time

# TODO : python3
import urllib

socket_connections = []

class BaseHandler(RequestHandler):
    def get_current_user(self):
        return self.get_secure_cookie("user")

class MainHandler(BaseHandler):
    @authenticated
    def get(self, id):
        if not id:
            id = 1
        section = Section.get(id)
        id = section.id
        packs = Widget.getSectionPacks(section_id=id)
        params = Section.getParamsDict(id)
        sections = Section.getTree()
        self.render('base.html',
            section = section,
            params = params,
            packs = packs,
            sections = sections,
            )

class LogoutHandler(BaseHandler):
    def get(self):
        self.clear_cookie("user")
        self.redirect("/")

class LoginHandler(BaseHandler):
    def get(self):
        msg = None
        if options.rest_url.startswith("http://"):
            msg = "You are not using a secured Domogik server. Please consider activating SSL on Domogik and configure Domoweb to use the new url!"
        self.render("login.html", error = None, info = msg)

    def post(self):
        status, msg = self.check_permission(self.get_argument("name", None), self.get_argument("password", None))
        if status:
            self.set_secure_cookie("user", self.get_argument("name"))
            self.redirect("/")
        else:
            self.render("login.html", error = msg, info = None)

    def check_permission(self, username, password):
        logger.info("Authentication : checking persmission. User='{0}'".format(username))

        # we test a protected url on the rest server to check if the account exists
        url = '{0}/device'.format(options.rest_url).replace("://", "://{0}:{1}@".format(username, password))
        logger.info("REST Call : %s" % url)

        http_client = HTTPClient()
        # TODO : improve this part!
        # For security reasons, using validate_cert = False is not good as someone may replace the Domogik server
        # by another one.
        # In 0.6 we should add a way to validate a certificate or not from the login page
        request = HTTPRequest(url=url, validate_cert=False)
        try:
            response = http_client.fetch(request)
            #print response.body
            return True, None
        except HTTPError as e:
            # HTTPError is raised for non-200 responses; the response
            # can be found in e.response.

            # Access denied, so bad login/password
            if e.response.code == 401:
                logger.warning("Authentication denied by REST")
                return False, "Access denied. Incorrect name or password"
            # Other error
            else:
                logger.error("Error ({0}) : {1}".format(e.response.code, str(e)))
                return False, "HTTP error while calling the rest server : {0}<br>Url called is {1}".format(str(e), url)
        except Exception as e:
            # Other errors are possible, such as IOError.
            logger.error("Error: " + str(e))
            return False, "An error occured while logging : {0}".format(str(e))
        http_client.close()

        return False, "An unknown error occured while logging"



# TODO : use BaseHandler also ?
#class ConfigurationHandler(RequestHandler):
class ConfigurationHandler(BaseHandler):
    def get(self):
        action = self.get_argument('action', None)
        id = self.get_argument('id', None)
        if action=='widget':
            instance = WidgetInstance.get(id);
            forms = WidgetInstanceForms(instance=instance)
            self.render('widgetConfiguration.html', instance=instance, forms=forms)
        elif action=='section':
            section = Section.get(id)
            params = Section.getParamsDict(id)
            themeWidgetsStyle = Theme.getParamsDict(section.theme.id, ["widget"])
            options = SectionParam.getSection(section_id=id)
            dataOptions = dict([(r.key, r.value) for r in options])
            widgetForm = WidgetStyleForm(data=dataOptions, prefix='params')
            backgrounds = [{'type':'uploaded', 'href': 'backgrounds/thumbnails/%s'%f, 'value': 'backgrounds/%s'%f} for f in os.listdir('/var/lib/domoweb/backgrounds') if any(f.lower().endswith(x) for x in ('.jpeg', '.jpg','.gif','.png'))]
            themeSectionStyle = Theme.getParamsDict(section.theme.id, ["section"])
            if 'SectionBackgroundImage' in themeSectionStyle:
                href = "%s/thumbnails/%s" % (os.path.dirname(themeSectionStyle['SectionBackgroundImage']), os.path.basename(themeSectionStyle['SectionBackgroundImage']))
                backgrounds.insert(0, {'type': 'theme', 'href': href, 'value': themeSectionStyle['SectionBackgroundImage']})
            self.render('sectionConfiguration.html', section=section, params=params, backgrounds=backgrounds, widgetForm=widgetForm, themeWidgetsStyle=themeWidgetsStyle)
        elif action=='addsection':
            self.render('sectionAdd.html')

    def post(self):
        action = self.get_argument('action', None)
        id = self.get_argument('id', None)
        if action=='widget':
            instance = WidgetInstance.get(id);
            forms = WidgetInstanceForms(instance=instance, handler=self)
            if forms.validate():
                forms.save();
                if (instance.widget.default_style):
                    d = WidgetInstance.getFullOptionsDict(id=id)
                else:
                    d = WidgetInstance.getOptionsDict(id=id)
                jsonoptions = {'instance_id':id, 'options':d}
                d = WidgetInstanceSensor.getInstanceDict(instance_id=id)
                jsonsensors = {'instance_id':id, 'sensors':d}
                d = WidgetInstanceCommand.getInstanceDict(instance_id=id)
                jsoncommands = {'instance_id':id, 'commands':d}
                d = WidgetInstanceDevice.getInstanceDict(instance_id=id)
                jsondevices = {'instance_id':id, 'devices':d}
                for socket in socket_connections:
                    socket.sendMessage(['widgetinstance-options', jsonoptions]);
                    socket.sendMessage(['widgetinstance-sensors', jsonsensors]);
                    socket.sendMessage(['widgetinstance-commands', jsoncommands]);
                    socket.sendMessage(['widgetinstance-devices', jsondevices]);
                self.write("{success:true}")
            else:
                self.render('widgetConfiguration.html', instance=instance, forms=forms)
        elif action=='section':
            Section.update(id, self.get_argument('sectionName'), self.get_argument('sectionDescription', None))
            section = Section.get(id)
            themeSectionStyle = Theme.getParamsDict(section.theme.id, ["section"])

            widgetForm = WidgetStyleForm(handler=self, prefix='params')

            for p, v in self.request.arguments.iteritems():
                if p.startswith( 'params' ):
                    if v[0] and not (p[0] == 'params-SectionBackgroundImage' and v[0] == themeSectionStyle['SectionBackgroundImage']):
                        SectionParam.saveKey(section_id=id, key=p[7:], value=v[0])
                    else:
                        SectionParam.delete(section_id=id, key=p[7:])

            # Send section updated params
            json = to_json(Section.get(id))
            json['params'] = Section.getParamsDict(id)
            WSHandler.sendAllMessage(['section-params', json])

            self.write("{success:true}")
        elif action=='addsection':
            s = Section.add(id, self.get_argument('sectionName'), self.get_argument('sectionDescription'))
            for p, v in self.request.arguments.iteritems():
                if p.startswith( 'params' ):
                    if v[0]:
                        SectionParam.saveKey(section_id=s.id, key=p[7:], value=v[0])
                        print s.id, p[7:], v[0]

            json = to_json(s)
            WSHandler.sendAllMessage(['section-added', json])
            self.write("{success:true}")

class WSHandler(websocket.WebSocketHandler):
    def open(self):
        socket_connections.append(self)
    def on_close(self):
        socket_connections.remove(self)

    @gen.coroutine
    def on_message(self, message):
        logger.info("WS: Received message %s" % message)
        jsonmessage = json.loads(message)

        if (jsonmessage[0] == 'sensor-gethistory'): 
            data = yield self.WSSensorGetHistory(jsonmessage[1])
        elif(jsonmessage[0] == 'sensor-getlast'): 
            data = yield self.WSSensorGetLast(jsonmessage[1])
        elif(jsonmessage[0] == 'butler-dodiscuss'): 
            data = yield self.WSButlerDiscuss(jsonmessage[1])
        else:
            data = {
                'section-get' : self.WSSectionGet,
                'section-getall' : self.WSSectionGetall,
                'section-gettree' : self.WSSectionGettree,
                'section-remove' : self.WSSectionRemove,
                'widget-getall' : self.WSWidgetsGetall,
                'widgetinstance-getsection' : self.WSWidgetInstanceGetsection,
                'widgetinstance-getoptions' : self.WSWidgetInstanceGetoptions,
                'widgetinstance-getsensors' : self.WSWidgetInstanceGetsensors,
                'widgetinstance-getcommands' : self.WSWidgetInstanceGetcommands,
                'widgetinstance-getdevices' : self.WSWidgetInstanceGetdevices,
                'datatype-getall' : self.WSDatatypesGetall,
                'command-send' : self.WSCommandSend,
                'publish-metrics-browser' : self.WSPublishMetricsBrowser,
                'widgetinstance-add' : self.WSWidgetInstanceAdd,
                'widgetinstance-location' : self.WSWidgetInstanceLocation,
                'widgetinstance-remove' : self.WSWidgetInstanceRemove,
            }[jsonmessage[0]](jsonmessage[1])
        if (data):
            # If the modif is global we send the result to all listeners
            if (jsonmessage[0] in ['widgetinstance-add', 'widgetinstance-location', 'widgetinstance-remove', 'section-remove']):
                WSHandler.sendAllMessage(data)
            else:
                self.sendMessage(data)

    def WSSectionGet(self, data):
        section = Section.get(data['id'])
        widgets = Widget.getSection(section_id=data['id'])
        instances = WidgetInstance.getSection(section_id=data['id'])
        j = to_json(section)
        j['params'] = Section.getParamsDict(data['id'])
        j["widgets"] = to_json(widgets)
        j["instances"] = to_json(instances)
        for index, item in enumerate(instances):
            if item.widget:
                j['instances'][index]["widget"] = to_json(item.widget)
            try:
                optionsdict = WidgetInstance.getOptionsDict(id=item.id)
                j['instances'][index]["options"] = optionsdict
            except:
                logger.error("Error while getting options for a widget instance. Maybe you delete a widget folder but it is still defined in database? Error: {0}".format(traceback.format_exc()))

        return ['section-details', j]

    def WSSectionGetall(self, data):
        root = Section.getAll()
        j = to_json(sections)
        return ['section-list', j]

    def WSSectionGettree(self, data):
        root = Section.getTree()
        j = to_json(root)
        j["childs"] = self.json_childs(root, 1)
        j["level"] = 0
        return ['section-tree', j]

    def json_childs(self, section, level):
        res = []
        if section._childrens:
            for child in section._childrens:
                c = to_json(child)
                c["childs"] = self.json_childs(child, level+1)
                c["level"] = level
                res.append(c)
        return res

    def WSSectionRemove(self, data):
        i = Section.delete(data['section_id'])
        json = to_json(i)
        return ['section-removed', json];

    def WSWidgetsGetall(self, data):
        widgets = Widget.getAll()
        return ['widget-list', to_json(widgets)]

    def WSWidgetInstanceAdd(self, data):
        i = WidgetInstance.add(section_id=data['section_id'], widget_id=data['widget_id'], x=data['x'], y=data['y'])
        json = to_json(i)
        json["widget"] = to_json(i.widget)
        return ['widgetinstance-added', json];

    def WSWidgetInstanceRemove(self, data):
        i = WidgetInstance.delete(data['instance_id'])
        json = to_json(i)
        json["widget"] = to_json(i.widget)
        return ['widgetinstance-removed', json];

    def WSWidgetInstanceLocation(self, data):
        i = WidgetInstance.updateLocation(id=data['instance_id'], x=data['x'], y=data['y'])
        json = to_json(i)
        json["widget"] = to_json(i.widget)
        return ['widgetinstance-moved', json];

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
        i = WidgetInstance.get(data['instance_id'])
        if (i.widget.default_style):
            d = WidgetInstance.getFullOptionsDict(id=data['instance_id'])
        else:
            d = WidgetInstance.getOptionsDict(id=data['instance_id'])
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

    def WSPublishMetricsBrowser(self, data):
        pub = MQPub(zmq.Context(), "domoweb")
        # we add data on python side in case the web clients are not all at the same time!
        data['timestamp'] = time.time()
        # and we make sure to remove auth informations
        del data['rest_auth']

        logging.info("Publish : 'metrics.browser' > '{0}'".format(data)) 
        pub.send_event('metrics.browser', data)
        logging.info("Publish : 'metrics.browser' done")

    @gen.coroutine
    def WSSensorGetHistory(self, data):
        if 'selector' in data:
            selector = data['selector']
        else:
            selector = 'avg'
        url = '{0}/sensorhistory/id/{1}/from/{2}/to/{3}/interval/{4}/selector/{5}'.format(options.rest_url, data['id'],data['from'],data['to'],data['interval'], selector).replace("://", "://{0}:{1}@".format(data['rest_auth']['username'], data['rest_auth']['password']))
        logger.info("REST Call : %s" % url)
        http = AsyncHTTPClient()
        request = HTTPRequest(url=url, validate_cert=False)
        response = yield http.fetch(request)
        j = json_decode(response.body)
        try:
            history = j['values']
        except ValueError:
            history = []
        json = {'caller':data['caller'], 'id':data['id'], 'history':history}
        raise Return(['sensor-history', json])

    @gen.coroutine
    def WSSensorGetLast(self, data):
        url = '{0}/sensorhistory/id/{1}/last/{2}'.format(options.rest_url, data['id'],data['count']).replace("://", "://{0}:{1}@".format(data['rest_auth']['username'], data['rest_auth']['password']))
        logger.info("REST Call : %s" % url)
        http = AsyncHTTPClient()
        request = HTTPRequest(url=url, validate_cert=False)
        response = yield http.fetch(request)
        j = json_decode(response.body)
        try:
            history = j
        except ValueError:
            history = []
        json = {'caller':data['caller'], 'id':data['id'], 'history':history}
        raise Return(['sensor-history', json])

    @gen.coroutine
    def WSButlerDiscuss(self, data):

        def handle_request(response):
            if response.error:
                logger.error("Call to butler in Error: {0}".format(response.error))
            else:
                logger.info("Call to butler OK")

        logger.info("IN WSButlerDiscuss")
        url = '{0}/butler/discuss'.format(options.rest_url).replace("://", "://{0}:{1}@".format(data['rest_auth']['username'], data['rest_auth']['password']))
        logger.info("REST Call : %s" % url)
        http = AsyncHTTPClient()
        
        discuss_data = {"text" : data["data"]["text"], "source" : data["data"]["source"]}
        #body = urllib.urlencode(data) 
        body = json.dumps(discuss_data)
        headers = {'Content-Type': 'application/json'}
        logger.info("BEFORE")
        #response = yield http.fetch(url, handle_request, method='POST', headers=headers, body=body) 
        request = HTTPRequest(url, method='POST', headers=headers, body=body, validate_cert=False)
        try:
            response = yield http.fetch(request)
            logger.info("REST response : {0}".format(response.body))
            j = json_decode(response.body)
        except HTTPError as e:
            # Handle HTTP errors
            logger.warning("REST error : {0}".format(str(e)))
            
            if e.code == 599:
                j = {"text" : "Timeout while requesting the butler over REST (Error 599)"}
            else:
                j = {"text" : "Error while requesting the butler over REST (Error {0})".format(e.code)}
        json_ret = {"caller" : data['caller'], "data" : j}
        raise Return(['butler-discuss', json_ret])

    def sendMessage(self, content):
        data=json.dumps(content)
        logger.info("WS: Sending message %s" % data)
        self.write_message(data)

    @classmethod
    def sendAllMessage(cls, content):
        data=json.dumps(content)
        logger.info("WS: Sending message %s" % data)
        for socket in socket_connections:
            socket.write_message(data)

class NoCacheStaticFileHandler(web.StaticFileHandler):
    def set_extra_headers(self, path):
        # Disable cache
        self.set_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')

class MQHandler(MQAsyncSub):
    def __init__(self):
        MQAsyncSub.__init__(self, zmq.Context(), 'test', ['device-stats', 'device.update'])

    def on_message(self, msgid, content):
        #logger.info(u"MQ: New pub message {0}".format(msgid))
        #logger.info(u"MQ: {0}".format(content))

        # If sensor stat, we update the sensor last value
        if msgid == 'device-stats':
            if isinstance(content["stored_value"], list):
                content["stored_value"] = content["stored_value"][0]
                logger.error(u"MQ: PATCH for issue #1976")

            logger.info(u"id={0}, timestamp={1}, value='{2}'".format(content["sensor_id"], content["timestamp"], content["stored_value"]))
            Sensor.update(content["sensor_id"], content["timestamp"], content["stored_value"])
            WSHandler.sendAllMessage([msgid, content])

        elif msgid == 'device.update':
            logger.info("MQ: message 'device.update' catched! Reloading the devices list")
            mqDataLoader.loadDevices(options.develop)


# TODO : use BaseHandler also ?
#class UploadHandler(RequestHandler):
class UploadHandler(BaseHandler):
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
