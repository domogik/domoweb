var ozwDomowebVers = "0.2c3"
var netWorkZW = {};
var listNodes = new Array();
var listTypesVal = {};
var listCmdCtrl = {};
var hdCmdClss = new Array();
var initialized = false;
var ctrlDevice;
var cb_RefreshTabHtml;
var hWSmessage; // Ref pour handleWSmessage function
var neighborsGraph;

// Constante d'entete de colonne de la table node_items 
var hdLiNode = {"NodeId": 0, "Name": 1, "Location": 2, "Model": 3, "Awake":  4, "Type": 5, "Last update": 6, "Action": 7};
var mbrGrpSt = {0: 'unknown', 1: 'confirmed', 2: 'to confirm', 3: 'to update'};
var HEADSTATISTIC = {"SOFCnt" : gettext("Star of Frame (SOF) bytes received"),
                                 "ACKWaiting" : gettext("Unsolicited messages while waiting for an ACK"),
                                 "readAborts" : gettext("Reads aborted due to timeouts"),
                                 "badChecksum" : gettext("Bad checksum errors"),
                                 "readCnt" : gettext("[Device] Messages successfully received"),
                                 "writeCnt" : gettext("[Device] Messages successfully sent"),
                                 "CANCnt" : gettext("Controller Area Network (CAN) received from controller"),
                                 "NAKCnt" : gettext("No Acknowledge (NAK) received from controller"),
                                 "ACKCnt" : gettext("Acknowledgements (ACK) received from controller"),
                                 "OOFCnt" : gettext("Out of frame data flow errors"),
                                 "dropped" : gettext("Messages dropped and not delivered"),
                                 "retries" : gettext("Messages retransmitted"),
                                 "callbacks" : gettext("Number of unexpected callbacks"),
                                 "badroutes" : gettext("Number of failed messages due to bad route response"),
                                 "noack" : gettext("Number of no ACK returned errors"),
                                 "netbusy" : gettext("Number of network busy/failure messages"),
                                 "nondelivery" : gettext("Number of messages not delivered to network"),
                                 "routedbusy" : gettext("Number of messages received with routed busy status"),
                                 "broadcastReadCnt" : gettext("Number of broadcasts read"),
                                 "broadcastWriteCnt" : gettext("Number of broadcasts sent")
                                };

var NODESTATISTIC = {"sentCnt" : gettext("Number of messages sent from this node."),
                                 "sentFailed" : gettext("Number of sent messages failed"),
                                 "retries" : gettext("Number of message retries"),
                                 "receivedCnt" : gettext("Number of messages received from this node."),
                                 "receivedDups" : gettext("Number of duplicated messages received."),
                                 "receivedUnsolicited" : gettext("Number of messages received unsolicited."),
                                 "sentTS" : gettext("Last message sent time."),
                                 "receivedTS" : gettext("Last message received time"),
                                 "lastRequestRTT " : gettext("Last message request RTT"),
                                 "averageRequestRTT" : gettext("Average Request Round Trip Time (ms)."),
                                 "lastResponseRTT" : gettext("Last message response RTT"),
                                 "averageResponseRTT" : gettext("Average Reponse round trip time."),
                                 "quality" : gettext("Node quality measure"),
                                 "lastReceivedMessage" : gettext("Last received raw data message"),
                                 "commandClassId" : gettext("Individual Stats for: "),    
                                 "sentCntCC" : gettext("Number of messages sent from this CommandClass."),    
                                 "receivedCntCC" : gettext("Number of messages received from this CommandClass.")
                                };

function openDmg_eventListener(callback){
    var ozwes = new EventSource(EVENTS_URL + '/');
    ozwes.addEventListener('open', function (event) {
        console.log ('dmg_event open ', event);
    }, false);
    ozwes.addEventListener('message', function (event) {
        if (ctrlDevice) {
            var data = jQuery.parseJSON(event.data);
            if (data.device_id == ctrlDevice.device.id) {
                console.log ('dmg_event recept : ', data);
                var e={'timestamp': data.timestamp}
                $.each(data.data, function (index, obj) {
                    e[obj.key] = obj.value;
                });
        //        console.log ('dmg_event message for controleur zwave at ', event.timeStamp, ' data : ', data);
                callback(e);
            };
        };
    }, true);
    ozwes.addEventListener('error', function (event) {
        console.log ('dmg_event error ', event);
        }, false);

	$(window).bind('beforeunload', function () {ozwes.close(); });
};

function GetDataFromxPL (data, key) {
    var dt=JSON.stringify(data);
    var debut=dt.search(key + '=');
    var offset =key.length;
    if (key=='count') {
        dt=dt.slice(debut);
    }else { 
        dt=dt.slice(debut+offset+1);
      }; 
    var fin=dt.search('}');   
    dt=dt.slice(0,fin-2); 
    dt= dt.replace(/&ouvr;/g,'{').replace(/&ferm;/g,'}').replace(/&quot;/g,'"').replace(/&squot;/g,"'");
    if (key=='count') {
        fin=dt.search('}');   
        dt=dt.slice(0,fin);
        dt='{"count":8}';
        };
    return JSON.parse(dt); 
};

 function ParseAckXPL(xpl) {
    var tamp=xpl;
    var li=0;
    var inc=1;
    var mesxPL = {};
  //  console.log("****** xpl brut :");
    while (li !=-1) {
       li = tamp.search(/[\n]|\\n/);
       inc=1;
       if (li !=-1) {
         ttt = tamp.slice(li,li+2);
            if (tamp.slice(li,li+2) == '\\n') {inc=2;};
            ligne=tamp.slice(0,li);
            ki = ligne.search('=');
            if (ki !=-1) {
                num = parseInt(ligne.slice(ki+1));
                if (num) {val = num;} else {val=ligne.slice(ki+1);}
                mesxPL[ligne.slice(0,ki)] =  val;
            }
            tamp=tamp.slice(li+inc);
        };
        };
    var ks = Object.keys(mesxPL), dt = "";
    for ( var i=0; i< ks.length; i++) {
        if (typeof mesxPL[ks[i]] =="string") {
            if  (mesxPL[ks[i]].slice(0,6) == "&ouvr;") {
                dt=mesxPL[ks[i]];
                dt= dt.replace(/&ouvr;/g,'{').replace(/&ferm;/g,'}').replace(/&quot;/g,'"').replace(/&squot;/g,"'");
//                console.log (dt);
                mesxPL[ks[i]] = JSON.parse(dt);
            };
        }
  //          console.log (mesxPL[ks[i]]);
    };
    return mesxPL;
};

function SetDataToxPL (data) {
    dt=JSON.stringify(data);
  //  console.log ("SetDataToxPL : " + dt);
    var val = dt.replace(/["]/g,"&quot;").replace(/[{]/g,"&ouvr;").replace(/[}]/g,"&ferm;").replace(/true/g,"True").replace(/false/g,"False") ; 
 //   console.log ("SetDataToxPL str : " + val);
    return val;
};

function getDataTableColIndex (dTab, title) {
    var cols = dTab.aoColumns;
    for ( var x=0, xLen=cols.length ; x<xLen ; x++ ) {
        if ( cols[x].sTitle.toLowerCase() == title.toLowerCase() ) {
            return x;
            };
        }
    return -1;
};

function plugin_is_running() {
    // Check that the plugin is running
    if (document.getElementById('buttonstatus').className == "button icon16-status-active") {
        return false
    }
    return true
}

function getPluginInfo(callback)  {
    var msg = {};
    msg['command'] = "Refresh";
    var val = {};
    val['request'] ='GetPluginInfo';
    msg['value'] = SetDataToxPL (val);
    rinor.put(['api', 'command', 'ozwave', 'UI'], msg)
        .done(function(data, status, xhr){
            var messXpl = GetDataFromxPL(data, 'data');
            if (messXpl['error'] == "") {
                wsPort = messXpl['hostport']
                console.log('getPluginInfo : ' + messXpl['hostport']);
                callback(wsPort);
            } else {
                $.notification('error',gettext("Plugin has error") + ": " + messXpl['error']);
            } 
        })
        .fail(function(jqXHR, status, error){
            if (jqXHR.status == 400)
                $.notification('error', gextext ("Plugin not received request") + ", ("  + jqXHR.responseText + ")");
        });
};

function createToolTip(domObj, position, text) {
    var d = $(domObj);
    $(domObj).each(function (index) {
        if (this.haveqtip) {
            if (text) {
                d.qtip('api').updateContent(text);
            } else {
                if (this.title && this.title !='undefined') {d.qtip('api').updateContent(this.title);};
            }; 
            return;
        } else {
            this.haveqtip = true;
            if (this.title =='') {this.title = text;};
            if (this.title && this.title !='' && this.title !='undefined') {
                switch (position) {
                    case 'left' :
                         $('#' + this.id +'[title]').tooltip_left();
                        break;            
                    case 'right' :
                         $('#' + this.id + '[title]').tooltip_right();
                        break;  
                    case 'top' :
                         $('#' + this.id + '[title]').tooltip_top();
                        break;
                    case 'bottom' :
                         $('#' + this.id + '[title]').tooltip_bottom();
                        break;
                }
            } else {this.title ='';}
        };
    });
};

// Gestion des tables de données
function RefreshDataNode(infonode, Kbuild) {
    var idx = -1;
    for (var i = 0; i < listNodes.length; i++) {
        if (listNodes[i].Node == infonode.Node) {
            idx = i;
            break;
        };
    };
    if (idx != -1) {
        listNodes[idx] = infonode;
        if (listNodes[idx].ktcNode) {
            listNodes[idx].ktcNode.update();
            };
    } else {
        listNodes.push(infonode);
    };
    if (Kbuild) {
        if  (initialized) {setTimeout(function () {
             neighborsGraph.buildKineticNeighbors();
            },1000);   
        } else {setTimeout(function () {
            neighborsGraph = new KtcNeighborsGraph('containerneighbors','graphneighbors');
            },1000); };
        initialized = true;
        };
};

function GetZWNodeById (nodeiId) {
    var retval = false;
    for (var i=0; i< listNodes.length; i++) {
        if (listNodes[i].Node == nodeiId) {
            return listNodes[i];
        };
    };
    return false;
};

function setStatusWS(status) {
    if (status == 'up') { //active
        textstatus = "Connected to WS server";
        reload ='';
    } else { //inactive
        textstatus = "Disconnect from server";
        reload = "<button id='startWebsocket' class='icon16-action-reset buttonicon' title='" + gettext("Start Websocket Client") + "'</button>";
    }
    $("#iconstatusws").empty()
        .attr('class', "icon16-text-right icon16-status-plugin-" + status)
        .attr('align', 'right')
        .html("<span id='wsstatus' class='label'>" + gettext('Server connection') + " :</span><span class='offscreen'>" + textstatus + "</span>"+reload);
    createToolTip('#wsstatus', 'bottom',textstatus);
    if (status != 'up') {
        $("#startWebsocket").click(function(){
        var host = 'ws://' +  location.hostname + ':' + wsPort;
        createWebSocket(host, hWSmessage);
        return false;
        });
    };

};

function setStatusZW(status) {
    if (status=='up') { //active
        textstatus = "En cours d'execution";
    } else { //inactive
        textstatus = "Stoppé";
    }
    $("#iconstatuszw").empty()
        .attr('class', "icon16-text-right icon16-status-plugin-" + status)
        .html("<span class='label'>" + gettext('status') + " :</span><span class='offscreen'>" + textstatus + "</span>");
};

function SetStatusZWDevices(idObj, status) {
    status = status.toLowerCase();
    if (status == 'uninitialized') { st = 'status-unknown'};
    if (status == 'completed') { st = 'status-active'};
    if (status == 'in progress - devices initializing') { st = 'action-processing_f6f6f6'};
    if (status == 'out of operation') { st = 'status-warning'};
    $('#'+ idObj).removeClass().addClass('icon16-text icon16-'+ st);
    t = gettext(status)
    $('#'+idObj).qtip('api').updateContent(t);
};

function SetStatusMemberGrp(infonode,group,member,status) {
    console.log ('Set status :' + status);
};

// fnRender, callback des élements du tableau autre que texte ou enrichis
    function getNodeIdFromHtml(texte) {
        if (typeof texte=="string") {
            return parseInt(texte.substring(0, texte.indexOf('<span')), 10); 
        } else { return texte}
    }

    function setStatusDeviceZW(oObj) {
        /* {0:,
              1:'Initialized - not known', 
              2:'Completed',
              3:'In progress - Devices initializing',
              4:'In progress - Linked to controller',
              5:'In progress - Can receive messages', 
              6:'Out of operation'} */
        var nodeId = getNodeIdFromHtml(oObj.aData[hdLiNode['NodeId']]);
        var node = GetZWNodeById(nodeId);
        var status = 'status-unknown';
        initState = node.InitState.toLowerCase();
        if (initState =='uninitialized') {status = 'status-unknown';};
        if (initState =='initialized - not known') {status = 'status-active';};
        if (initState =='completed') {status ='status-active';};
        if (initState.indexOf('in progress') !=-1) {status ='action-processing_f6f6f6';};
        if (initState =='out of operation') {status ='status-warning';};
        var str = '' + nodeId;
        while (str.length < 3) {str = '0' + str;};
        var bat = '';
        if (node.BatteryLevel != -1) {
            var st = '0'
                if (node.BatteryLevel >= 85) {st = '100';
                } else if (node.BatteryLevel >= 60) {st = '80';
                } else if (node.BatteryLevel >= 40) {st = '50';
                } else if (node.BatteryLevel >= 25) {st = '30';
                } else if (node.BatteryLevel >= 15) {st = '20';
                } else if (node.BatteryLevel >= 5) {st = '10';};
            bat = "<span id='battery" + nodeId + "'class='icon16-text-right  icon16-status-battery-" + st +"' title='Battery level " + node.BatteryLevel + " %'></span>";
            }
        return  str + "<span id='nodestate" + nodeId + "'class='icon16-text-right  icon16-" + status + "' title='" + node.InitState + "'></span>" + bat;
        }

    function setNameNode(oObj) {
        return "<input type='text' title='Name' value='" + oObj.aData[hdLiNode['Name']] + "'/>";
        };

    function setStatusSleep(oObj) {
        var status = oObj.aData[hdLiNode['Awake']];
        var nodeId = getNodeIdFromHtml(oObj.aData[hdLiNode['NodeId']]);
        var zwNode = GetZWNodeById(nodeId);
        if (zwNode.LastStatus === undefined) {dt= '';
        } else {dt = ' since : ' + zwNode.LastStatus;};
        if (status==true) { //Sleeping
            textstatus = 'Inactive on network' + dt;
            st = 'unknown';
            stext = 'Sleeping';
        } else { //actif
            textstatus = 'Active on network' + dt;
            st = 'active';
            stext = 'Awake';
        };
        console.log("set status sleep coloms : " + oObj.aData + " " + status);
        return  stext + "<span id='infosleepnode" + nodeId + "'class='icon16-text-right  icon16-status-" + st + "' title='" + textstatus + "' /span>";
        };

    function setTypeInfos(oObj) {
        var typeName = oObj.aData[hdLiNode['Type']];
        var nodeId = getNodeIdFromHtml(oObj.aData[hdLiNode['NodeId']]);
        var zwNode = GetZWNodeById(nodeId);
        var text = '', sep = '';
        if (zwNode.Capabilities.length > 1) {text= 'Capabilities :\n';
        } else {text= 'Capability :\n';};
        for (i=0; i<zwNode.Capabilities.length; i++) {
            text = text + sep + zwNode.Capabilities[i] + '\n';
            sep = " -- ";
        }
        return  typeName + "<span id='infotypenode" + nodeId +"' class='icon16-text-right icon16-status-info' title='" + text + "' /span>";
        };

    function setActionNode(oObj) {
        var nodeId = getNodeIdFromHtml(oObj.aData[hdLiNode['NodeId']]);
        var zwnode = GetZWNodeById(nodeId);
        var stAct = 'zoomin';
        var tabDet = document.getElementById("detNode" + nodeId);
        if (tabDet) { // DetailNode opened 
            stAct = 'zoomout'; 
        };
        var ret = "<button id='detailnode" + nodeId + 
                        "' class='icon16-action-" + stAct +" buttonicon' title='Detail Node' name='Detail node'><span class='offscreen'>Detail Node : " + nodeId + "</span></button>";
        ret += "<button id='updnode" + nodeId + 
                        "' class='icon16-action-save buttonicon' title='Update Node' name='Update node'><span class='offscreen'>Send update to Node : " + nodeId + "</span></button>";
        ret += "<button id='refreshnode" + nodeId + 
                        "' class='icon16-action-reset buttonicon' title='Force Refresh Node' name='Refresh node'><span class='offscreen'>Send refresh info to Node : " + nodeId + "</span></button>";
        for (var i=0; i< listNodes.length; i++) {
            if (listNodes[i].Node == nodeId && listNodes[i].Groups.length > 0) {
                ret += "<button id='updassoc" + nodeId + 
                        "' class='icon16-action-groups buttonicon' title='Edit association' name='Node groups' ><span class='offscreen'>Edit association Node : " + nodeId + "</span></button>";
                };
            };
        var stMonitored = "play";
        var tMonitored = "Start Monitor Node and log it.";
        if (zwnode.Monitored != '') { 
            stMonitored = "processing_f6f6f6";
            tMonitored = "Node monitoring file : " + zwnode.Monitored + "<BR><BR>Click to stop monitoring.";
            };
        ret += "<button id='monitornode" + nodeId + 
                        "' class='icon16-action-" + stMonitored + " buttonicon' title='" +tMonitored + "' name='Monitor node'><span class='offscreen'>Monitor Node " + nodeId + " and log it</span></button>";
            return  ret;
        };


function getValueTabCmdClass(vTable, vData, cName) {
    col = getDataTableColIndex(vTable.fnSettings(), cName);
    if (col != -1) {
        switch (cName) {
            case 'Num' :
                return vData[col]
                break;
            case 'value' :
                cId = getDataTableColIndex(vTable.fnSettings(), 'id');
                var obj = $('#valCC' + vData[cId]);
                return obj[0].innerHTML;
                break;
            case 'commandClass' :
                cId = getDataTableColIndex(vTable.fnSettings(), 'id');
                var obj = $('#hc' + vData[cId]);
                return obj[0].innerHTML;
                break;
            case 'value' :
                cId = getDataTableColIndex(vTable.fnSettings(), 'id');
                var obj = $('#valCC' + vData[cId]);
                return obj[0].innerHTML;
                break;
            
            default :
                return vData[col]
        };
    }
};

    function renderCmdClssNode(oObj) {
        var num = oObj.aData[0];
        if (num < 10) { num = "0" + num; };
        indexSt = getDataTableColIndex(oObj.oSettings, 'domogikdevice');
        indexH = getDataTableColIndex(oObj.oSettings, 'help');
        var status = oObj.aData[indexSt];
        var readOnly = oObj.aData[getDataTableColIndex(oObj.oSettings, 'readOnly')];
        var help = gettext(oObj.aData[indexH]);
        var vId = oObj.aData[getDataTableColIndex(oObj.oSettings, 'id')];
        var polled = oObj.aData[getDataTableColIndex(oObj.oSettings, 'polled')];
        if (readOnly==true) {
            textRW = gettext("Read only");
            st ='active';
        } else {            
            textRW = gettext("Read and Write");
            st ='inactive';
        };
        var rw=  " <span id='st"+vId +"' class='icon16-text-right icon16-status-" + st +"' title='" + textRW + "'></span>";
        if (help!="") {
            extra = "  <span id='hn"+vId +"' class='icon16-text-right icon16-status-info' title='" + help + "'></span>";
        } else {
            extra ="";
        };
        if (status!="") { //Available for domogik device
            textstatus = gettext("Named domogik device : " + status);
            st = 'primary';
        } else { //not available
            textstatus = gettext("Not available for domogik device");
            st = 'false';
        };
        if (polled) { 
            poll = " checked='checked'";
            tpoll = gettext("Value is polled with intensity : ") + oObj.aData[getDataTableColIndex(oObj.oSettings, 'pollintensity')];
        }else { 
            poll ="";
            tpoll =  gettext("Check to poll this value");
        }

        return  num + "<span  id='adr"+vId +"'class='icon16-text-right icon16-status-" + st + "' title='" + textstatus +
                "'></span>" + rw + "<input type='checkbox' class='medium' id='poll" + vId + "'" + poll + " name='isPolled'" +
                "title='"+ tpoll + "' />" + extra;
    };

    function renderCmdClssName(oObj) {
        var CmdClss = oObj.aData[getDataTableColIndex(oObj.oSettings, 'commandClass')];
        var help = gettext(oObj.aData[getDataTableColIndex(oObj.oSettings, 'help')]);
        var vId = oObj.aData[getDataTableColIndex(oObj.oSettings, 'id')];
        return   "<span id='hc"+vId +"'title='" + help + "'>" + CmdClss + "</span>";
        };


    function renderCmdClssValue(oObj){
        var vId = oObj.aData[getDataTableColIndex(oObj.oSettings, 'id')];
        var id = "valCC" + vId;
        var detCS = document.getElementById("detCS" + id);
        var readOnly = oObj.aData[getDataTableColIndex(oObj.oSettings, 'readOnly')];
        var value = oObj.aData[getDataTableColIndex(oObj.oSettings, 'value')];
        var type = oObj.aData[getDataTableColIndex(oObj.oSettings, 'type')];
        var realvalue = oObj.aData[getDataTableColIndex(oObj.oSettings, 'realValue')] ;
        var modify =  (realvalue != value);
        var ret = value;
        if (readOnly==true) {
            ret = "<span id='" + id +"' title=''>" +  value+ "</span>";
        } else {            
            if (type=='Bool') {
                opt="";
                realvalue = (realvalue == 'true');
                value = (value == 'true');
                modify =  (realvalue != value);
                if (value) {
                    opt = "<option selected value=" + value +">" + value + "</option>" +
                             "<option value=false>false</option>";
                } else {
                    opt = "<option value=true>true</option>" +
                             "<option selected value=" + value +">" + value + "</option>" ;
                }
                ret ="<select id='" + id + "' name='CmdClssValue' class='listes ccvalue' style='width:7em' title=''>" + opt + "</select>";
            };
            if (type=='Byte') {
                ret ="<input id='" + id + "' name='CmdClssValue' class='ccvalue' type='number' min='0' max='255' style='width:3em' value='"+ value +"' title=''></input>";
            };
            if (type=='Short') {
                ret ="<input id='" + id + "' name='CmdClssValue' class='ccvalue' type='number' min='0' max='65535' style='width:6em' value='"+ value +"' title=''></input>";
            };
            if (type=='Int' | type=='Decimal') {
                ret ="<input id='" + id + "' name='CmdClssValue' class='ccvalue' type='number' style='width:8em' value='"+ value +"' title=''></input>";
            };
            if (type=='String') {
                ret ="<input id='" + id + "' name='CmdClssValue' class='ccvalue' type='text' value='"+ value +"' title=''></input>";
            };
             if (type=='Schedule') {
                ret ="<input id='" + id + "' name='CmdClssValue' class='ccvalue' type='date' value='"+ value +"' title=''></input>";
            };
             if (type=='List') {
                var listElems = oObj.aData[getDataTableColIndex(oObj.oSettings, 'listElems')];
                opt="";
                 for (i in listElems) {
                     if (listElems[i] != value) {
                        opt= opt + "<option value='" + listElems[i]  + "'>" + listElems[i] + "</option>";
                     } else {
                        opt= opt + "<option selected value='" + value +"'>" + value + "</option>";
                     }
                 }
                ret ="<select id='" + id + "' name='CmdClssValue' class='liste ccvalue' style='width:15em' title=''>" + opt + "</select>";
            };realvalue
            if (type=='Button') {
                value = oObj.aData[getDataTableColIndex(oObj.oSettings, 'label')];
                ret ="<input id='" + id + "' name='CmdClssValue' class='ccvalue ccbt' type='button' value='" + value +"' title=''></input>"; //
            };
            if (modify) {
                ret = ret + "<button id='send" + vId +"' class='button icon16-action-update buttonicon' name='Send value' title='Send value'><span class='offscreen'>Send value</span></button>";
            };
        };
        return ret
    };

    function handleChangeVCC (){
        $('.ccvalue').change(function () { // '#' + id
                if (this.parentNode) {
                    var nTr = this.parentNode.parentNode;
                    if (this.name =='CmdClssValue') {
                            var oTable = $("#" + nTr.parentElement.parentElement.id).dataTable();
                            var aPos = oTable.fnGetPosition(this.parentElement );
                            var oSettings = oTable.fnSettings();
                            var idC = getDataTableColIndex(oSettings, 'value');
                            var vId = getDataTableColIndex(oSettings, 'id');
                            var ok = oTable.fnUpdate(this.value,aPos[0],idC,false);
                            createToolTip('#send' + vId, 'top');
                            handleChangeVCC ();
                    };
                };
        });
        var b = $('.ccbt');
        $('.ccbt').unbind('click').click(function (e){
            var nTr = this.parentNode.parentNode;
            var idDetNode = nTr.parentNode.parentNode.id;
            var aTable = $('#' + idDetNode).dataTable();
            var aData = aTable.fnGetData(nTr); 
            var nodeId = parseInt(idDetNode.slice(7)); // detNodeX
            var valueId = aData[getDataTableColIndex(aTable.fnSettings(), 'id')];
            console.log ("sending button action for cmd class");
            msg = setValueNode(nodeId, valueId, false, aTable,nTr, true); // force la valeur à true
        });
    };

    function returnTextValue(val) {
        if (typeof(val) != 'number') {
            debut = val.search('value=');
            if (debut != -1) {
                val = val.slice(debut+7);
                fin = val.search("'");
                val = val.slice(0,fin);
                };
          };
        return val;
        };

/* Formatage du details d'une row  */
    function fnFormatDetailsCmdCll (nTr, thOut) {
        var aData = oTabNodes.fnGetData(nTr);
        var idDetNode = 'detNode' + getNodeIdFromHtml(aData[hdLiNode['NodeId']]);
        console.log("Format detail node entête : " + thOut);
        if (thOut.length != 1) {
            var sOut = '<table id="' + idDetNode + '" class="simple" cellpadding="5" border="1"><thead><tr>'
            for (i=0; i<thOut.length; i++) {
                sOut += '<th scope="col">' + thOut[i]+ '</th>';
                };
            sOut += '</tr></thead><tbody></tbody></table>';
        } else {
            var sOut = '<table id="' + idDetNode + '" class="e" cellpadding="5" cellspacing="5" border="0" style="padding-left:100px;">' +
                '<tr><td> {% trans "No Command_Class for"%} :</td><td>'+aData[hdLiNode['Type']]+'</td></tr>'+
                '</table>';
        };
   //     console.log (sOut);
        return sOut;
    };

function UpNodeToolTips (nodeid) {
    createToolTip('#nodestate' + nodeid, 'left');
    createToolTip('#battery' + nodeid, 'bottom');
    createToolTip('#detailnode' + nodeid, 'right');
    createToolTip('#updnode' + nodeid, 'right');
    createToolTip('#refreshnode' + nodeid, 'right');
    createToolTip('#monitornode' + nodeid, 'left');
    createToolTip('#statenode' + nodeid, 'right');
    createToolTip('#updassoc' + nodeid, 'right');
    createToolTip('#infotypenode' + nodeid, 'bottom');
    createToolTip('#infosleepnode' + nodeid, 'bottom');
    };

    
function highlightCell(oCell, timeUpDate) {
    if (timeUpDate) {
        var t = 'Update at ' + Date(timeUpDate);
        oCell.title = t;
        createToolTip("#" + oCell.id, 'right', t);
    };
    if (oCell.tagName == 'TD') { var elem = oCell;
    } else { var elem = $("#" + oCell.id).parents('td');};
    elem.attr('class', 'highlighted');
    setTimeout( function(){elem.removeClass('highlighted');},4000 );
};
    
// Mise à jour de la tabNodes depuis une Value Changed
function UpNodeInTab(zwNode, objValue, timeUpDate) {
    if (objValue.commandClass == 'COMMAND_CLASS_BATTERY' && objValue.label == 'Battery Level') {
        zwNode.BatteryLevel = objValue.value;
        RefreshDataNode(zwNode);
        cb_RefreshTabHtml(zwNode);
    };
};

// Mise à jour de la commande class si affichée.
function UpCmdClssValue(zwNode, objValue, timeUpDate) {
    var vTable = $('#detNode' + zwNode.Node).dataTable();
    if (vTable[0]) {
        var hCells = [];
        var objCell = $('#valCC' + objValue.id);
        if (objCell[0])  {
            var vPos = vTable.fnGetPosition(objCell[0].parentElement);
            var vData = vTable.fnGetData(vPos[0]);
            var cols = vTable.fnSettings().aoColumns;
            var colTitle ="";
            var cValue;
            for (var col=0, colLen=cols.length ; col<colLen ; col++) {
                colTitle = cols[col].sTitle;
                cValue = getValueTabCmdClass(vTable, vData, colTitle);
                if (colTitle == 'Num') {
                    console.log('colonne :' + colTitle + " data : " + cValue);
                } else if (colTitle == 'realValue') {
                    console.log('colonne :' + colTitle + " data : " + cValue);
                } else {
                    if (colTitle in objValue) {
                        if (colTitle == 'value') {
                            var idC= getDataTableColIndex(vTable.fnSettings(), 'realValue');
                            vTable.fnUpdate(objValue[colTitle], vPos[0], idC, false);    
                            hCells.push(objCell[0]);
                        } else if (cValue != objValue[colTitle]) {
                             if (colTitle in ['domogikdevice', 'readOnly','polled', 'pollintensity']) {
                                var idC= getDataTableColIndex(vTable.fnSettings(), 'Num');
                                vTable.fnUpdate(objValue[getDataTableColIndex(vTable.fnSettings(), 'value')], vPos[0], idC, false);
                                hCells.push($('#adr' + objValue.id)[0]);
                            };
                        } else {
                            console.log(' colonne :' + colTitle + " data : " + cValue);};
                        vTable.fnUpdate(objValue[colTitle], vPos[0], col, false);
                    } else {console.log('no data :' + colTitle + ' Value : '+cValue);} ;
                }; 
            };
            vTable.fnStandingRedraw();
            $.each(hCells, function(i, cell) {highlightCell(cell, timeUpDate);});
        };
    };
    UpNodeInTab(zwNode, objValue, timeUpDate);
};

function GetinfoNode (nodeid, callback) {
    if (nodeid) {
        var msg = {};
        msg['header'] = {'type': 'req-ack'};
        msg['request'] ='GetNodeInfo';
        msg['node'] =nodeid;
        sendMessage(msg, callback);
    }else { console.log("Dans getinfonode pas de nodeid "); };
};

function GetinfoValuesNode (nodeid, callback) {
    if (nodeid) {
        var msg = {};
        msg['header'] = {'type': 'req-ack'};
        msg['request'] ='GetNodeValuesInfo';
        msg['node'] =nodeid;
        sendMessage(msg, callback);
    };
};

function GetListCmdsCtrl (callback) {
    var msg = {};
    msg['header'] = {'type': 'req-ack'};
    msg['request'] ='GetListCmdsCtrl';
    msg['listetypes'] ='cmdsctrl';
    sendMessage(msg, callback);
};

// Gestion d'edition des associations 
function editNodeAss (zwNode, callback) {
    if (zwNode) {
        GetinfoNode (zwNode.Node, callback);
    } else {
        console.log("Dans editNodeAss pas de node : " + valueid);   
    }
};

function setValueNode(nodeId, valueid, value, aTable, nTr, newvalue) {
    if (newvalue === undefined) { newvalue = "none"; }
    if (valueid) {
        var msg = {};
        msg['header'] = {'type': 'req-ack'};
        msg['request'] ='setValue';
        msg['valueid'] = valueid;
        msg['node'] = nodeId;
        var obj = $('#valCC' + valueid);
        if  (newvalue == "none") {
            msg['newValue'] = obj.val();
        } else {
            msg['newValue'] = newvalue
        };
        sendMessage(msg, aTable);
    } else { 
        console.log("Dans setValueNode pas de valueid : " + valueid);   
    };
};

function setPollingValue(vTable, nodeid, valueid, polled, intensity) {
    console.log("set polling value : " + valueid + "(node : " + nodeid + ") state :" + polled + ", intensity :  " + intensity); 
    var msg = {};
    msg['header'] = {'type': 'req-ack'};
    msg['node'] = nodeid;  
    msg['valueid'] = valueid;  
    msg['intensity'] = intensity;  
    if (polled) {
        msg['request'] ='EnablePoll';
        $('#poll' + valueid).attr('checked', 'checked');
        $('#intensity').val(intensity);
        tpoll = gettext("Value is polled with intensity : ") + intensity
    } else { 
        msg['request'] ='DisablePoll';
        $('#poll' + valueid).removeAttr('checked');
        tpoll = gettext("Check to poll this value");
    };
    createToolTip('#poll' + valueid, 'top', tpoll);
    sendMessage(msg, vTable );
};

function setGroupsNode(stage, node, newgrps, callback) {
    if (node) {
            var msg = {};
            msg['header'] = {'type': 'req-ack'};
            msg['request'] ='setGroups';
            msg['node'] = node.Node;
            var grps =[];
            for (var i=0; i<newgrps.length; i++){
                grps.push({'idx': newgrps[i].index, 'mbs': newgrps[i].members});
            };
            msg['ngrps'] = grps;
            sendMessage(msg, function(data ){
                if (data['error'] == "") {
                    callback(stage, node.Node, data.groups);
                 } else { // Erreur dans la lib python
                    console.log("Dans setGroupsNode error : " + data['error']);                            
                     $.notification('error', gettext('groups association setting error') +' : ' + data['error'] );
                };
                });
    } else { messXpl['Error'] = "Node not define";
            console.log("Dans setGroupsNode pas de node : " + node);   
            return messXpl;
            }
};

function setMonitorNode(nodeid, monitored) {
    console.log("set monitor node : " + nodeid + "state :" + monitored); 
    var msg = {};
    msg['header'] = {'type': 'req-ack'};
    msg['node'] = nodeid;  
    if (monitored) {
        msg['request'] ='StartMonitorNode';
    } else { 
        msg['request'] ='StopMonitorNode';
    };
    sendMessage(msg, function(msg ){
        if (msg['error'] == "") {
            data = msg['data'];
            var zwNode = GetZWNodeById(msg['node']);
            if (data['state'] == 'started') {
                zwNode.Monitored = data['file'];
            } else {
                zwNode.Monitored = '';
            }
            RefreshDataNode(zwNode);
            cb_RefreshTabHtml(zwNode);
            UpNodeToolTips(zwNode.Node);
            $.notification('info', gettext(data['usermsg']) + " : " + data['file']);
        } else { // Erreur dans la lib python
            console.log("Dans setMonitorNode node "+ msg['node'] + " error : " + msg['error']);                            
            $.notification('error', gettext(msg['error']));
        };
    });
};

function refreshTreeProducts(data) {
  if (data['error'] =='') {
    var tab =[];
    var tProds = [];
    for (m in  data.data) {
        tProds = [];
        for (p in data.data[m].products) {
            if (data.data[m].products[p]['config']) {
                tProds.push({data:{title: data.data[m].products[p]['name'], icon: '/design/common/images/status/check_32.png',
                                        attr: {'id': 'prod' + m +'p' + p, 
                                                  'file': data.data[m].products[p]['config'],
                                                  'type': data.data[m].products[p]['type'],
                                                  'idp': data.data[m].products[p]['ids'],
                                    }}});
            } else {
                tProds.push({data:{title: data.data[m].products[p]['name'], icon: '/design/common/images/status/unknown_green_32.png',
                                        attr: {'id': 'prod' + m +'p' + p, 
                                                  'file': 'No config file',
                                                  'type': data.data[m].products[p]['type'],
                                                  'idp': data.data[m].products[p]['ids'],
                                    }}});
            };
        };
        tab.push({data : data.data[m].manufacturer + ' (' + data.data[m].id + ')' , 'children' : tProds});
    };
    $('#productTree').jstree({
        "themes" : {
            "theme" : "default",
            "dots" : false,
            "icons" : true
        },
        "plugins" : ["themes", "json_data", "ui", "crrm", "hotkeys"],
        "json_data" : {
            "data" : tab}
        })
        .bind("after_open.jstree", function (event, data) {
            var childs = data.inst._get_children(data.args[0]);
            var id;
            for (var c in childs) {
                try {
                    var id = childs[c].childNodes[1].getAttribute("id");
                }
                catch (err) {id =''}
                if (id) {
                    var text = 'File: ' + childs[c].childNodes[1].getAttribute("file") + "<br>" +
                                     'Type: ' + childs[c].childNodes[1].getAttribute("type") + "<br>" +
                                     ' Id: '+ childs[c].childNodes[1].getAttribute("idp");
                                     
                    createToolTip('#' + id, 'right', text);
                };
            };
        })
  }
};


