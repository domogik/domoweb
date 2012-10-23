    var netWorkZW ={};
    var listNodes = new Array();
    var listTypesVal = {};
    var hdCmdClss = new Array();
    var initialized = false;
    // Constante d'entete de colonne de la table node_items 
    var hdLiNode = {"NodeId":0, "Name":1, "Location":2, "Model":3, "Awake": 4, "Type":5, "Last update":6, "Action":7};

function GetDataFromxPL (data, key) {
        dt=JSON.stringify(data);
        debut=dt.search(key + '=');
        offset =key.length;
        if (key=='count') {
            dt=dt.slice(debut);
         //   dt= '{' +dt;
       //     fin=dt.search('\\');
        }else { 
            dt=dt.slice(debut+offset+1);
          }; 
        fin=dt.search('}');   
        dt=dt.slice(0,fin-2); 
        dt=dt.replace(/[|]/g,'{').replace(/[;]/g,',').replace(/[\\]/g,'}').replace(/[']/g,'"');
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
        var i=0;
        var inc=1;
        var mesxPL = {};
        mesxPL['count']=1;
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
                    if (num) {val = num} else {val=ligne.slice(ki+1)}
                    mesxPL[ligne.slice(0,ki)] =  val;
                }
                tamp=tamp.slice(li+inc)
            };
            };
        console.log("*** mesxPL['count'] = " + mesxPL['count']);
        if (mesxPL.count > 0) { 
            for (i=0; i< mesxPL.count; i++) {
                dt=mesxPL['value' +i];
                dt= (dt.replace(/[|]/g,'{').replace(/[;]/g,',').replace(/[\\]/g,'}').replace(/[']/g,'"')) + "}";
                console.log (dt);
                mesxPL['value' +i] = JSON.parse(dt); 
                console.log (mesxPL['value' +i]);
            };
        } else {
            console.log (" --- no data--- messxPL" + mesxPL);
        };
        return mesxPL;
    };
        
    function SetDataToxPL (data) {
        dt=JSON.stringify(data);
        console.log ("SetDataToxPL : " + dt);
        var val = dt.replace(/[{]/g, '|').replace(/[,]/g,';').replace(/[}]/g,'\\').replace(/["]/g,"'"); 
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
    function RefreshDataNode(infonode) {
        var idx = listNodes.indexOf(infonode)
        if (idx != -1) {
            listNodes[idx] = infonode;
        } else {
            listNodes.push(infonode);
        };
    };
        
        
        
// fnRender, callback des élements du tableau autre que texte
    function setNameNode(oObj) {
        return "<input type='text' title='Name' value='" + oObj.aData[hdLiNode['Name']] + "'/>";
        };
        
    function setStatusSleep(oObj) {
       var status = oObj.aData[hdLiNode['Awake']];
       if (status==true) { //Sleeping
            textstatus = "Probablement en veille";
            st = 'unknown'
        } else { //actif
            textstatus = "Actif sur le réseaux";
            st = 'active'
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
 //       console.log("******** setActionNode : " + oObj.aData + " ret : " + ret);
        return  ret;
        };
         
    function renderCmdClssNode(oObj) {
        var num = oObj.aData[0];
        if (num < 10) { num = "0" + num; };
        indexSt = getDataTableColIndex(oObj.oSettings, 'domogikdevice')
        indexH = getDataTableColIndex(oObj.oSettings, 'help')
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
            st = 'primary'
        } else { //not available
            textstatus = gettext("Not available for domogik device");
            st = 'false'
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
        var id = "valCC" + vId 
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
                             "<option value=false>false</option>"
                } else {
                    opt = "<option value=true>true</option>" +
                             "<option selected value=" + value +">" + value + "</option>" 
                }
                ret ="<select id='" + id + "' name='CmdClssValue' class='listes' style='width:7em'>" + opt + "</select>";
            };
            if (type=='Byte') {
                ret ="<input id='" + id + "' name='CmdClssValue' type='number' min='0' max='255' style='width:3em' value='"+ value +"'></input>";
            };
            if (type=='Short') {
                ret ="<input id='" + id + "' name='CmdClssValue' type='number' min='0' max='65535' style='width:6em' value='"+ value +"'></input>";
            };
            if (type=='Int' | type=='Decimal') {
                ret ="<input id='" + id + "' name='CmdClssValue' type='number' style='width:8em' value='"+ value +"'></input>";
            };
            if (type=='String') {
                ret ="<input id='" + id + "' name='CmdClssValue' type='text' value='"+ value +"'></input>";
            };
             if (type=='Schedule') {
                ret ="<input id='" + id + "' name='CmdClssValue' type='date' value='"+ value +"'></input>";
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
                ret ="<select id='" + id + "' name='CmdClssValue' class='liste' style='width:15em'>" + opt + "</select>";
            };realvalue
            if (type=='Button') {
                ret ="<input id='" + id + "' name='CmdClssValue' type='button' value='"+ value +"'></input>"; 
            };
            if (modify) {
                ret = ret + "<button id='send" + vId +"' class='button icon16-action-update buttonicon' name='Send value' title='Send value'><span class='offscreen'>Send value</span></button>";
            };
        };
        return ret
    };

    function returnTextValue(val) {
        if (typeof(val) != 'number') {
            debut = val.search('value=');
            if (debut != -1) {GetinfoValuesNode
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
     //       sOut += '<th scope="col">Num</th><th scope="col">realValue</th>';
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

// Gestion d'edition des values 
    function editvalueNode (valueid, callback) {
        var valueNode = [];
        var messXpl = {};
        if (valueid) {
                var msg = {};
                msg['command'] = "Refresh";
                var val = {};
                val['request'] ='GetValueInfos';
                val['valueid'] =valueid;
                msg['value'] = SetDataToxPL (val);
                rinor.put(['api', 'command', 'ozwave', 'UI'], msg)
                    .done(function(data, status, xhr){
                        messXpl = GetDataFromxPL(data, 'data');
                        if (messXpl['error'] == "") {
                            console.log("Dans GetinfoValuesNode : " + messXpl);
                            callback(messXpl);             
                            return messXpl;
                        } else { // Erreur dans la lib python
                            console.log("Dans GetValueNode error : " + messXpl['error']);
                            return messXpl['error']             
                        };
                    })
                    .fail(function(jqXHR, status, error){
                       if (jqXHR.status == 400)
                            $.notification('error', '{% trans "Data not sent" %} (' + jqXHR.responseText + ') please check your device configuration');
                            valueNode['ValueId'] =   ValueId;
                            valueNode['Model'] = "ValueId not define";
                            return valueNode;
                    });
        } else { valueNode['Model'] = "ValueId not define";
                console.log("Dans GetValueNode pas de valueid : " + valueid);   
                return valueNode;
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
                            $.notification('error', '{% trans "Data not sent" %} (' + jqXHR.responseText + ') please check your device configuration');
                            messXpl['ValueId'] =   ValueId;
                            messXpl['Model'] = "ValueId not define";
                            return messXpl;
                    });
        } else { messXpl['Model'] = "ValueId not define";
                console.log("Dans setValueNode pas de valueid : " + valueid);   
                return messXpl;
                }
    };
