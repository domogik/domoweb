const auto_send = 3000; // 3 seconds

(function($) {
    $.create_widget({
        // default options
        options: {
            version: 0.1,
            creator: 'Domogik',
            id: 'dmg_4X1_largeActuatorRange',
            name: 'Large actuator range',
            description: 'Large actuator range with nice design',
            type: 'actuator.range',
            height: 1,
            width: 4,
            displayname: false,
			displayborder: false
        },

        _init: function() {
            var self = this, o = this.options;
            this.min_value = parseInt(o.model_parameters.valueMin);
            this.max_value = parseInt(o.model_parameters.valueMax);
            this.step = parseInt(o.usage_parameters.step);
            this.unit = o.usage_parameters.unit

            var ident = $("<div class='ident'>" + o.devicename + " - " + o.featurename + "</div>");
            this.element.append(ident);
            var main = $("<div class='main'></div>");
            this.indicator = $("<div class='indicator'></div>");
            main.append(this.indicator);
            this.value = $("<div class='value'></div>");
            main.append(this.value);

            var min = $("<div class='command min'><span class='offscreen'>Min</span></div>");
            min.click(function (e) {self.min_range();e.stopPropagation();});
            main.append(min);
            var minus = $("<div class='command minus'><span class='offscreen'>Minus</span></div>");
            minus.click(function (e) {self.minus_range();e.stopPropagation();});
            main.append(minus);
            var plus = $("<div class='command plus'><span class='offscreen'>Plus</span></div>");
            plus.click(function (e) {self.plus_range();e.stopPropagation();});
            main.append(plus);
            var max = $("<div class='command max'><span class='offscreen'>Max</span></div>");
            max.click(function (e) {self.max_range();e.stopPropagation();});
            main.append(max);
            this.element.append(main);
            this.element.keypress(function (e) {
					e.stopPropagation();
					switch(e.keyCode) { 
					// User pressed "home" key
					case 36:
						self.max_range();
						break;
					// User pressed "end" key
					case 35:
						self.min_range();
						break;
					// User pressed "up" arrow
					case 38:
						self.plus_range();
						break;
					// User pressed "down" arrow
					case 40:
						self.minus_range();
						break;
					}
				});
            this._initValues(1);
        },

        _statsHandler: function(stats) {
            if (stats && stats.length > 0) {
                value = this._value2Percent(parseInt(stats[0].value));
                this.setValue(value);
            } else {
                this.setValue(null);
            }
        },
        
        _eventHandler: function(date, value) {
            value = this._value2Percent(parseInt(value));
            this.setValue(value);
        },

        _value2Percent: function(value) {
            console.log('value2Percent : ' + value + ' - ' + Math.round((value - this.min_value) * 100 / this.max_value));
            return Math.round((value - this.min_value) * 100 / this.max_value);
        },
        
        _percent2Value: function(value) {
            console.log('percent2Value : ' + value + ' - ' + Math.round((value * this.max_value / 100) + this.min_value));
            return Math.round((value * this.max_value / 100) + this.min_value);
        },
        
        setValue: function(value) {
            var self = this, o = this.options;
            if (value != null) {
                if (value >= 0 && value <= 100) {
                    this.currentValue = value;
                } else if (value < 0) {
                    this.currentValue = 0;
                } else if (value > 100) {
                    this.currentValue = 100;
                }
                this._processingValue = this.currentValue;
                this._displayValue(this.currentValue);
                this._displayRangeIndicator(this.currentValue);
            } else { // unknown
                this._processingValue = 0;
                this._displayValue(null);
                this._displayRangeIndicator(0);
            }
        },
        
        action: function() {
            var self = this, o = this.options;
            if (this._processingValue != this.currentValue) {
                this._startProcessingState();
                value = this._percent2Value(this._processingValue);
                rinor.put(['api', 'command', o.devicetechnology, o.deviceaddress], {"command":o.model_parameters.command, "value":value})
                    .done(function(data, status, xhr){
                        self.valid(o.featureconfirmation);
                    })
                    .fail(function(jqXHR, status, error){
                        self.cancel();
                        if (jqXHR.status == 400)
                            $.notification('error', jqXHR.responseText);
                    });
            }
        },
        
        plus_range: function() {
            var self = this, o = this.options;
			var value = this._processingValue + this.step;
			this._setProcessingValue(value);
            this._resetAutoSend();
		},
		
		minus_range: function() {
            var self = this, o = this.options;
			var value = this._processingValue - this.step;
			this._setProcessingValue(value);
            this._resetAutoSend();
		},
		
		max_range: function() {
            var self = this, o = this.options;
			this._setProcessingValue(100);
            this._resetAutoSend();
		},
		
		min_range: function() {
            var self = this, o = this.options;
			this._setProcessingValue(0);
            this._resetAutoSend();
		},
        
        _setProcessingValue: function(value) {
            var self = this, o = this.options;
			if (value >= 0 && value <= 100) {
				this._processingValue = value;
			} else if (value < 0) {
				this._processingValue = 0;
			} else if (value > 100) {
				this._processingValue = 100;
			}
            this._displayValue(this._processingValue);
            this._displayRangeIndicator(this._processingValue);
		},
        
        _displayValue: function(value) {
            var self = this, o = this.options;
            if (value != null) {
                this.value.html(value + '%');                
            } else { // Unknown
                this.value.html('---%');                                
            }
        },
        
        _displayRangeIndicator: function(percent) {
            var self = this, o = this.options;
            this.indicator.width((23*percent)/100 + "em");
        },
        
        cancel: function() {
            this.setValue(this.currentValue);
            this._stopProcessingState();
        },

        valid: function(confirmed) {
            this._stopProcessingState();
        },
        
        _startProcessingState: function() {
            this.value.addClass('processing');
            this.value.text('');
        },

        _stopProcessingState: function() {
            this.value.removeClass('processing');
        },

        _resetAutoSend: function() {
			var self = this;
			this.element.doTimeout( 'timeout', auto_send, function(){
				self.action();
			});	
		}
    });
})(jQuery);