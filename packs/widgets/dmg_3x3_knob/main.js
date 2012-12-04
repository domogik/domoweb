(function($) {
    var colors = [
		'26e000','2fe300','37e700','45ea00','51ef00',
		'61f800','6bfb00','77ff02','80ff05','8cff09',
		'93ff0b','9eff09','a9ff07','c2ff03','d7ff07',
		'f2ff0a','fff30a','ffdc09','ffce0a','ffc30a',
		'ffb509','ffa808','ff9908','ff8607','ff7005',
		'ff5f04','ff4f03','f83a00','ee2b00','e52000'
	];
	
	var rad2deg = 180/Math.PI;
	var deg = 0;
	var numBars = 0, lastNum = -1;
    
    $.create_widget({
        // default options
        options: {
            version: 0.1,
            creator: 'Domogik',
            id: 'dmg_3x3_knob',
            name: 'Shiny Knob control',
            description: 'Based on https://github.com/martinaglv/KnobKnob',
            type: 'actuator.range',
            height: 3,
            width: 3,
            displayname: false,
			displayborder: false,
			screenshot: 'images/screenshot.png',
        },

        knob: null,
        knobTop: null,
        startDeg: -1,
        currentDeg: 0,
        previousValue: 0,
        rotation: 0,
        lastDeg: 0,
        doc: $(document),
        snap : 10,
        
        _init: function() {
            var self = this, o = this.options;
            this.min_value = parseInt(o.model_parameters.valueMin);
            this.max_value = parseInt(o.model_parameters.valueMax);

           	var bars = $("<div class='bars'></div>");

           	for(var i=0;i<colors.length;i++){		
                deg = i*12;
                // Create the colorbars
                $('<div class="colorBar">').css({
                    backgroundColor: '#'+colors[i],
                    transform:'rotate('+deg+'deg)',
                    top: -Math.sin(deg/rad2deg)*80+95,
                    left: Math.cos((180 - deg)/rad2deg)*80+89,
                }).appendTo(bars);
            }
           	this.colorBars = bars.find('.colorBar');
            control = $("<div class='control'></div>");
            bars.append(control);
            this.element.append(bars);

            var tpl = '<div class="knob">\
                    <div class="top"></div>\
                    <div class="base"></div>\
                </div>';
  
            control.append(tpl);

            this.knob = $('.knob', this.element);
            this.knobTop = this.knob.find('.top');

            this.knob.on('mousedown', function(e){
            
                e.preventDefault();
            
                var offset = self.knob.offset();
                var center = {
                    y : offset.top + self.knob.height()/2,
                    x: offset.left + self.knob.width()/2
                };
                
                var a, b, deg, tmp,
                    rad2deg = 180/Math.PI;
                
                self.knob.on('mousemove.rem',function(e){
                    
                    a = center.y - e.pageY;
                    b = center.x - e.pageX;
                    deg = Math.atan2(a,b)*rad2deg;
                    
                    // we have to make sure that negative
                    // angles are turned into positive:
                    if(deg<0){
                        deg = 360 + deg;
                    }
                    
                    // Save the starting position of the drag
                    if(self.startDeg == -1){
                        self.startDeg = deg;
                    }
                    
                    // Calculating the current rotation
                    tmp = Math.floor((deg-self.startDeg) + self.rotation);
                    
                    // Making sure the current rotation
                    // stays between 0 and 359
                    if(tmp < 0){
                        tmp = 360 + tmp;
                    }
                    else if(tmp > 359){
                        tmp = tmp % 360;
                    }
                    
                    // Snapping in the off position:
                    if(self.snap && tmp < self.snap){
                        tmp = 0;
                    }
                    
                    // This would suggest we are at an end position;
                    // we need to block further rotation.
                    if(Math.abs(tmp - self.lastDeg) > 180){
                        return false;
                    }
                    
                    self.currentDeg = tmp;
                    self.lastDeg = tmp;
        
                    self.knobTop.css('transform','rotate('+(self.currentDeg)+'deg)');
                    self._turn(self.currentDeg/359);
                });
            
                self.doc.on('mouseup.rem',function(){
                    self.knob.off('.rem');
                    self.doc.off('.rem');
                    
                    // Saving the current rotation
                    self.rotation = self.currentDeg;
                    
                    // Marking the starting degree as invalid
                    self.startDeg = -1;
                    self.action();
                });
            });
            
            this._initValues(1);
        },

        _turn: function(ratio){
            numBars = Math.round(this.colorBars.length*ratio);
            
            // Update the dom only when the number of active bars
            // changes, instead of on every move
            
            if(numBars == this.lastNum){
                return false;
            }
            this.lastNum = numBars;
            this.colorBars.removeClass('active').slice(0, numBars).addClass('active');
        },
        
        _statsHandler: function(stats) {
            if (stats && stats.length > 0) {
                this.setValue(parseInt(stats[0].value));
            } else {
                this.setValue(null);
            }
        },
        
        _eventHandler: function(timestamp, value) {
            this.setValue(parseInt(value));
        },

        action: function() {
            var self = this, o = this.options;
            this.processingValue = Math.round((this.rotation * this.max_value / 359) + this.min_value);
            this.element.removeClass('error valid').addClass('processing');
            rinor.put(['api', 'command', o.devicetechnology, o.deviceaddress], {"command":o.model_parameters.command, "value":this.processingValue})
                .done(function(data, status, xhr){
                    self.valid(o.featureconfirmation);
                })
                .fail(function(jqXHR, status, error){
                    self.cancel();
                    if (jqXHR.status == 400)
                        $.notification('error', jqXHR.responseText);
                });
        },

        setValue: function(value) {
            var self = this, o = this.options;
            if (value != null) {
                if(value >= this.min_value && value <= this.max_value){
                    this.previousValue = value;
                    value = (value - this.min_value) * 359 / this.max_value; // to degree
                    this.rotation = this.currentDeg = value;
                    this.knobTop.css('transform','rotate('+(this.currentDeg)+'deg)');
                    this._turn(this.currentDeg/359);
                }
            } else { // unknown
            }
        },

        cancel: function() {
            var self = this, o = this.options;
            this.setValue(this.previousValue);
            this.element.removeClass('processing').addClass('error');
        },

        /* Valid the processing state */
        valid: function(confirmed) {
            var self = this, o = this.options;
            this.element.removeClass('processing').addClass('valid');

            if (confirmed) {
//                this.element.displayStatusOk();
                this.previousValue = this.processingValue;
                this.processingValue = null;
            }
        }
    });
})(jQuery);