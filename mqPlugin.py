#!/usr/bin/env python
import os
import logging
import cherrypy
import threading
#import zmq
from time import sleep, time
from cherrypy.process import plugins
from ws4py.messaging import TextMessage

MSG_VERSION = "0_1"
PORT_PUB = "tcp://192.168.5.25:5559"
PORT_SUB = "tcp://192.168.5.25:5560"

class MQBroadcaster(threading.Thread):
    def run(self):
        self.running = True
        sub_event = MessagingEventSub(None, None)

        while self.running:
            msg = sub_event.wait_for_event()
            cherrypy.engine.log(msg)
            cherrypy.engine.publish('websocket-broadcast', TextMessage(msg))

    def stop(self):
        self.running = False

class MQPlugin(plugins.SimplePlugin):
    def __init__(self, bus):
        self.task = MQBroadcaster()
        plugins.SimplePlugin.__init__(self, bus)
        self.bus.log("Starting the MQ Plugin")
        
    def start(self):
        self.task.start()
        cherrypy.tree.mount(MQ(), '/mq')
    def stop(self):
        self.task.stop()
        self.task = None

class MQ(object):
    @cherrypy.expose
    def index(self):
        return """<html>
<head>
  <script type="application/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>
  <script type="application/javascript">
    $(document).ready(function() {

      websocket = "ws://%(host)s:%(port)s/ws/";
      if (window.WebSocket) {
        ws = new WebSocket(websocket);
      }
      else if (window.MozWebSocket) {
        ws = MozWebSocket(websocket);
      }
      else {
        console.log("WebSocket Not Supported");
        return;
      }

      window.onbeforeunload = function(e) {
        ws.close(1000, "Client left");
             
        if(!e) e = window.event;
        e.stopPropagation();
        e.preventDefault();
      };
      ws.onmessage = function (evt) {
        var now = new Date().getTime();
        $("#data").text(evt.data);
        var data = $.parseJSON(evt.data);
      };
      ws.onopen = function() {    
      };
      ws.onclose = function(evt) {
      };
    });
  </script>
</head>
<body>
  <p id="data" />
</body>
</html>
""" % {'host': '192.168.5.251', 'port': '40404'}

class MessagingEvent:
    def __init__(self):
        self.context = zmq.Context()

class MessagingEventPub(MessagingEvent):
    def __init__(self):
        MessagingEvent.__init__(self)
        self.s_send = self.context.socket(zmq.PUB)
        self.s_send.connect(PORT_PUB)
    
    def send_event(self, category, action, content):
        msg_id = "%s.%s.%s.%s" %(category, action, str(time()).replace('.','_'), MSG_VERSION)
        self.s_send.send(msg_id, zmq.SNDMORE)
        self.s_send.send(content)
        print("Message sent : %s : %s" % (msg_id, content))

class MessagingEventSub(MessagingEvent):
    def __init__(self, category_filter=None, action_filter=None):
        MessagingEvent.__init__(self)
        self.s_recv = self.context.socket(zmq.SUB)
        self.s_recv.connect(PORT_SUB)
        topic_filter = ''
        if category_filter is not None and len(str(category_filter)) > 0:
            topic_filter = category_filter
            if action_filter is not None and len(str(action_filter)) > 0:
                topic_filter += "." + action_filter
        print("Topic filter : %s" % topic_filter)
        self.s_recv.setsockopt(zmq.SUBSCRIBE, topic_filter)
    
    def wait_for_event(self):
        message_id = self.s_recv.recv()
        more = self.s_recv.getsockopt(zmq.RCVMORE)
        if more:
            print("Message id : %s" % message_id)
            message_content = self.s_recv.recv(zmq.RCVMORE)
            return message_content
        else:
            print("Message not complete!")
            return None