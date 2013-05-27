(function($) {
    $.create_widget({
        // default options
        options: {
            version: 0.1,
            creator: 'Basilic,Domogik',
            id: 'dmg_2x1_basicNoStateActuatorOn',
            name: 'Basic Widget On',
            description: 'Only On',
	    screenshot: 'dmg_2x1_basicNoStateActuatorOn.png',
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
            displayborder: true,
	    usage: "light"
        },

        _init: function() {
            var self = this, o = this.options;
            this.element.addClass("icon32-usage-" + o.usage)
              .processing();
            // Building widget content
            var main = $("<div class='main'></div>");
            var on_action = $('<div class="command on">' + this.param.dataparameters.labels["1"] + '</div>');
            on_action.click(function (e) {self.action();e.stopPropagation();})
                .keypress(function (e) {if (e.which == 33 || e.which == 38) {self.action(o.values[1]); e.stopPropagation();}});
            main.append(on_action);
            
            this.element.append(main);
            this.param = o.params[0];
        },
        
        _statsHandler: function(stats) {
        },
        
        _eventHandler: function(timestamp, value) {
        },
        
        action: function() {
            var self = this, o = this.options;
	    data = {};
	    data[this.param.key] = 1;
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
            this.element.stopProcessingState();
        },

        /* Valid the processing state */
        valid: function(confirmed) {
            this.element.stopProcessingState();
        }
    });
})(jQuery);
