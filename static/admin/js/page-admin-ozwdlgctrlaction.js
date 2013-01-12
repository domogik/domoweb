 /* Librairie pour boite de dialogue action du controlleur   */ 
var  RunningCtrlAction ={};

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
            {name : 'actAddNode', type:'text', label:"for example", required: false, options: {min: 1, max: 80}},
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
                console.log('ctrl new select action');
                break;
            case AVAILABLECMDS[7] :  // 'ReplaceFailedNode'
                console.log('ctrl new select action');
                break;
            case AVAILABLECMDS[8] :  // 'TransferPrimaryRole'
                console.log('ctrl new select action');
                break;
            case AVAILABLECMDS[9] :  // 'RequestNetworkUpdate'
                console.log('ctrl new select action');
                break;
            case AVAILABLECMDS[10] :  // 'RequestNodeNeighborUpdate'
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
        a.disabled = true;
        var msg = {};
        msg['command'] = "Refresh";
        var val = {};
        val['request'] ='ctrlAction';
        val['action'] = action;
        val['cmd'] = cmd;
        val['option'] = 'no';
        msg['value'] = SetDataToxPL (val);
        rinor.put(['api', 'command', 'ozwave', 'UI'], msg)
            .done(function(data, status, xhr){
                messXpl = GetDataFromxPL(data, 'data');
                $('#tipsStatusActions').text('Commande status : ' +messXpl['cmdstate'] + ' , information : ' + messXpl['userinfo']);
                if (messXpl['error'] == "") {
                    console.log("Dans controleur action : " + messXpl);
                    $.notification('debug','Controleur received action : ' + messXpl['cmd'] + '  '  + messXpl['action'] + ', commande :' + messXpl['cmdstate']  );
                    if (messXpl['cmdstate'] != 'running') {a.disabled = false;};
                    return messXpl;
                } else { // Erreur dans la lib python
                    a.disabled = false;
                    console.log("no controleur action, error : " + messXpl['error']);                            
                    return messXpl['error']             
                };
            })
            .fail(function(jqXHR, status, error){
               if (jqXHR.status == 400)
                   a.disabled = false;
                    $.notification('error', 'No confirmation for controller action : (' + action + ') please check your configuration');
                    messXpl['Error'] =  "New action send";
                    messXpl['action'] =  action;
                    return messXpl;
            });
        };
    };
