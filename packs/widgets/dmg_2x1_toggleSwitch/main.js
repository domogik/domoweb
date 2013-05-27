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
            width: 2,
            displayname: true,
	    displayborder: false,
	    usage: "light"
        },

        _init: function() {
            var self = this, o = this.options;
            this.element.addClass('clickable');
            this.element.append("<div class='bgd'><div class='switch'></div></div>");
            this.element.click(function (e) {self.action();e.stopPropagation();})
                .keypress(function (e) {if (e.which == 13 || e.which == 32) {self.action; e.stopPropagation();}});                    

            this.param = o.params[0];
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
            this.element.unbind('click');
            if (this.currentValue) {
                this.processingValue = (this.currentValue == 0)?1:0;                
            } else { // Current state unknown
                // Suppose the switch currently off
                this.processingValue = 1;
            }
            this.displayValue(this.processingValue);

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
                if (value == 1) {
                    this.currentValue = 1;
                } else if (value == 0) {
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
                    this.element.addClass('value_true').removeClass('value_false');             
                } else {
                    this.element.addClass('value_false').removeClass('value_true');             
                }
            }
        }
    });
})(jQuery);
