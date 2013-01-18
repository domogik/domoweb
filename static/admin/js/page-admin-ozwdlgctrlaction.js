 /* Librairie pour boite de dialogue action du controlleur   */ 
var RunningCtrlAction ={};
var ListeningStateCtrl = false;
var Action = {action: 'undefine', cmd: 'undefine', cmdsource: 'undefine', cptmsg: 0, nodeid: 0, arg :{}, id: 0};
var InterListening = setInterval(listeningCtrlState, 17000);

BtOnOff = function (parentid , id, backgrds,  texts, callbackClick){
    this.backgrds = backgrds;
    this.texts = texts;
    this.status = 0;
    this.id = id;
    this.locked = false;
    $('#'+parentid).append("<button id='"+ id + "' class='button " + backgrds[0] + " leftpanelbutton' name='on/off' title='Start action'>"
                                                            + "<span id='offscreen" + id +"' class='offscreen'>Start action</span></button>");
    $('#' + id + '[title]').tooltip_right();
    btOnOff = this;
    $('#'+id).click(function(){
        var prevSt = btOnOff.status;
        if (prevSt != btOnOff.toggle()) {
            callbackClick(btOnOff.texts[prevSt]);
        };
        return false;
    });
};

BtOnOff.prototype.setStatus = function(status) {
    if (status == 1) { // in ['on','ON','On', 1, 'Run', 'RUN','run']) {
        st = 1;
    }else {st =  0};
    if (!this.locked && st != this.status) {
        $('#'+this.id).removeClass(this.backgrds[this.status]).addClass(this.backgrds[st]);
        t = gettext(this.texts[st])
        $('#offscreen'+this.id).text(t);
     //   $('#'+this.id).attr('title', t);
        $('#'+this.id).qtip('api').updateContent(t);
        this.status = st;    
    }
    return this.status;
};

BtOnOff.prototype.toggle = function() {
    if (this.status == 0) {status = 1;
    } else {status = 0;
    };
    return this.setStatus(status);
};

BtOnOff.prototype.getStatus = function() {
    return this.status
};

function dlgCtrlAction (vData) {
     var  AVAILABLECMDS = ['None','AddDevice', 'CreateNewPrimary', 'ReceiveConfiguration', 'RemoveDevice', 'RemoveFailedNode', 'HasNodeFailed', 
                'ReplaceFailedNode', 'TransferPrimaryRole', 'RequestNetworkUpdate', 'RequestNodeNeighborUpdate', 'AssignReturnRoute', 
                 'DeleteAllReturnRoutes', 'SendNodeInformation', 'ReplicationSend', 'CreateButton', 'DeleteButton'];
     
    $('#divCtrlActionDialog').dialog_formctrlaction({
        tips: gettext("Some actions block controller activity, you must unlock it after session action fisnished.") ,
        tipsid: 'tipsCtrlActions',
        sstips: gettext("Action status and user informations"),
        sstipsid : 'tipsStatusActions',
        fields: [
            {name : 'selectActCtrl', type:'select', label: gettext("Chose controller action :"), required: false,
                options: {
                    placeholder: gettext("Choose a action"),
                },
                items: vData, 
            },
            {name : 'actNodeID', type:'text', label:"Node number", required: false, options: {min: 1, max: 3}},
            {name : 'actRemoveNode', type:'checkbox', label:"for example", required: false, options: {min: 1, max: 80}}
            ]
        }); 
        
    $('#divCtrlActionDialog').append("<li class='tip' id='tipsInfoCmd'>"+gettext("No action")+"</li>");
    $('#selectActCtrl').after($('#tipsInfoCmd'));
    RunningCtrlAction = new BtOnOff('divCtrlActionDialog', 'runCtrlAction', ['button icon16-action-play', 'button icon16-action-processing_ffffff'],
                        ['Start action', 'Stop action'], handle_RequestCtrlAction);
    $('#selectActCtrl').before($('#runCtrlAction'));
    $('#divCtrlActionDialog').dialog_formctrlaction('addbutton', {
        title: gettext("Controller actions (in BETA version)"),
        button: "#ctrlactions",
        onok: function(values) {
            var self = this;
            // Submit form
            console.log('Sortie action controlleur');
        }
    });

    $('#selectActCtrl').live('change', function(e, sel) {
        var elem = $(e.target);
        console.log('select change :', listCmdCtrl[sel.selected]);
        $('#tipsInfoCmd').text(listCmdCtrl[sel.selected]);
        switch (sel.selected) {
            case AVAILABLECMDS[0] :  // 'None'
                console.log('ctrl new select action');
                break;
            case AVAILABLECMDS[1] :  // 'AddDevice'
                console.log('ctrl new select action');
                break;
            case AVAILABLECMDS[2] :  // 'CreateNewPrimary'
                console.log('ctrl new select action');
                break;
            case AVAILABLECMDS[3] :  // 'ReceiveConfiguration'
                console.log('ctrl new select action');
                break;
            case AVAILABLECMDS[4] :  // 'RemoveDevice'
                console.log('ctrl new select action');
                break;
            case AVAILABLECMDS[5] :  // 'RemoveFailedNode'
                console.log('ctrl new select action');
                break;
            case AVAILABLECMDS[6] :  // 'HasNodeFailed'
                $('#actNodeID').show();
                $('#actRemoveNode').show();
                console.log('ctrl new select action');
                break;
            case AVAILABLECMDS[7] :  // 'ReplaceFailedNode'
                console.log('ctrl new select action');
                break;
            case AVAILABLECMDS[8] :  // 'TransferPrimaryRole'
                console.log('ctrl new select action');
                break;
            case AVAILABLECMDS[9] :  // 'RequestNetworkUpdate'
                $('#actNodeID').hide();
                $('#actRemoveNode').hide();
                console.log('ctrl new select action');
                break;
            case AVAILABLECMDS[10] :  // 'RequestNodeNeighborUpdate'
                $('#actNodeID').show();
                $('#actRemoveNode').hide();
                console.log('ctrl new select action')
                break;
            case AVAILABLECMDS[11] :  // 'AssignReturnRoute'
                console.log('ctrl new select action')
                break;
            case AVAILABLECMDS[12] :  // 'DeleteAllReturnRoutes'
                console.log('ctrl new select action');
                break;
            case AVAILABLECMDS[13] :  // 'SendNodeInformation'
                console.log('ctrl new select action');
                break;
            case AVAILABLECMDS[14] :  // 'ReplicationSend'
                console.log('ctrl new select action');
                break;
            case AVAILABLECMDS[15] :  // 'CreateButton'
                console.log('ctrl new select action');
                break;
            case AVAILABLECMDS[16] :  // 'DeleteButton'
                console.log('ctrl new select action');
                break;
            default :
                console.log('ctrl unknoww action : ', sel.selected);
        }
    });
}

function handle_RequestCtrlAction(cmd) {
    var a1 = $('#selectActCtrl');
    a1.attr('disabled', 'disabled');
    var a = a1[0];
    var action = a.value;
    if (action) {
        a1.disabled = true;
        var msg = {};
        msg['command'] = "Refresh";
        Action.action = action;
        Action.cmd = cmd;
        Action.cmdsource = cmd;
        Action.cptmsg = 0;
        if ($('#actNodeID').is(':visible')) {
            var n = parseInt($('#actNodeID').val());
            Action.nodeid = n;
        } else {Action.nodeid = 0;}
        Action.arg = {};
        action.id = Math.floor((Math.random()*1000)+1);
        var val = Action;
        val['request'] ='ctrlAction';
        msg['value'] = SetDataToxPL (val);
        rinor.put(['api', 'command', 'ozwave', 'UI'], msg)
            .done(function(data, status, xhr){
                messXpl = GetDataFromxPL(data, 'data');
                $('#tipsStatusActions').text('Commande status : ' +messXpl['cmdstate'] + ' , information : ' + messXpl['message']);
                if (messXpl['error'] == "") {
                    console.log("Dans controleur action : " + messXpl);
                    $.notification('debug','Controleur received action : ' +  + '  '  + messXpl['action'] + ', commande :' + messXpl['cmdstate']  );
                    if (messXpl['cmdstate'] != 'running') {
                         a1.disabled = false;
                        ListeningStateCtrl = false
                    } else {
                        ListeningStateCtrl = true
                        // listeningCtrlState(Action); 
                    };
                    return messXpl;
                } else { // Erreur dans la lib python
                    a1.disabled = false;
                    console.log("no controleur action, error : " + messXpl['error']);                          
                    $.notification('error', 'Action  (' + action+ ') command (' +cmd + ') Controller report : ' + messXpl['error'] + ', ' +
                                        messXpl['error_msg'] + ', please check input');
                    ListeningStateCtrl = false;
                    return messXpl['error']             
                };
            })
            .fail(function(jqXHR, status, error){
               if (jqXHR.status == 400)
                    $.notification('error', 'No confirmation for controller action : (' + action + ') please check your configuration');
                    messXpl['Error'] =  "New action send";
                    messXpl['action'] =  Action;
                    ListeningStateCtrl = false;
                    return messXpl;
            });
        };
    };
    
 /*  ControllerState 
                        ControllerState_Normal = 0,                             /**< No command in progress.  
                        ControllerState_Starting,                               /**< The command is starting.  
                        ControllerState_Cancel,                                 /**< The command was cancelled.  
                        ControllerState_Error,                                  /**< Command invocation had error(s) and was aborted  
                        ControllerState_Waiting,                                /**< Controller is waiting for a user action.  
                        ControllerState_Sleeping,                               /**< Controller command is on a sleep queue wait for device.  
                        ControllerState_InProgress,                             /**< The controller is communicating with the other device to carry out the command.  
                        ControllerState_Completed,                              /**< The command has completed successfully.  
                        ControllerState_Failed,                                 /**< The command has failed.  
                        ControllerState_NodeOK,                                 /**< Used only with ControllerCommand_HasNodeFailed to indicate that the controller thinks the node is OK.  
                        ControllerState_NodeFailed                              /**< Used only with ControllerCommand_HasNodeFailed to indicate that the controller thinks the node has failed.  

                 * Controller Errors
                 * Provide some more information about controller failures.
                  
                  ControllerError_None = 0,
                  ControllerError_ButtonNotFound,                               /**< Button  
                  ControllerError_NodeNotFound,                                 /**< Button  
                  ControllerError_NotBridge,                                    /**< Button  
                  ControllerError_NotSUC,                                       /**< CreateNewPrimary  
                  ControllerError_NotSecondary,                                 /**< CreateNewPrimary  
                  ControllerError_NotPrimary,                                   /**< RemoveFailedNode, AddNodeToNetwork  
                  ControllerError_IsPrimary,                                    /**< ReceiveConfiguration  
                  ControllerError_NotFound,                                     /**< RemoveFailedNode  
                  ControllerError_Busy,                                         /**< RemoveFailedNode, RequestNetworkUpdate  
                  ControllerError_Failed,                                       /**< RemoveFailedNode, RequestNetworkUpdate  
                  ControllerError_Disabled,                                     /**< RequestNetworkUpdate error  
                  ControllerError_Overflow                                      /**< RequestNetworkUpdate error */
/*
'action'  ctrlaction , undefine
'cmd'   start, stop, getstate, undefine
'cmdsource' start, stop, getstate, undefine
'cptMsg' nombre getstate pour l'action id
'nodeid' nodeid , 0
'arg' argument ,''
'id' actionid, 0

retour

'action'  ctrlaction
'cmd'   start, stop, getstate, undefine
'cmdsource' start, stop, getstate, undefine
'cptMsg' nombre getstate pour l'action id
'nodeid' nodeid , 0
'arg' argument ,''

'cmdstate' running stop waiting
'state' ControllerState
'message'ControllerState.doc
'error' ControllerErrors
'error_msg' ControllerErrors.doc 
'update" ime du dernier update*/


function listeningCtrlState() {
    if (ListeningStateCtrl) {
        Action.cptmsg = Action.cptmsg + 1;
        var timeOutMax = 60000 
        var msg = {};
        msg['command'] = "Refresh";
        var val = Action;
        val['request'] ='ctrlAction';
        val['cmd'] = 'getState';
        msg['value'] = SetDataToxPL (val);
        rinor.put(['api', 'command', 'ozwave', 'UI'], msg)
            .done(function(data, status, xhr){
                messXpl = GetDataFromxPL(data, 'data');
                if (messXpl['cmd'] == 'getState') {
                    if (messXpl['id'] == Action.id) {
                        switch (messXpl['state']) {
                            case 'Normal' :
                                console.log('Callback ctrl action sattus : '+ messXpl['cmdstate']);
                                RunningCtrlAction.locked = false;
                                RunningCtrlAction.setStatus(0);
                                ListeningStateCtrl = false;
                                break;
                            case 'Starting' :
                                console.log('Callback ctrl action sattus : '+ messXpl['cmdstate'], ', start listening .....');
                                RunningCtrlAction.setStatus(1);
                                RunningCtrlAction.locked = true;
                                ListeningStateCtrl = true;  // Boucle tant que pas d'arrêt                        
                            case 'Cancel' :
                                console.log('Callback ctrl action sattus : '+ messXpl['cmdstate']);
                                RunningCtrlAction.locked = false;
                                RunningCtrlAction.setStatus(0);
                                ListeningStateCtrl = false;
                                break;
                            case 'Error' :
                                console.log('Callback ctrl action sattus : '+ messXpl['cmdstate']);
                                RunningCtrlAction.locked = false;
                                RunningCtrlAction.setStatus(0);
                                ListeningStateCtrl = false;
                                break;
                            case 'Waiting' :
                                console.log('Callback ctrl action sattus : '+ messXpl['cmdstate']);
                                ListeningStateCtrl = true;  // Boucle tant que pas d'arrêt
                                break;
                            case 'Sleeping' :
                                console.log('Callback ctrl action sattus : '+ messXpl['cmdstate']);
                                break;
                           case 'InProgress' :
                                console.log('Callback ctrl action sattus : '+ messXpl['cmdstate'], ', continue listening .....');
                                RunningCtrlAction.setStatus(1);
                                RunningCtrlAction.locked = true;
                                ListeningStateCtrl = true;  // Boucle tant que pas d'arrêt
                                break;
                            case 'Completed' :
                                console.log('Callback ctrl action sattus : '+ messXpl['cmdstate']);
                                RunningCtrlAction.locked = false;
                                RunningCtrlAction.setStatus(0);
                                ListeningStateCtrl = false;
                               break;
                            case 'Failed' :
                                console.log('Callback ctrl action sattus : '+ messXpl['cmdstate']);
                                RunningCtrlAction.locked = false;
                                RunningCtrlAction.setStatus(0);
                                ListeningStateCtrl = false;
                                break;
                            case 'NodeOK' :
                                console.log('Callback ctrl action sattus : '+ messXpl['cmdstate']);
                                break;
                            case 'NodeFailed' :
                                console.log('Callback ctrl action sattus : '+ messXpl['cmdstate']);
                                break;
                        };
                    };
                };
                $('#tipsStatusActions').text('Commande status : ' +messXpl['cmdstate'] + ' , information : ' + messXpl['message']);
                if (messXpl['error'] == "") {
                    console.log("Dans controleur action : " + messXpl);
                    $.notification('debug','Controleur received action : ' + messXpl['cmd'] + '  '  + messXpl['action'] + ', commande :' + messXpl['cmdstate']  );
                    if (messXpl['cmdstate'] != 'running') {$('#selectActCtrl').disabled = false;};
                    return messXpl;
                } else { // Erreur dans la lib python
                    $('#selectActCtrl').disabled = false;
                    console.log("no controleur action, error : " + messXpl['error']);                          
                    $.notification('error', 'Action  (' + Action['action']+ ') command (' + Action['cmd'] + ') report : ' + messXpl['error'] + ', please check input');
                    return messXpl['error']             
                };
            })
            .fail(function(jqXHR, status, error){
               if (jqXHR.status == 400) {
                    $('#selectActCtrl').disabled = false;
                   $.notification('error', 'No listening for controller action : (' + Action['action'] + ') please check your configuration');
                    messXpl['Error'] =  "Listening action";
                    messXpl['action'] =  Action;
                    ListeningStateCtrl = false;
                    return messXpl;
               } else {
                    $.notification('info', 'Continue listening for controller action : (' + Action['action'] + ') Waiting');
                    ListeningStateCtrl = true;  // Boucle tant que pas d'arrêt
                    return messXpl;
               };
            });
        };
    };
