/**
# Copyright 2013 Domogik project

# This file is part of Domogik.
# Domogik is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# Domogik is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with Domogik.  If not, see <http://www.gnu.org/licenses/>.

# Plugin purpose 
# ==============
# Support Websocket HTML5, facilty for messaging exchange between Domogik plugin and Domoweb (or other Other Websocket client) UI.
# Implements user interface for Domoweb
# All message have an header JSON with keys :
#        - 'type': give the type of message, values can  be:
#            -'req' : a simple client resquest, this type is passed to callback.
#            -'req-ack' : a client resquest with confirmation requested , this type is passed to callback.
#            -'pub' : Automaticly select with server.broadcastMessage function.
#                    Next two keys help to secure and validate the client connection.
#            -'ack' : return by server after a 'req_ack'
#            -'confirm-connect' : Internal server type for confirm to client connection accepted.
#                                        This message type is send automaticly to client when he ask for connection. Add 2 keys for identity : 
#                                    -'id' : 'ws_serverUI' : constante string
#                                    -'idws' : peer_adresss, id that the client keeps for identification.
#            -'ack-connect' : Internal server type to confirm that client have recept first confirmation ('confirm-connect').
#                                  The client must send this message type to finalized connection.
#                                  
#            -'server-hbeat' : Internal server type for client check server running.
#                                   server send automaticly an confirmation message. See UI client part if you implement it.
#                                   
#        - 'idws' : Identify resquesting client. See UI client part.
#        - 'idmsg: Identify of individual resquet. See UI client part.
#        - 'ip' : Identify resquesting IP client. 
#        - 'timestamp' : A reference time when message was sent.
#
# See example in ws-template.html file to implement your code.
#  You need only types : 'req', 'req-ack' for send message.
#  And  'pub' and 'akc' for read message in callback function
#
# Import WebSocket server library :
#    <script type="text/javascript" src="{{ static_design_url }}/admin/js/ws-plugin-tools.js"> </script> 
# To create a client use function:
#    createWebSocket(host, handleWSmessage, initSequence)
#            @ param host : IP adresse server + port number like "ws//xxx.xxx.xxx.xxx:port
#            @ param handleWSmessage : Callback function that websocket call on recepted message 'ack' and 'pub'
#            @ param initSequence : Callback function that call one time at after opened client, in option not absolute necessary.
# To send a request use function:
#    sendMessage(msg, function(response){...your process...}, timeout); 
#            @ param msg : your request with format : {'header' : {'type': 'req-ack'}, 'request': 'foorequest', 'fooparam':'foovalue',....}
#                                    just give type of request : 'req' no expect response, 'req-ack' expect response,
#                                    you must put it in 'header' and 'type'  keys, others parameters for identity will add automaticaly.
#            @ param callback : in option, your function to call after response, she receive message response as parameter
#            @ param timeout : in option, defaut value = 15000 ms, if your response take more change it in ms.
#           
# ==============
# Author : Nico <nico84dev@gmail.com>
**/


var wsDomogik;
var wsPort;
var tWSserverOut = (new Date()).getTime();
var cptTimeOutWS = 0;

var wsAcktOutCtrl = setInterval(wsAckTimeOutCtrl, 500);

function createWebSocket(host, cbHandleMsg, cbAtOpen) {
    if(window.MozWebSocket) {
        window.WebSocket=window.MozWebSocket;
    }
    if(!window.WebSocket) {
        alert("Your browser don't accept webSocket!");
        return false;
    } else {
        if (!wsDomogik || !wsDomogik.idws) {
            console.log('Tentative de Connection : ' + host);
            wsDomogik = new WebSocket(host);
            wsDomogik.idws = false;
            wsDomogik.cbHandleMsg = cbHandleMsg;
            wsDomogik.queueAck = [];
            wsDomogik.host = host;
            wsDomogik.onopen = function(event) {
                wsDomogik.send(JSON.stringify({'header':{'type': 'ack-connect', 'idws':'request'}}));
                wsDomogik.idws = false;
                setStatusWS('up');
                var d = new Date();
                console.log('Client WebSocket State:' + 'OPEN');
                };

            wsDomogik.onclose = function(event) {
                setStatusWS('down');
                var d = new Date();
                console.log('Client WebSocket State:' + 'CLOSED ' + event.code + ' ' + event.reason + ' ' + event.wasClean);
                wsDomogik.idws = false;
                };
            wsDomogik.onerror = function(event) {
                if (event.target) { error = event.target.url;
                } else { error = 'No URL definition';};
                $.notification('error', gettext('Client WebSocket no connection on URL : ') +  error);
                console.log('Client WebSocket no connection on URL : ' +  error);
                };

            wsDomogik.sendhbeat = function() {
                var d = new Date();
                msg['header'] = {'type': 'req-ack'};
                msg['request'] ='server-hbeat';
                sendMessage(msg, function(ackMsg) {
                    if (ackMsg['error'] =='') {
                        if (ackMsg.header['idws'] == wsDomogik.idws) {tWSserverOut = d.getTime();
                        }else  {
                            $.notification('error', gettext('Plugin server bad identity, return : ') + ' : ' +ackMsg.header['idws']  + gettext(' for client : ') + wsDomogik.idws);
                        };
                    } else {
                        $.notification('error', gettext('Plugin server connected with error : ') + ' : ' +ackMsg.error );
                    };
                    });
                };

            wsDomogik.onmessage = function(event){
                var d = new Date();
                tWSserverOut = d.getTime(); 
                try { //tente de parser data
                        var data = jQuery.parseJSON(event.data);
                } catch(exception) {
                        var data = event.data;
                    }
                console.log ('Recu par websocket : ', data);
                if (data.header) {
                    if ((data.header.type  == 'confirm-connect') &&  (data.header.id == 'ws_serverUI')) {
                        if (this.idws == data.header.idws) {
                            console.log('Client WebSocket already confirmed, not call init function.');
                        } else {
                            this.idws = data.header.idws;
                            console.log('Client WebSocket confirmed, call init function...');
                            $.notification('success',gettext('Connection to plugin server running'))
                            if (cbAtOpen) {cbAtOpen();};
                        };
                    } else if (this.idws) {
                            if (this.idws == data.header.idws) {
                            //    console.log('handle message');
                                var callback;
                                if (data.header.type == 'ack') {
                                    for (var i = 0; i < this.queueAck.length; i++) {
                                        if (this.queueAck[i].header.idws == data.header.idws && this.queueAck[i].request ==data.request &&
                                            this.queueAck[i].header.idmsg == data.header.idmsg) {
                                                if (this.queueAck[i].callback) {
                                                    callback = this.queueAck[i].callback;
                                                    break;
                                            };
                                        };
                                    };
                                };
                                this.cbHandleMsg(data, callback);
                            } else {
                                console.log('Error bad WebSocket id : ', data.header.idws);
                            };
                        } else {
                            console.log('Error WebSocket unknown, force to close.');
                            this.close;
                        };
                    if (data.header.type == 'ack') {
                        for (var i = 0; i < this.queueAck.length; i++) {
                            if (this.queueAck[i].header.idws == data.header.idws && this.queueAck[i].request ==data.request && 
                                this.queueAck[i].header.idmsg == data.header.idmsg) {
                                this.queueAck.splice(i,1);
                            };
                        };
                    };
                } else { console.log('Error bad message : no header');
                };
            };
        };
    };
};

function sendMessage(message, callback, timeOut) {
    var d = new Date();
    if (wsDomogik && wsDomogik.idws) {
        if (!timeOut) { timeOut = 15000;};
        if (message) {
            message['header']['idws'] = wsDomogik.idws;
            message['header']['ip'] = location.hostname;
            message['header']['timestamp'] = d.getTime();
            message['header']['idmsg'] = Math.floor((1000000)*Math.random()+1)
            var data = JSON.stringify(message);
            console.log ('Send WS msg : ', message);
            if (message.header.type = 'req-ack') {
                message['timeOut'] = timeOut - 500;  // retirer la fréquence de controle 
                if (callback) {
                    message['callback'] = callback;
                    }
                wsDomogik.queueAck.push(message)};
            wsDomogik.send(data);
            };
    } else {
    console.log ('Websocket non connecté ou non pret à envoyer des messages : ' , message);
    $.notification('error', 'WebSocket not connect to plugin server, message not send : ' + JSON.stringify(message));
    }; 
};

function wsAckTimeOutCtrl() {
    var d = new Date();
    if (wsDomogik) {
        if (wsDomogik.readyState == 1) {
            if (wsDomogik.queueAck.length !=0) {$.each(wsDomogik.queueAck, function(i) {
                var ack = wsDomogik.queueAck[i];
                if (ack != undefined) {
                    if ((d.getTime() - ack.header.timestamp) >= (ack.timeOut )) {
                        var t = ack.request;
                        if (ack.node) { t =t + ' node : ' + ack.node;};
                        if (ack.valueid) { t =t + ' Value : ' + ack.valueid;};
                        $.notification('error', gettext('WebSocket ACK TimeOut for request : ') +  t);
                        if (ack.header.request == 'ws-hbeat') {
                            $.notification('error', gettext('Plugin server not response to hbeat, client deconnected.'));
                            wsDomogik.close();
                        };
                        wsDomogik.queueAck.splice(i,1);
                    };
                };
                });
            };
        } else {
            if ((d.getTime() - tWSserverOut) >= 30000) {
                if (cptTimeOutWS>= 60) {
                    cptTimeOutWS = 0;
                    if (wsDomogik.idws == false) {
                        if ((d.getTime() - tWSserverOut) >= (30000 * 3.5)) {
                                wsDomogik =false;
                            } else {
                                $.notification('error', gettext('No connection on plugin server since ') + ((d.getTime() - tWSserverOut)/1000) + ' sec.');
                                createWebSocket(wsDomogik.host,wsDomogik.cbHandleMsg);
                            };
                    } else {
                        wsDomogik.sendhbeat();
                    };
                } else {cptTimeOutWS = cptTimeOutWS + 1;};
            };
        };
    } else {
        var dtout = (d.getTime() - tWSserverOut);
        if ((dtout >= 30000) && (dtout < 900000))  {
            if (cptTimeOutWS>= 120) {
                cptTimeOutWS = 0;
                $.notification('error', gettext('wsDomogik server not identified ') + (dtout/1000) + ' sec.')
            } else {cptTimeOutWS = cptTimeOutWS + 1;};
        };
    };
};

function plugin_is_running() {
    // Check that the plugin is running
    if (document.getElementById('buttonstatus').className == "button icon16-status-active") {
        return false
    }
    return true
};
