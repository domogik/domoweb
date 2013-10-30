 /* Librairie pour boite de dialogue action du controlleur   */ 
var RunningCtrlAction ={};
var ListeningStateCtrl = false;
var DialogInit = false;
var Action = {action: 'undefine', cmd: 'undefine', cmdsource: 'undefine', cptmsg: 0, nodeid: 0, highpower:'False' , arg :{}, id: 0};
var InterListening = setInterval(listeningCtrlState, 17000);
var lastActionSelect =''

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
    var status = this.status;
    if (this.status == 0) {status = 1;
    } else {status = 0;
    };
    return this.setStatus(status);
};

BtOnOff.prototype.getStatus = function() {
    return this.status
};

function dlgCtrlAction (vData) {
    if ( ! DialogInit) {   // in case of multi-call , don't create double instances .
        DialogInit = true;
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
            title: gettext("Controller actions"),
            button: "#ctrlactions",
            onok: function(values) {
                var self = this;
                // Submit form
                console.log('Sortie action controlleur');
            }
        });
        $('#divCtrlActionDialog').bind("dialogclose", function(event, ui) {
            lastActionSelect = $('#selectActCtrl')[0].value;
        });
        $('#divCtrlActionDialog').bind("dialogopen", function(event, ui) {
            $('#selectActCtrl')[0].value = lastActionSelect;
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
        });
    };
};

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

function checkStatesCtrl(state, data) {
    switch (state) {
        case 'Normal' :
            console.log('Callback ctrl action status : '+ data['cmdstate']);
            updateStateAction('stop');
            $('#tipsStatusActions').removeClass().addClass('icon16-text-right icon16-status-true');
            break;
        case 'Starting' :
            console.log('Callback ctrl action status : '+ data['cmdstate'], ', start listening .....');
            updateStateAction('running'); 
            $('#tipsStatusActions').removeClass().addClass('icon16-text-right icon16-action-play');
            break;
        case 'Cancel' :
            console.log('Callback ctrl action status : '+ data['cmdstate']);
            updateStateAction('stop');
            $('#tipsStatusActions').removeClass().addClass('icon16-text-right icon16-action-cancel');
            break;
        case 'Error' :
            console.log('Callback ctrl action status : '+ data['cmdstate']);
            updateStateAction('stop');
            $('#tipsStatusActions').removeClass().addClass('icon16-text-right icon16-status-warning');
            break;
        case 'Waiting' :
            console.log('Callback ctrl action status : '+ data['cmdstate']);
            $('#tipsStatusActions').removeClass().addClass('icon16-text-right icon16-action-processing_f6f6f6');
            updateStateAction('running');
            break;
        case 'Sleeping' :
            console.log('Callback ctrl action status : '+ data['cmdstate']);
            $('#tipsStatusActions').removeClass().addClass('icon16-text-right icon16-status-inactive');
            break;
       case 'InProgress' :
            console.log('Callback ctrl action status : '+ data['cmdstate'], ', continue listening .....');
            updateStateAction('running');
            $('#tipsStatusActions').removeClass().addClass('icon16-text-right icon16-action-processing_f6f6f6');
            break;
        case 'Completed' :
            console.log('Callback ctrl action status : '+ data['cmdstate']);
            updateStateAction('stop');
            $('#tipsStatusActions').removeClass().addClass('icon16-text-right icon16-status-success');
           break;
        case 'Failed' :
            console.log('Callback ctrl action status : '+ data['cmdstate']);
            updateStateAction('stop');
            $('#tipsStatusActions').removeClass().addClass('icon16-text-right icon16-status-false');
            break;
        case 'NodeOK' :
            console.log('Callback ctrl action status : '+ data['cmdstate']);
            $('#tipsStatusActions').removeClass().addClass('icon16-text-right icon16-status-success');
            break;
        case 'NodeFailed' :
            console.log('Callback ctrl action status : '+ data['cmdstate']);
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
        msg['header'] = {'type': 'req-ack'};
        msg['request'] ='ctrlAction';
        msg.action = {};
        msg.action.action = action;
        msg.action.cmd = cmd;
        msg.action.cmdsource = cmd;
        msg.action.cptmsg = 0;
        if ($('#actNodeID').is(':visible')) {
            var n = parseInt($('#actNodeID').val());
            msg.action.nodeid = n;
        } else {msg.action.nodeid = 0;}
        msg.action.highpower = 'False'
        if ($('#actHighPower').is(':visible')) {
            var n = $('#actHighPower').is(':checked');
            if (n) {msg.action.highpower =  'True';};
        };
        msg.action.arg = {};
        if ($('#actArgs').is(':visible')) {
            var n = parseInt($('#actArgs').val());
            msg.action.arg = n;
        };
        msg.action.id = Math.floor((Math.random()*1000)+1);
        Action = msg.action;
        sendMessage(msg, function(data){
            if (data['error'] == "") {
                $('#tipsStatusActions').text('Action "' + data['action'] + '" ,status "' +data['cmdstate'] +
                                                            '", information : ' + data['message']);
                console.log("Dans handle_RequestCtrlAction : " + JSON.stringify(data));
                $.notification('success','Controleur received action : ' + data['action'] + ', commande : ' + data['cmdstate']  );
                updateStateAction(data['cmdstate']);
                checkStatesCtrl('Starting', data);
            } else { // Erreur dans la lib python
                $('#tipsStatusActions').text('Action "' + data['action'] + '" ,status "' +data['cmdstate'] +
                                                            '", information : ' + data['error_msg']);
                console.log("no controleur action, error : " + data['error']);                          
                $.notification('error', 'Action  (' + action+ ') command (' +cmd + ') Controller report : ' + data['error'] + ', ' +
                                    data['error_msg'] + ', please check input');
                updateStateAction(data['cmdstate']);
                checkStatesCtrl(data['state'], data);
            };
        })
    } else {
        updateStateAction('stop');
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
        msg['header'] = {'type': 'req-ack'};
        msg['request'] ='ctrlAction';
        msg['action'] = Action;
        msg.action['cmd'] = 'getState';
        sendMessage(msg, handleCtrlState); 
    };
};
    
    
function handleCtrlState(ctrlState) {
    console.log('handleCtrlState : ',ctrlState);
    if ($('#divCtrlActionDialog').css('visibility') == 'visible') {
        console.log('ouvert');
            if (ctrlState['id'] == Action.id) {
                    if (ctrlState['cmd'] == 'getState') { };
        
                $('#tipsStatusActions').text('Action "' + ctrlState['action'] + '" ,status "' +ctrlState['state'] +
                                                            '", information : ' + ctrlState['message']);
                if (ctrlState['error'] == "") {
                    console.log("Dans listeningCtrlState : " + JSON.stringify(ctrlState));
                    $.notification('success','Controleur received action : ' + ctrlState['cmd'] + '  '  + ctrlState['action'] + ', commande : ' + ctrlState['cmdstate']  );
                    if (ctrlState['cmdstate'] != 'running') {
                        updateStateAction('stop');
                        checkStatesCtrl(ctrlState['state'], ctrlState);
                    };
                } else { // Erreur du controlleur
                    updateStateAction('stop');
                    checkStatesCtrl(ctrlState['state'], ctrlState);
                    console.log("no controleur action, error : " + ctrlState['error']);                          
                    $.notification('error', 'Action  (' + Action['action']+ ') command (' + Action['cmd'] + ') report : ' + ctrlState['error_msg'] + ', please check input');          
                };                        

            } else {
                console.log('Controller Notification state not register as an running action : '+ ctrlState)
                $.notification('debug', 'Controller Notification state not register as an running action : '+ ctrlState);
            };                
    }else {console.log('fermé');};
};
