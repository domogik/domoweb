(function($) {
    $.create_widget({
        // default options
        options: {
            version: 0.1,
            creator: 'Basilic,Domogik',
            id: 'dmg_2x1_basicNoStateActuatorOff',
            name: 'Basic Widget Off',
            description: 'Only Off',
	    screenshot: 'dmg_2x1_basicNoStateActuatorOff.png',
            type: 'actuator.binary',
            height: 1,
            width: 2,
            displayname: true,
            displayborder: true
        },

        _init: function() {
            var self = this, o = this.options;
            this.element.addClass("icon32-usage-" + o.usage)
              .processing();
            // Building widget content
            var main = $("<div class='main'></div>");
            var off_action = $('<div class="command off">OFF</div>');
            off_action.click(function (e) {self.action(o.model_parameters.value0);e.stopPropagation();})
                .keypress(function (e) {if (e.which == 34 || e.which == 40) {self.action(o.model_parameters.value0); e.stopPropagation();}});
            main.append(off_action);
            
            this.element.append(main);
            
            this._initValues(1);
        },
        
        _statsHandler: function(stats) {
        },
        
        _eventHandler: function(timestamp, value) {
        },
        
        action: function(command_code) {
            var self = this, o = this.options;
//            rinor.put(['api', 'command', o.devicetechnology, o.deviceaddress], {"command":command_code})
            rinor.put(['api', 'command', o.devicetechnology, o.deviceaddress], {"command":o.model_parameters.command, "value":o.model_parameters.value0})
                .done(function(data, status, xhr){
                    self.valid(o.featureconfirmation);
                })
                .fail(function(jqXHR, status, error){
                    self.cancel();
                    if (jqXHR.status == 400)
                        $.notification('error', jqXHR.responseText);
                });
        },
        cancel: function() {
            this.element.stopProcessingState();
        },

        /* Valid the processing state */
        valid: function(confirmed) {
            this.element.stopProcessingState();
        }
    });
})(jQuery);
