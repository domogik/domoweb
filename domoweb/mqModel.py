import cherrypy
import json
from django.db import models
from ws4py.messaging import TextMessage

# MQ
import zmq
from mq.pubsub.subscriber import MQAsyncSub
from mq.reqrep.client import MQSyncReq
from mq.message import MQMessage

class MQModel(models.Model):
    
    class Meta:
        abstract = True # Prevent the table to be created with syncdb

    @classmethod
    def get_req(cls, id, data=None):
        _data = cls._sync_req_rep(id, data)
        result = json.loads(_data[1])
        return result
    
    @classmethod
    def _sync_req_rep(cls, msgid, data=None):
        cli = MQSyncReq(zmq.Context())
        msg = MQMessage()
        msg.set_action(msgid)
        cherrypy.log("MQ sync REQ : [%s]" % msgid)
        return cli.request('manager', msg.get(), timeout=10).get()

class MQEvent(MQAsyncSub):

    def __init__(self, zmqcontext, id, callback, filter):
        MQAsyncSub.__init__(self, zmqcontext, 'domoweb-%s' % id, filter)
        self.callback = callback
        cherrypy.log("MQ async SUB : %s" % str(filter))

    def on_message(self, msgid, content):
        cherrypy.log("QM New pub message : [%s]" % msgid)
        msg = json.dumps({'id':msgid, 'content':content})
        cherrypy.engine.publish('websocket-broadcast', TextMessage(msg))
        self.callback(content)

