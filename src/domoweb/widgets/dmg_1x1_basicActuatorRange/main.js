(function($) {
    $.create_widget({
        // default options
        options: {
            version: 0.1,
            creator: 'Domogik',
            id: 'dmg_1x1_basicActuatorRange',
            name: 'Basic widget',
            description: 'Basic widget with border and name',
            type: 'actuator.range',
            height: 1,
            width: 1,
            displayname: true,
			displayborder: true
        },

        _init: function() {
            var self = this, o = this.options;
            this.isOpen = false;
            this.min_value = parseInt(o.model_parameters.valueMin);
            this.max_value = parseInt(o.model_parameters.valueMax);
            this.step = parseInt(o.usage_parameters.step);
            this.unit = o.usage_parameters.unit
            if (this.unit == '%') {
                this.modePercent = true;
                this.displayMin = 0;
                this.displayMax = 100;
            } else {
                this.modePercent = false;
                this.displayMin = this.min_value;
                this.displayMax = this.max_value;            
            }
            this.element.addClass("icon32-usage-" + o.usage)
                .addClass('clickable')
                .processing();
                
            this._panel = $.getPanel({width:190, height:190, circle: {start:140, end:90}});
            this.element.append(this._panel);
            this._panel.panelAddCommand({label:'Increase', showlabel: false, className:'increase', r:70, deg:-20, rotate:true, click:function(e){self.plus_range();e.stopPropagation();}});
            this._panel.panelAddCommand({label:'Decrease', showlabel: false, className:'decrease', r:70, deg:20, rotate:true, click:function(e){self.minus_range();e.stopPropagation();}});
            this._panel.panelAddCommand({label:'Close', showlabel: false, className:'close', r:70, deg:140, rotate:false, click:function(e){self.close();e.stopPropagation();}});
            this._panel.panelAddCommand({label:'Max', showlabel: false, className:'max', r:70, deg:-50, rotate:true, click:function(e){self.max_range();e.stopPropagation();}});
            this._panel.panelAddCommand({label:'Min', showlabel: false, className:'min', r:70, deg:50, rotate:true, click:function(e){self.min_range();e.stopPropagation();}});
            this._panel.panelAddText({className:'value', r:65, deg:90});
            this._panel.hide();
            this._indicator = $("<canvas class='indicator' width='190' height='190'></canvas>");
            this._panel.prepend(this._indicator);

            this._status = $.getStatus();
            this.element.append(this._status);

            this.element.click(function (e) {self._onclick();e.stopPropagation();})
                .keypress(function (e) {if (e.which == 13 || e.which == 32) {self._onclick(); e.stopPropagation();}
                          else if (e.keyCode == 27) {self.close(); e.stopPropagation();}});

			this.element.keypress(function (e) {
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
					e.stopPropagation();
				});
            this.setValue(null);
            this._initValues(1);
        },

        _statsHandler: function(stats) {
            if (stats && stats.length > 0) {
                if (this.modePercent) {
                    value = this._value2Percent(parseInt(stats[0].value));
                } else {
                    value = stats[0].value;
                }
                this.setValue(value);
            } else {
                this.setValue(null);
            }
        },
        
        _eventHandler: function(timestamp, value) {
            if (this.modePercent) {
                value = this._value2Percent(parseInt(value));
            }
            this.setValue(value);
        },

        _value2Percent: function(value) {
            return Math.round((value - this.min_value) * 100 / this.max_value);
        },
        
        _percent2Value: function(value) {
            return Math.round((value * this.max_value / 100) + this.min_value);
        },


        action: function() {
            var self = this, o = this.options;
            if (this._processingValue != this.currentValue) {
                this.element.startProcessingState();
                if (this.modePercent) {
                    value = this._percent2Value(this._processingValue);
                } else {
                    value = this._processingValue;
                }
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

        _onclick: function() {
            var self = this, o = this.options;
            if (this.isOpen) {
                this.close();
            } else {
                this.open();
            }
        },

        open: function() {
            if (!this.isOpen) {
                this.isOpen = true;
                this._panel.show();  
                this.element.doTimeout( 'timeout', close_without_change, function(){
                    self.close();
                });
                this._processing_percent_current = 0;
                this._setProcessingValue(this._processingValue);
            }
        },
            
        close: function() {
            if (this.isOpen) {
                this.isOpen = false;
                this._panel.hide();              
                this.setValue(this.currentValue);
            }
            this.element.doTimeout( 'timeout');
        },
        
        setValue: function(value) {
            var self = this, o = this.options;
            if (value != null) {
                if (value >= this.displayMin && value <= this.displayMax) {
                    this.currentValue = value;
                } else if (value < this.displayMin) {
                    this.currentValue = this.displayMin;
                } else if (value > this.displayMax) {
                    this.currentValue = this.displayMax;
                }
                this._processingValue = this.currentValue;
                this.element.displayIcon('value_' + findRangeIcon(o.usage, this.currentValue));
                this._displayValue(this.currentValue);
            } else { // unknown
                this._processingValue = 0;
                this.element.displayIcon('unknown');
                this.currentValue = this.displayMin;
                this._displayValue(null);
            }
        },

		plus_range: function() {
            var self = this, o = this.options;
            if (this.step) {
                step = this.step;
            } else {
                step = 1;
            }
  			var value = parseInt(this._processingValue) + step;
      		this._resetAutoClose();
			this._setProcessingValue(value);
		},
		
		minus_range: function() {
            var self = this, o = this.options;
            if (this.step) {
                step = this.step;
            } else {
                step = 1;
            }
			var value = parseInt(this._processingValue) - step;
      		this._resetAutoClose();
			this._setProcessingValue(value);
		},
		
		max_range: function() {
            var self = this, o = this.options;
      		this._resetAutoClose();
			this._setProcessingValue(this.displayMax);
		},
		
		min_range: function() {
            var self = this, o = this.options;
      		this._resetAutoClose();
			this._setProcessingValue(this.displayMin);
		},
		
		_resetAutoClose: function() {
			var self = this;
			this.element.doTimeout( 'timeout', close_with_change, function(){
				self.action();
                self.close();
			});	
		},
        
        _displayValue: function(value) {
            var self = this, o = this.options;
            if (value != null) {
    			this._status.writeStatus(value + this.unit);                
            } else { // Unknown
    			this._status.writeStatus('---' + this.unit);                                
            }
        },
        
		_setProcessingValue: function(value) {
            var self = this, o = this.options;
			if (value >= this.displayMin && value <= this.displayMax) {
				this._processingValue = value;
			} else if (value < this.displayMin) {
				this._processingValue = this.displayMin;
			} else if (value > this.displayMax) {
				this._processingValue = this.displayMax;
			}
            $('.value', this._panel).html(this._processingValue + this.unit);
            this._displayProcessingRange(this._processingValue);
		},

        _displayProcessingRange: function(percent) {
            var self = this, o = this.options;
            this._processing_percent_final = percent;
            if (!this._processing_animation) {
                this._animateProcessingRange();
            }
        },

        _animateProcessingRange: function() {
            var self = this, o = this.options;
            this._processing_animation = true;
            if (this._processing_percent_final < this._processing_percent_current) {
                this._processing_percent_current--;
            } else if (this._processing_percent_final > this._processing_percent_current) {
                this._processing_percent_current++;                
            }
            var canvas = this._indicator.get(0);
            if (canvas.getContext){
                var ctx = canvas.getContext('2d');
                canvas.width = canvas.width; //reset
                ctx.beginPath();
                ctx.clearRect(0,0, canvas.width, canvas.height);

                if (this._processing_percent_current > 0) {
                    ctx.lineWidth = 11;
                    ctx.strokeStyle = "#BDCB2F";
                    var deg = (((this._processing_percent_current-this.displayMin) * 360) / (this.displayMax-this.displayMin)) - 90;
                    var angle = (Math.PI/180) * deg; // radian
                    ctx.arc(95,95,46,(Math.PI/2),-angle, true);
                    ctx.stroke();                
                }
            }
            if (this._processing_percent_final == this._processing_percent_current) { // End animation
                this._processing_animation = false;
            } else {
                setTimeout(function() {self._animateProcessingRange();}, 5);
            }
        },
        
        cancel: function() {
            var self = this, o = this.options;
            this.setValue(this.currentValue);
            this.element.stopProcessingState();
            this.element.displayStatusError();
        },

        /* Valid the processing state */
        valid: function(confirmed) {
            var self = this, o = this.options;
            this.element.stopProcessingState();
            if (confirmed) {
                this.element.displayStatusOk();
                this.element.doTimeout( 'resetStatus', state_reset_status, function(){
                    self._status.displayResetStatus();
                });
            } else {
                self._status.displayResetStatus();                
            }
        }
    });
})(jQuery);