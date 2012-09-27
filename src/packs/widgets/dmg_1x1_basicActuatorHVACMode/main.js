(function($) {
    $.create_widget({
        // default options
        options: {
            version: 0.1,
            creator: 'Basilic',
            id: 'dmg_1x1_basicActuatorHVACMode',
            name: 'Basic widget HVACMode',
            description: 'Basic widget with border and name',
            type: 'actuator.list',
            height: 1,
            width: 1,
            displayname: true,
	    displayborder: true
        },

        _init: function() {
            var self = this, o = this.options;
            this.isOpen = false;
            this.element.addClass("icon32-usage-" + o.usage)
                .addClass('clickable')
                .processing();

            this._value =  $("<div class='value'></div>");
            this.element.append(this._value);                
            this._status = $.getStatus();
            this.element.append(this._status);

            this._panel = $.getPanel({width:190, height:190, circle: {start:140, end:90}});
            this.element.append(this._panel);
            this._panel.panelAddCommand({label:'Building protection', showlabel: false, className:'Building_protec', r:70, deg:20, rotate:true, click:function(e){self.building_protec();e.stopPropagation();}});
            this._panel.panelAddCommand({label:'Economy', showlabel: false, className:'economy', r:70, deg:-20, rotate:true, click:function(e){self.economy();e.stopPropagation();}});
            this._panel.panelAddCommand({label:'Close', showlabel: false, className:'close', r:70, deg:140, rotate:false, click:function(e){self.close();e.stopPropagation();}});
            this._panel.panelAddCommand({label:'Confort', showlabel: false, className:'confort', r:70, deg:-50, rotate:true, click:function(e){self.confort();e.stopPropagation();}});
            this._panel.panelAddCommand({label:'Stop', showlabel: false, className:'stop', r:70, deg:50, rotate:true, click:function(e){self.stopHV();e.stopPropagation();}});
            this._panel.panelAddText({className:'value', r:65, deg:90});
            this._panel.hide();
            this._indicator = $("<canvas class='indicator' width='190' height='190'></canvas>");
            this._panel.prepend(this._indicator);


            this.element.click(function (e) {self._onclick();e.stopPropagation();})
                .keypress(function (e) {if (e.which == 13 || e.which == 32) {self._onclick(); e.stopPropagation();}
                          else if (e.keyCode == 27) {self.close(); e.stopPropagation();}});

			this.element.keypress(function (e) {
					switch(e.keyCode) { 
					// User pressed "confort" key
					case 36:
						self.confort();
						break;
					// User pressed "stop" key
					case 35:
						self.stopHV();
						break;
					// User pressed "no freeze" arrow
					case 38:
						self.building_protec();
						break;
					// User pressed "eco" arrow
					case 40:
						self.economy();
						break;
					}
					e.stopPropagation();
				});
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
            }
        },
         
	close: function() {
            if (this.isOpen) {
                this.isOpen = false;
                this._panel.hide();              
            }
            this.element.doTimeout( 'timeout');
        },

	building_protec: function() {
        var self = this, o = this.options;
		rinor.put(['api', 'command', o.devicetechnology, o.deviceaddress], {"command":o.model_parameters.command, "value":o.model_parameters.commandValues[1]})
                    .done(function(data, status, xhr){
                        self.valid(o.featureconfirmation);
                    })
                    .fail(function(jqXHR, status, error){
                        self.cancel();
                        if (jqXHR.status == 400)
                            $.notification('error', jqXHR.responseText);
			});
		e.stopPropagation();
		},
		
	economy: function() {
        var self = this, o = this.options;
		rinor.put(['api', 'command', o.devicetechnology, o.deviceaddress], {"command":o.model_parameters.command, "value":o.model_parameters.commandValues[2]})
                    .done(function(data, status, xhr){
                        self.valid(o.featureconfirmation);
                    })
                    .fail(function(jqXHR, status, error){
                        self.cancel();
                        if (jqXHR.status == 400)
                            $.notification('error', jqXHR.responseText);
			});
		e.stopPropagation();
		},
		
	confort: function() {
            var self = this, o = this.options;
		rinor.put(['api', 'command', o.devicetechnology, o.deviceaddress], {"command":o.model_parameters.command, "value":o.model_parameters.commandValues[3]})
                    .done(function(data, status, xhr){
                        self.valid(o.featureconfirmation);
                    })
                    .fail(function(jqXHR, status, error){
                        self.cancel();
                        if (jqXHR.status == 400)
                            $.notification('error', jqXHR.responseText);
			});
		e.stopPropagation();
		},
		
	stopHV: function() {
            var self = this, o = this.options;
		rinor.put(['api', 'command', o.devicetechnology, o.deviceaddress], {"command":o.model_parameters.command, "value":o.model_parameters.commandValues[0]})
                    .done(function(data, status, xhr){
                        self.valid(o.featureconfirmation);
                    })
                    .fail(function(jqXHR, status, error){
                        self.cancel();
                        if (jqXHR.status == 400)
                            $.notification('error', jqXHR.responseText);
			});
		e.stopPropagation();
		},   

        
        setValue: function(value) {
            var self = this, o = this.options;         
            this.previousValue = value;
            if (value ==o.model_parameters.commandValues[3].toLowerCase()) {
               value="Comfort";
            } else if (value==o.model_parameters.commandValues[1].toLowerCase() ) {
               value="No-Frezze";
            } else if (value==o.model_parameters.commandValues[2].toLowerCase()) {
               value="Economy";
            } else if (value==o.model_parameters.commandValues[0].toLowerCase()){
               value="Standby";
            }
	    this._status.html(value); 
        },

        cancel: function() {
            var self = this, o = this.options;
            this.element.stopProcessingState();
            this.element.displayStatusError();
        },

    });
})(jQuery);
