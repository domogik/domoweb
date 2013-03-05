 /* Librairie pour boite de dialogue action du controlleur   */ 
var RunningCtrlAction ={};
var ListeningStateCtrl = false;
var Action = {action: 'undefine', cmd: 'undefine', cmdsource: 'undefine', cptmsg: 0, nodeid: 0, highpower:'False' , arg :{}, id: 0};
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
        return this.status;
    } else {
        return this.status;
    };
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
        sstips: gettext("Status and user informations last action :"),
        sstipsid : 'tipsStatusActions',
        fields: [
            {name : 'selectActCtrl', type:'select', label: gettext("Chose controller action :"), required: false,
                options: {
                    placeholder: gettext("Choose a action"),
                },
                items: vData, 
            },
            {name : 'actNodeID', type:'text', label:"Node number", required: false, options: {min: 1, max: 3}},
            {name : 'actHighPower', type:'checkbox', label:"High power", required: false},
            {name : 'actArgs', type:'text', label:"Argument", required: false, options: {min: 1, max: 3}}
            ]
        }); 
        
    $('#divCtrlActionDialog').append("<li class='label' id='tipsInfoCmd'>"+gettext("No action")+"</li>" );     
    $('#actHighPower').attr('title', gettext('Used only with the AddDevice, AddController, RemoveDevice and RemoveController commands.' +
                                        'Usually when adding or removing devices, the controller operates at low power so that the controller ' +
                                        'must be physically close to the device for security reasons. '+
                                        'If high Power is true, the controller will operate at normal power levels instead. Defaults to false.'));
    $('#selectActCtrl').after($('#tipsInfoCmd'));
    RunningCtrlAction = new BtOnOff('divCtrlActionDialog', 'runCtrlAction', ['button icon16-action-play', 'button icon16-action-processing_ffffff'],
                        ['Start action', 'Stop action'], handle_RequestCtrlAction);
    $('#selectActCtrl').before($('#runCtrlAction'));
    $('#selectActCtrl').attr('lockSelect','');
    $('#tipsStatusActions').removeClass('tip').addClass('icon16-text-right icon16-status-true');
    $('#tipsStatusActions').css('font-size', 12);
    $('#tipsInfoCmd').css('font-size', 12);
    $('label[for=actArgs],#actArgs').hide(); // Not Used at this time
    createToolTip('#actHighPower', 'left');
    $('#divCtrlActionDialog').dialog_formctrlaction('addbutton', {
        title: gettext("Controller actions (in BETA version)"),
        button: "#ctrlactions",
        onok: function(values) {
            var self = this;
            // Submit form
            console.log('Sortie action controlleur');
        }
    });

    $('#selectActCtrl').on('change', function(e, sel) {
        var lockSelect = $('#selectActCtrl').attr('lockSelect');
        if (lockSelect == '') {
            var elem = $(e.target);
            console.log('select change :', listCmdCtrl[sel.selected]);
            $('#tipsInfoCmd').text(listCmdCtrl[sel.selected]);
            $('label[for=actArgs],#actArgs').hide(); // Not Used at this time
            switch (sel.selected) {
                case AVAILABLECMDS[0] :  // 'None'
                    $('label[for=actNodeID],#actNodeID').hide();
                    $('label[for=actHighPower],#actHighPower').hide();
                    break;
                case AVAILABLECMDS[1] :  // 'AddDevice'
                    $('label[for=actNodeID],#actNodeID').hide();
                    $('label[for=actHighPower],#actHighPower').show();
                    break;
                case AVAILABLECMDS[2] :  // 'CreateNewPrimary'
                    $('label[for=actNodeID],#actNodeID').hide();
                    $('label[for=actHighPower],#actHighPower').show();
                    break;
                case AVAILABLECMDS[3] :  // 'ReceiveConfiguration'
                    $('label[for=actNodeID],#actNodeID').hide();
                    $('label[for=actHighPower],#actHighPower').hide();
                    break;
                case AVAILABLECMDS[4] :  // 'RemoveDevice'
                    $('label[for=actNodeID],#actNodeID').hide();
                    $('label[for=actHighPower],#actHighPower').show();
                    break;
                case AVAILABLECMDS[5] :  // 'RemoveFailedNode'
                    $('label[for=actNodeID],#actNodeID').show();
                    $('label[for=actHighPower],#actHighPower').hide();
                    break;
                case AVAILABLECMDS[6] :  // 'HasNodeFailed'
                    $('label[for=actNodeID],#actNodeID').show();
                    $('label[for=actHighPower],#actHighPower').hide();
                    break;
                case AVAILABLECMDS[7] :  // 'ReplaceFailedNode'
                    $('label[for=actNodeID],#actNodeID').show();
                    $('label[for=actHighPower],#actHighPower').hide();
                    break;
                case AVAILABLECMDS[8] :  // 'TransferPrimaryRole'
                    $('label[for=actNodeID],#actNodeID').hide();
                    $('label[for=actHighPower],#actHighPower').hide();
                    break;
                case AVAILABLECMDS[9] :  // 'RequestNetworkUpdate'
                    $('label[for=actNodeID],#actNodeID').hide();
                    $('label[for=actHighPower],#actHighPower').hide();
                    break;
                case AVAILABLECMDS[10] :  // 'RequestNodeNeighborUpdate'
                    $('label[for=actNodeID],#actNodeID').show();
                    $('label[for=actHighPower],#actHighPower').hide();
                    break;
                case AVAILABLECMDS[11] :  // 'AssignReturnRoute'
                    $('label[for=actNodeID],#actNodeID').show();
                    $('label[for=actHighPower],#actHighPower').hide();
                    $('label[for=actArgs],#actArgs').show(); //  Used for node to 
                    var t= $('#tipsInfoCmd').text();
                    $('#tipsInfoCmd').text(t + ' "Node number" = The node that we will use the route., "Argument" = The node that we will change the route.');
                    break;
                case AVAILABLECMDS[12] :  // 'DeleteAllReturnRoutes'
                    $('label[for=actNodeID],#actNodeID').show();
                    $('label[for=actHighPower],#actHighPower').hide();
                    break;
                case AVAILABLECMDS[13] :  // 'SendNodeInformation'
                    $('label[for=actNodeID],#actNodeID').show();
                    $('label[for=actHighPower],#actHighPower').hide();
                    break;
                case AVAILABLECMDS[14] :  // 'ReplicationSend'
                    $('label[for=actNodeID],#actNodeID').hide();
                    $('label[for=actHighPower],#actHighPower').hide();
                    break;
                case AVAILABLECMDS[15] :   // 'CreateButton'
                    $('label[for=actNodeID],#actNodeID').show();
                    $('label[for=actHighPower],#actHighPower').hide();
                    $('label[for=actArgs],#actArgs').show(); // Probably  Used for id 
                    break;

             /*    case AVAILABLECMDS[16] :  // 'DeleteButton' */
                case AVAILABLECMDS[16] : // 'DeleteButton'
                    $('label[for=actNodeID],#actNodeID').show();
                    $('label[for=actHighPower],#actHighPower').hide();
                    $('label[for=actArgs],#actArgs').show(); // Probably  Used for id 
                    break;
                default :
                    $('label[for=actNodeID],#actNodeID').hide();
                    $('label[for=actHighPower],#actHighPower').hide();
                    console.log('ctrl unknoww action : ', sel.selected);
            };
        } else {
            $('#selectActCtrl options[value='+lockSelect+']').attr("selected", "selected");
        };
        console.log('rerer');
    });
}

function updateStateAction(state, locked){
    if (locked === undefined) { locked = false; }
    if (state != 'running') {
            $('#selectActCtrl').attr('lockSelect','');
            RunningCtrlAction.locked = locked;
            RunningCtrlAction.setStatus(0);
            ListeningStateCtrl = false;
    } else {
           $('#selectActCtrl').attr('lockSelect', Action.action);
            RunningCtrlAction.locked = locked;
            RunningCtrlAction.setStatus(1);
            ListeningStateCtrl = true;
    };
};

function checkStatesCtrl(state) {
    switch (state) {
        case 'Normal' :
            console.log('Callback ctrl action status : '+ messXpl['cmdstate']);
            updateStateAction('stop');
            $('#tipsStatusActions').removeClass().addClass('icon16-text-right icon16-status-true');
            break;
        case 'Starting' :
            console.log('Callback ctrl action status : '+ messXpl['cmdstate'], ', start listening .....');
            updateStateAction('running'); 
            $('#tipsStatusActions').removeClass().addClass('icon16-text-right icon16-action-play');
            break;
        case 'Cancel' :
            console.log('Callback ctrl action status : '+ messXpl['cmdstate']);
            updateStateAction('stop');
            $('#tipsStatusActions').removeClass().addClass('icon16-text-right icon16-action-cancel');
            break;
        case 'Error' :
            console.log('Callback ctrl action status : '+ messXpl['cmdstate']);
            updateStateAction('stop');
            $('#tipsStatusActions').removeClass().addClass('icon16-text-right icon16-status-warning');
            break;
        case 'Waiting' :
            console.log('Callback ctrl action status : '+ messXpl['cmdstate']);
            $('#tipsStatusActions').removeClass().addClass('icon16-text-right icon16-action-processing_f6f6f6');
            updateStateAction('running');
            break;
        case 'Sleeping' :
            console.log('Callback ctrl action status : '+ messXpl['cmdstate']);
            $('#tipsStatusActions').removeClass().addClass('icon16-text-right icon16-status-inactive');
            break;
       case 'InProgress' :
            console.log('Callback ctrl action status : '+ messXpl['cmdstate'], ', continue listening .....');
            updateStateAction('running');
            $('#tipsStatusActions').removeClass().addClass('icon16-text-right icon16-action-processing_f6f6f6');
            break;
        case 'Completed' :
            console.log('Callback ctrl action status : '+ messXpl['cmdstate']);
            updateStateAction('stop');
            $('#tipsStatusActions').removeClass().addClass('icon16-text-right icon16-status-success');
           break;
        case 'Failed' :
            console.log('Callback ctrl action status : '+ messXpl['cmdstate']);
            updateStateAction('stop');
            $('#tipsStatusActions').removeClass().addClass('icon16-text-right icon16-status-false');
            break;
        case 'NodeOK' :
            console.log('Callback ctrl action status : '+ messXpl['cmdstate']);
            $('#tipsStatusActions').removeClass().addClass('icon16-text-right icon16-status-success');
            break;
        case 'NodeFailed' :
            console.log('Callback ctrl action status : '+ messXpl['cmdstate']);
            $('#tipsStatusActions').removeClass().addClass('icon16-text-right icon16-status-warning');
            break;
    };
};

function handle_RequestCtrlAction(cmd) {
    var a1 = $('#selectActCtrl');
    var a = a1[0];
    var action = a.value;
    if (action) {
        updateStateAction('running');
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
        Action.highpower = 'False'
        if ($('#actHighPower').is(':visible')) {
            var n = $('#actHighPower').is(':checked');
            if (n) {Action.highpower =  'True';};
        };
        Action.arg = {};
        action.id = Math.floor((Math.random()*1000)+1);
        var val = Action;
        val['request'] ='ctrlAction';
        msg['value'] = SetDataToxPL (val);
        rinor.put(['api', 'command', 'ozwave', 'UI'], msg)
            .done(function(data, status, xhr){
                messXpl = GetDataFromxPL(data, 'data');
                $('#tipsStatusActions').text('Action "' + messXpl['action'] + '" ,status "' +messXpl['cmdstate'] +
                                                            '", information : ' + messXpl['message']);
                if (messXpl['error'] == "") {
                    console.log("Dans handle_RequestCtrlAction : " + JSON.stringify(messXpl));
                    $.notification('success','Controleur received action : ' + messXpl['action'] + ', commande : ' + messXpl['cmdstate']  );
                    updateStateAction(messXpl['cmdstate']);
                    checkStatesCtrl('Starting');
                    return messXpl;
                } else { // Erreur dans la lib python
                    console.log("no controleur action, error : " + messXpl['error']);                          
                    $.notification('error', 'Action  (' + action+ ') command (' +cmd + ') Controller report : ' + messXpl['error'] + ', ' +
                                        messXpl['error_msg'] + ', please check input');
                    updateStateAction('stop');
                    checkStatesCtrl(messXpl['state']);
                    return messXpl['error'];
                };
            })
            .fail(function(jqXHR, status, error){
               if (jqXHR.status == 400)
                    $.notification('error', 'No confirmation for controller action : (' + action + ') please check your configuration');
                    var messXpl ={};
                    messXpl['Error'] =  "New action send";
                    messXpl['action'] =  Action;
                    updateStateAction('stop');
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
                        checkStatesCtrl(messXpl['state']);
                    };
                };
                $('#tipsStatusActions').text('Action "' + messXpl['action'] + '" ,status "' +messXpl['state'] +
                                                            '", information : ' + messXpl['message']);
                if (messXpl['error'] == "") {
                    console.log("Dans listeningCtrlState : " + JSON.stringify(messXpl));
                    $.notification('success','Controleur received action : ' + messXpl['cmd'] + '  '  + messXpl['action'] + ', commande : ' + messXpl['cmdstate']  );
                    if (messXpl['cmdstate'] != 'running') {
                        updateStateAction('stop');
                        checkStatesCtrl(messXpl['state']);
                    };
                    return messXpl;
                } else { // Erreur dans la lib python
                    updateStateAction('stop');
                    checkStatesCtrl(messXpl['state']);
                    console.log("no controleur action, error : " + messXpl['error']);                          
                    $.notification('error', 'Action  (' + Action['action']+ ') command (' + Action['cmd'] + ') report : ' + messXpl['error'] + ', please check input');
                    return messXpl['error']             
                };
            })
            .fail(function(jqXHR, status, error){
                $('.jGrowl-notification.error').remove();
                $('.jGrowl-notification.info').remove();
                var messXpl ={};
                if (jqXHR.status == 400) {
                    $('#selectActCtrl').disabled = false;
                   $.notification('error', 'No listening for controller action : (' + Action['action'] + ') please check your configuration');
                    messXpl['Error'] =  "Listening action";
                    messXpl['action'] =  Action;
                    updateStateAction('stop');
                    checkStatesCtrl(messXpl['state']);
                    return messXpl;
                } else {
                    var t = (15 * Action['cptmsg']) + 5;
                    $.notification('info', 'Continue listening for controller action : (' + Action['action'] + ') Waiting since : ' +  t + ' sec.');
                    ListeningStateCtrl = true;  // Boucle tant que pas d'arrêt
                    updateStateAction('running');
                    checkStatesCtrl(messXpl['state']);
                    return messXpl;
               };
            });
        };
    };
