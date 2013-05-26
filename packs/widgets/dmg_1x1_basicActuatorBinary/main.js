(function($) {
    $.create_widget({
        // default options
        options: {
            version: 0.1,
            creator: 'Domogik',
            id: 'dmg_1x1_basicActuatorBinary',
            name: 'Basic widget',
            description: 'Basic widget with border and name',
	    screenshot: 'dmg_1x1_basicActuatorBinary.png',
            type: 'command',
	    supported : ["DT_Bool",
		"DT_Switch",
		"DT_Enable",
		"DT_Binary",
		"DT_Step",
		"DT_UpDown",
		"DT_OpenClose",
		"DT_Start",
		"DT_State"
	    ],
	    height: 1,
            width: 1,
            displayname: true,
	    displayborder: true,
	    usage: "light"
        },

        _init: function() {
            var self = this, o = this.options;
            this.element.addClass("icon32-usage-" + o.usage)
            this.element.addClass('clickable')
                .processing();
            this._status = $.getStatus();
            this.element.append(this._status);
            this.element.click(function (e) {self.action();e.stopPropagation();})
                .keypress(function (e) {if (e.which == 13 || e.which == 32) {self.action; e.stopPropagation();}});                    

            this.param = o.params[0];
/*            this.texts = [o.usage_parameters.state0, o.usage_parameters.state1];*/
            this.setValue(o.initial_value);
        },

        _statsHandler: function(stats) {
            if (stats && stats.length > 0) {
                this.setValue(stats[0].value);
            } else {
                this.setValue(null);
            }
        },

        _eventHandler: function(timestamp, value) {
            this.setValue(value);
        },

        action: function() {
            var self = this, o = this.options;
            this.element.startProcessingState();
            if (this.currentValue) {
                this.processingValue = (this.currentValue == 0)?1:0;                
            } else { // Current state unknown
                // Suppose the switch currently off
                this.processingValue = 1;
            }
   	    data = {};
	    data[this.param.key] = this.processingValue;
            rinor.put(['api', 'command', o.featureid], data)
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
            var self = this, o = this.options;
            this.element.stopProcessingState();
            this._status.displayStatusError();
        },

        /* Valid the processing state */
        valid: function(confirmed) {
            var self = this, o = this.options;
            this.processingValue = null;
            this.element.stopProcessingState();
            if (confirmed) {
                this._status.displayStatusOk();
                this.element.doTimeout( 'resetStatus', state_reset_status, function(){
                    self._status.displayResetStatus();
                });
            } else {
                self._status.displayResetStatus();                
            }
        },
        
        setValue: function(value) {
	    this.currentValue = value;
            this.processingValue = null;
            this.displayValue(this.currentValue);
        },

        displayValue: function(value) {
            var self = this, o = this.options;
            if (value != null) {
                if (value == 1) {
                    this.element.displayIcon('value_true');             
                } else {
                    this.element.displayIcon('value_false');             
                }
                this._status.writeStatus(this.param.dataparameters['labels'][value]);
            } else { // Unknown
                this.element.displayIcon('unknown');                             
                this._status.writeStatus('---');
            }
        }
    });
})(jQuery);