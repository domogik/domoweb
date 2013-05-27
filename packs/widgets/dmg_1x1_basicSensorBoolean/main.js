(function($) {
    $.create_widget({
        // default options
        options: {
            version: 0.1,
            creator: 'Domogik',
            id: 'dmg_1x1_basicSensorBoolean',
            name: 'Basic widget',
            description: 'Basic widget with border and name',
            type: 'sensor.boolean',
            height: 1,
            width: 1,
            displayname: true,
			displayborder: true
        },

        _init: function() {
            var self = this, o = this.options;
            this.element.addClass("icon32-usage-" + o.usage)
            this.TRUE=o.model_parameters.value1
            this.FALSE= o.model_parameters.value0
            if (typeof(this.TRUE) == 'string') {this.TRUE=this.TRUE.toLowerCase();};
            if (typeof(this.FALSE) == 'string') {this.FALSE=this.FALSE.toLowerCase();};
            this._status = $.getStatus();
            this.element.append(this._status);

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

        setValue: function(value) {
            var self = this, o = this.options;
            if (typeof(value) == 'string') {value = value.toLowerCase();}
            if (value==this.TRUE || value==this.FALSE) {
                if (value == this.TRUE) {
                    this.element.displayIcon('value_true');             
                    this._status.removeClass('icon16-status-unknown icon16-status-inactive').addClass('icon16-status-active');
                }
                if(value== this.FALSE) { // low
                    this.element.displayIcon('value_false');             
                    this._status.removeClass('icon16-status-unknown icon16-status-active').addClass('icon16-status-inactive');
                }
                this._status.html("<div class='offscreen'>"+value+"</div>");
            } else { // Unknown
                this.element.displayIcon('unknown');             
                this._status.removeClass('icon16-status-active icon16-status-inactive').addClass('icon16-status-unknown');
                this._status.html("<div class='offscreen'>Unknown</div>");
            }
            this.previousValue = value;
        }
    });
})(jQuery);
