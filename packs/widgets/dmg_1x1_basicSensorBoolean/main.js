(function($) {
    $.create_widget({
        // default options
        options: {
            version: 0.1,
            creator: 'Domogik',
            id: 'dmg_1x1_basicSensorBoolean',
            name: 'Basic widget',
            description: 'Basic widget with border and name',
            type: 'sensor',
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
	    displayborder: true
        },

        _init: function() {
            var self = this, o = this.options;
/*            this.element.addClass("icon32-usage-" + o.usage);*/

            this._status = $.getStatus();
            this.element.append(this._status);

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

        setValue: function(value) {
            var self = this, o = this.options;
            if (value != null) {
                if (value == 1) {
                    this.element.displayIcon('value_true');             
                    this._status.removeClass('icon16-status-unknown icon16-status-inactive').addClass('icon16-status-active');
                } else {
                    this.element.displayIcon('value_false');             
                    this._status.removeClass('icon16-status-unknown icon16-status-active').addClass('icon16-status-inactive');
                }
/*                this._status.html("<div class='offscreen'>"+value+"</div>");*/
            } else { // Unknown
                this.element.displayIcon('unknown');             
                this._status.removeClass('icon16-status-active icon16-status-inactive').addClass('icon16-status-unknown');
/*                this._status.html("<div class='offscreen'>Unknown</div>");*/
            }
            this.previousValue = value;
        }
    });
})(jQuery);
