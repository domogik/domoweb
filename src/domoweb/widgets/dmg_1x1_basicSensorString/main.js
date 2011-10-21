(function($) {
    $.create_widget({
        // default options
        options: {
            version: 0.1,
            creator: 'Domogik',
            id: 'dmg_1x1_basicSensorString',
            name: 'Basic widget',
            description: 'Basic widget with border and name',
            type: 'sensor.string',
            height: 1,
            width: 1,
            displayname: true,
			displayborder: true
        },

        _init: function() {
            var self = this, o = this.options;
            this.element.addClass("icon32-usage-" + o.usage)

            this._value =  $("<div class='value'></div>");
            this.element.append(this._value);

            this._initValues(1);
        },

        _statsHandler: function(stats) {
            if (stats) {
                this.setValue(stats.value);
            } else {
                this.setValue(null);
            }
        },
        
        _eventHandler: function(timestamp, value) {
            this.setValue(value);
        },

        setValue: function(value) {
            var self = this, o = this.options;
            if (value) {
                this.element.displayIcon('known');             
                this._value.html(value);
            } else { // Unknown
                this.element.displayIcon('unknown');             
                this._value.html('---');
            }
        }
    });
})(jQuery);