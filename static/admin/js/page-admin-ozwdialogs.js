// <![CDATA[
(function($) {
    $.widget("ui.dialog_association", {
        _init: function() {
            var self = this, o = this.options;
            this.element.dialog({
                autoOpen: false,
                modal: true,
				buttons: {
                    'OK': function() {
                        self._valid();
                    },
                    'Cancel': function() {
                        $(this).dialog('close');
                    }
				},
                close: function() {
                    $.each(self._allFields, function() {$(this).val('').removeClass('ui-state-error')});
				}
            });
        return this;
        },
        
        _addGroup : function(group) {
            console.log ("adding goups");
		},
        
        addbutton: function(ops) {
            var self = this, o = this.options;
            $(ops.button).click(function() {
                self.element.dialog_association('open', {
                    name: ops.name,
                    onok: ops.onok
                }); 
            });
        },
        
        open: function(ops) {
            var self = this, o = this.options;
            this.element.dialog('option', 'title', ops.title);
            this.element.dialog('option', 'buttons', {
                'OK': ops.onok,
                'Cancel': function() {
                    $(this).dialog('close');
                 },
                'Reset':  function(){
                    ResetGroups(this.stageGrps, ops.node);
                }
            });
            this.element.html(ops.node.Model);
            this.element.append("<div id='contgrpass'> </div>");
            this.stageGrps = stageGrps('contgrpass');
            this.node = ops.node;
            this.element.dialog('open');
            this.element.parent().width('auto');
            CreateGroups(this.stageGrps, ops.node, this.st_design_url);
        },
        
        setnewgroups:function(callback) {
            var self = this;
            var newgrps =  SetNewGroups(this.stageGrps, this.node);
            return {stage: this.stageGrps, node: this.node, newgrps: newgrps};
        }
    });
        
    $.extend($.ui.dialog_association, {
        defaults: {
            title: '',
            content: ''
        }
    });
})(jQuery);
// ]]>
