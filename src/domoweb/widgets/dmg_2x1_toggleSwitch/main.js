(function($) {
    $.create_widget({
        // default options
        options: {
            version: 0.1,
            creator: 'Domogik',
            id: 'dmg_2x1_toggleSwitch',
            name: 'Shiny toggle switch',
            description: 'Shiny toggle switch using CSS3 animation',
            screenshot: 'dmg_2x1_toggleSwitch.png', 
            type: 'actuator.binary',
            height: 1,
            width: 2,
            displayname: true,
			displayborder: false
        },

        _init: function() {
            var self = this, o = this.options;
            this.values = [o.model_parameters.value0, o.model_parameters.value1];
            this.element.addClass('clickable');
            this.element.append("<div class='bgd'><div class='switch'></div></div>");
            this.element.click(function (e) {self.action();e.stopPropagation();})
                .keypress(function (e) {if (e.which == 13 || e.which == 32) {self.action; e.stopPropagation();}});                    

            this._initValues(1);
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
            this.element.unbind('click');
            if (this.currentValue) {
                this.processingValue = (this.currentValue == 0)?1:0;                
            } else { // Current state unknown
                // Suppose the switch currently off
                this.processingValue = 1;
            }
            this.displayValue(this.processingValue);

            rinor.put(['api', 'command', o.devicetechnology, o.deviceaddress], {"command":o.model_parameters.command, "value":this.values[this.processingValue]})
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
            this.setValue(!this.processingValue);
            this.element.click(function (e) {self.action();e.stopPropagation();})
                .keypress(function (e) {if (e.which == 13 || e.which == 32) {self.action; e.stopPropagation();}});
        },

        /* Valid the processing state */
        valid: function(confirmed) {
            var self = this, o = this.options;
            this.currentValue = this.processingValue;
            this.processingValue = null;
            this.element.click(function (e) {self.action();e.stopPropagation();})
                .keypress(function (e) {if (e.which == 13 || e.which == 32) {self.action; e.stopPropagation();}});
        },
        
        setValue: function(value) {
            if (value != null) {
                if (value == 1 || (typeof(value) == 'string' && value.toLowerCase() == this.values[1])) {
                    this.currentValue = 1;
                } else if (value == 0 || (typeof(value) == 'string' && value.toLowerCase() == this.values[0])) {
                    this.currentValue = 0;
                }                
            } else { // Unknown
                this.currentValue = null;
            }
            this.processingValue = null;
            this.displayValue(this.currentValue);
        },

        displayValue: function(value) {
            var self = this, o = this.options;
            if (value != null) {
                if (value == 1) {
                    this.element.addClass('value_1').removeClass('value_0');             
                } else {
                    this.element.addClass('value_0').removeClass('value_1');             
                }
            }
        }
    });
})(jQuery);
