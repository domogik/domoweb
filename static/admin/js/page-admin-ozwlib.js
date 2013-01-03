var netWorkZW = {};
var listNodes = new Array();
var listTypesVal = {};
var hdCmdClss = new Array();
var initialized = false;
// Constante d'entete de colonne de la table node_items 
var hdLiNode = {"NodeId": 0, "Name": 1, "Location": 2, "Model": 3, "Awake":  4, "Type": 5, "Last update": 6, "Action": 7};
var mbrGrpSt = {0: 'unknown', 1: 'confirmed', 2: 'to confirm', 3: 'to update'};

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
//    dt=dt.replace(/[|]/g,'{').replace(/[;]/g,',').replace(/[\\]/g,'}').replace(/[']/g,'"');
    dt= dt.replace(/&ouvr;/g,'{').replace(/&ferm;/g,'}').replace(/&quot;/g,'"');

    if (key=='count') {
        fin=dt.search('}');   
        dt=dt.slice(0,fin);
        dt='{"count":8}';
        };
    console.log("GetDataFromxPL dt = " + dt);
    return JSON.parse(dt); 
};
        
 function ParseAckXPL(xpl) {
    var tamp=xpl;
    var li=0;
    var inc=1;
    var mesxPL = {};
//      mesxPL['count']=1;
    console.log("****** xpl brut :");
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
   //                 dt= (dt.replace(/[|]/g,'{').replace(/[;]/g,',').replace(/[\\]/g,'}').replace(/[']/g,'"')) + "}";
                    dt= dt.replace(/&ouvr;/g,'{').replace(/&ferm;/g,'}').replace(/&quot;/g,'"');
                    console.log (dt);
                    mesxPL[ks[i]] = JSON.parse(dt);
                };
            }
            console.log (mesxPL[ks[i]]);
        };
//     };
    return mesxPL;
};
    
function SetDataToxPL (data) {
    dt=JSON.stringify(data);
    console.log ("SetDataToxPL : " + dt);
//var val = dt.replace(/[{]/g, '|').replace(/[,]/g,';').replace(/[}]/g,'\\').replace(/["]/g,"'"); 
    var val = dt.replace(/["]/g,"&quot;").replace(/[{]/g,"&ouvr;").replace(/[}]/g,"&ferm;") ; 
    console.log ("SetDataToxPL str : " + val);
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
    
// Gestion des tables de données
function RefreshDataNode(infonode, last) {
    var idx = -1;
    for (var i = 0; i < listNodes.length; i++) {
        if (listNodes[i].Node == infonode.Node) {
            idx = i;
            break;
        };
    };
    if (idx != -1) {
        listNodes[idx] = infonode;
    } else {
        listNodes.push(infonode);
    };
    if (last) {
        if  (initialized) {setTimeout(function () {buildKineticNeighbors();},1000);   
            } else {setTimeout(function () {initNeighborsStage();},1000); };
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
    
    function SetStatusMemberGrp(infonode,group,member,status) {
        console.log ('Set status :' + status);
    }
        
        
// fnRender, callback des élements du tableau autre que texte
    function setNameNode(oObj) {
        return "<input type='text' title='Name' value='" + oObj.aData[hdLiNode['Name']] + "'/>";
        };
        
    function setStatusSleep(oObj) {
       var status = oObj.aData[hdLiNode['Awake']];
       if (status==true) { //Sleeping
            textstatus = "Probablement en veille";
            st = 'unknown';
        } else { //actif
            textstatus = "Actif sur le réseaux";
            st = 'active';
        };
        console.log("set status sleep coloms : " + oObj.aData + " " + status);
        return  st + "<span class='icon16-text-right  icon16-status-" + st + "' /span>";
        };
        
    function setActionNode(oObj) {
        var num = oObj.aData[hdLiNode['NodeId']];
        var stAct = 'add';
        var tabDet = document.getElementById("detNode" + num);
        if (tabDet) { // DetailNode opened 
            stAct = 'del'; 
        };
        var ret =  "<button id='detailnode" + num + 
                        "' class='icon16-action-" + stAct +" buttonicon' title='Detail Node' ><span class='offscreen'>Detail Node : " + num + "</span></button>";
         ret =  ret + "<button id='updnode" + num + 
                        "' class='icon16-action-save buttonicon' title='Update Node' ><span class='offscreen'>Send update to Node : " + num + "</span></button>";
      
        for (var i=0; i< listNodes.length; i++) {
            if (listNodes[i].Node == num && listNodes[i].Groups.length > 0) {
                ret =  ret + "<button id='updnode" + num + 
                        "' class='icon16-action-customize buttonicon' title='Edit association' name='Node groups' ><span class='offscreen'>Edit association Node : " + num + "</span></button>";
                };
            };
 //   
        console.log("******** setActionNode : " + oObj.aData + " ret : " + ret);
        return  ret;
        };
         
    function renderCmdClssNode(oObj) {
        var num = oObj.aData[0];
        if (num < 10) { num = "0" + num; };
        indexSt = getDataTableColIndex(oObj.oSettings, 'domogikdevice');
        indexH = getDataTableColIndex(oObj.oSettings, 'help');
        var status = oObj.aData[indexSt];
        var readOnly = oObj.aData[getDataTableColIndex(oObj.oSettings, 'readOnly')];
        var help = gettext(oObj.aData[indexH]);
       if (readOnly==true) {
            textRW = gettext("Read only");
            st ='active';
        } else {            
            textRW = gettext("Read and Write");
            st ='inactive';
        };
         var rw=  " <span class='icon16-text-right icon16-status-" + st +"' title='" + textRW + "'></span>";
        if (help!="") {
            extra = "  <span class='icon16-text-right icon16-status-info' title='" + help + "'></span>";
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
        return  num + "<span class='icon16-text-right icon16-status-" + st + "' title='" + textstatus + "'></span>" +rw + extra;
        };

    function renderCmdClssName(oObj) {
        var CmdClss = oObj.aData[getDataTableColIndex(oObj.oSettings, 'commandClass')];
        var help = gettext(oObj.aData[getDataTableColIndex(oObj.oSettings, 'help')]);
        return   "<span title='" + help + "'>" + CmdClss + "</span>";
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
            ret = value;
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
                ret ="<select id='" + id + "' name='CmdClssValue' class='listes ccvalue' style='width:7em'>" + opt + "</select>";
            };
            if (type=='Byte') {
                ret ="<input id='" + id + "' name='CmdClssValue' class='ccvalue' type='number' min='0' max='255' style='width:3em' value='"+ value +"'></input>";
            };
            if (type=='Short') {
                ret ="<input id='" + id + "' name='CmdClssValue' class='ccvalue' type='number' min='0' max='65535' style='width:6em' value='"+ value +"'></input>";
            };
            if (type=='Int' | type=='Decimal') {
                ret ="<input id='" + id + "' name='CmdClssValue' class='ccvalue' type='number' style='width:8em' value='"+ value +"'></input>";
            };
            if (type=='String') {
                ret ="<input id='" + id + "' name='CmdClssValue' class='ccvalue' type='text' value='"+ value +"'></input>";
            };
             if (type=='Schedule') {
                ret ="<input id='" + id + "' name='CmdClssValue' class='ccvalue' type='date' value='"+ value +"'></input>";
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
                ret ="<select id='" + id + "' name='CmdClssValue' class='liste ccvalue' style='width:15em'>" + opt + "</select>";
            };realvalue
            if (type=='Button') {
                ret ="<input id='" + id + "' name='CmdClssValue' class='ccvalue' type='button' value='"+ value +"'></input>"; 
            };
            if (modify) {
                ret = ret + "<button id='send" + vId +"' class='button icon16-action-update buttonicon' name='Send value' title='Send value'><span class='offscreen'>Send value</span></button>";
            };
        };
        return ret
    };

    function handleChangeVCC (){
        $('.ccvalue').change(function () { // '#' + id
                var nTr = this.parentNode.parentNode;
                if (this.name =='CmdClssValue') {
                        var oTable = $("#" + nTr.parentElement.parentElement.id).dataTable();
                        var aPos = oTable.fnGetPosition(this.parentElement );
                        var oSettings = oTable.fnSettings();
                        var idC= getDataTableColIndex(oSettings, 'value');
                        var ok = oTable.fnUpdate(this.value,aPos[0],idC,false);
                        handleChangeVCC ();
                };
        });
    }
        
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
    function fnFormatDetails (nTr, thOut)
    {
        var aData = oTabNodes.fnGetData(nTr);
        var idDetNode = 'detNode' + aData[hdLiNode['NodeId']];
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
        
function GetinfoNode (nodeid, callback, queue) {
    var infoNode ={};
    if (nodeid) {
            var msg = {};
            msg['command'] = "Refresh";
            var val = {};
            val['request'] ='GetNodeInfo';
            val['node'] =nodeid;
            msg['value'] = SetDataToxPL (val);
            rinor.put(['api', 'command', 'ozwave', 'UI'], msg)
                .done(function(data, status, xhr){
                    infoNode = ParseAckXPL(data.xpl)
                    var dt=JSON.stringify(infoNode.data);
                    console.log("Dans getinfonode : " + infoNode.data['Model']);
                    $.notification('debug',"Node : " + infoNode.data['Model'] + " info refreshed" );
                    infoNode.data['Groups'] = [];
                    for (var i=0; i< infoNode.countgrps; i++) {
                        infoNode.data['Groups'].push(infoNode['group' +i]);
                        ii=0;
                        mb = 'g'+i+'m'+ii;
                        members=[];
                        while (infoNode[mb]) {
                            members.push(infoNode[mb]);
                            ii++;
                            mb = 'g'+i+'m'+ii;
                        }; 
                       infoNode.data['Groups'][i]['members'] = members;  
                    };
                    RefreshDataNode(infoNode.data, (queue.length == 0));
                    callback(infoNode.data);
                    console.log("Node is refreshed, nodeID: " + nodeid);
                    if (queue && queue.length !=0) {
                        nodeid = queue[0];
                        queue = queue.slice(1);
                        GetinfoNode(nodeid, callback, queue);
                    };
                        
                })
                .fail(function(jqXHR, status, error){
                   if (jqXHR.status == 400)
                        $.notification('error', '{% trans "Data not sent" %} (' + jqXHR.responseText + ') please check your device configuration');
                        infoNode['Node'] =   nodeid;
                        infoNode['Model'] = "NodeId not define";
                        return infoNode;
                });
    }else { infoNode['Model'] = "NodeId not define";
            console.log("Dans getinfonode  pas de nodeid " + infoNode['Model']);   
            return infoNode;
            } 
};

    // Gestion d'edition des associations 
    function editNodeAss (zwNode, callback) {
        if (zwNode) {
            GetinfoNode (zwNode.Node, callback, false);
        } else {
            console.log("Dans editNodeAss pas de node : " + valueid);   
        }
    };

    function setValueNode(valueid, value, aTable, nTr) {
        var messXpl = {};
        if (valueid) {
                var msg = {};
                msg['command'] = "Refresh";
                var val = {};
                val['request'] ='setValue';
                val['valueid'] = valueid;
                var obj = $('#valCC' + valueid);
                val['newValue'] = $('#valCC' + valueid).val();
                msg['value'] = SetDataToxPL (val);
                rinor.put(['api', 'command', 'ozwave', 'UI'], msg)
                    .done(function(data, status, xhr){
                        messXpl = GetDataFromxPL(data, 'data');
                        if (messXpl['error'] == "") {
                            console.log("Dans setValueNode : " + messXpl);
                            var idC= getDataTableColIndex(aTable.fnSettings(), 'realValue');
                            var nTR = obj;
                            var aPos = aTable.fnGetPosition(obj[0].parentElement);
                            var ok = aTable.fnUpdate(messXpl['value'],aPos[0],idC, false);
                            $('#send' + valueid).remove();
                            return messXpl;
                        } else { // Erreur dans la lib python
                            console.log("Dans setValueNode error : " + messXpl['error']);                            
                            return messXpl['error']             
                        };
                    })
                    .fail(function(jqXHR, status, error){
                       if (jqXHR.status == 400)
                            $.notification('error', '{% trans "New value not sent" %} (' + jqXHR.responseText + ') please check your device configuration');
                            messXpl['Error'] =  "New value not sent";
                            messXpl['ValueId'] =   valueid;
                            messXpl['New value'] = val['newValue'];
                            return messXpl;
                    });
        } else { messXpl['Error'] = "valueId not define";
                console.log("Dans setValueNode pas de valueid : " + valueid);   
                return messXpl;
                }
    };
    function setGroupsNode(stage, node, newgrps, callback) {
        var messXpl = {};
        if (node) {
                var msg = {};
                msg['command'] = "Refresh";
                var val = {};
                val['request'] ='setGroups';
                val['node'] = node.Node;
                var grps =[];
                for (var i=0; i<newgrps.length; i++){
                    grps.push({'idx': newgrps[i].index, 'mbs': newgrps[i].members});
                };
                val['ngrps'] = grps;
                var strtemp = SetDataToxPL (val);
                msg['value'] =  strtemp;
                console.log(strtemp);
                rinor.put(['api', 'command', 'ozwave', 'UI'], msg)
                    .done(function(data, status, xhr){
                        messXpl = GetDataFromxPL(data, 'data');
                        if (messXpl['error'] == "") {
                            console.log("Dans setGroupsNode : " + messXpl);
                            callback(stage, node.Node, messXpl['groups']);
                            
                            return messXpl;
                            
                        } else { // Erreur dans la lib python
                            console.log("Dans setGroupsNode error : " + messXpl['error']);                            
                            return messXpl['error']             
                        };
                    })
                    .fail(function(jqXHR, status, error){
                       if (jqXHR.status == 400)
                            $.notification('error', '{% trans "New association not sent" %} (' + jqXHR.responseText + ') please check your device configuration');
                            messXpl['Error'] = "New association not sent";
                            messXpl['NodeId'] = node.Node;
                            messXpl['Model'] = node.Model;
                            return messXpl;
                    });
        } else { messXpl['Error'] = "Node not define";
                console.log("Dans setGroupsNode pas de node : " + node);   
                return messXpl;
                }
    };
