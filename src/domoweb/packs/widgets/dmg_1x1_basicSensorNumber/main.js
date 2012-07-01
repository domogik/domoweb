(function($) {
    $.create_widget({
        // default options
        options: {
            version: 0.1,
            creator: 'Domogik',
            id: 'dmg_1x1_basicSensorNumber',
            name: 'Basic widget',
            description: 'Basic widget with border and name',
            type: 'sensor.number',
            height: 1,
            width: 1,
            displayname: true,
			displayborder: true
        },

        graph: null,
        graph_options: null,
        now : null,
        
        _init: function() {
            var self = this, o = this.options;
            
            if (!o.model_parameters.unit) o.model_parameters.unit = ''; // if unit not defined, display ''
            
            this.element.addClass("icon32-usage-" + o.usage)
                .addClass('clickable');
            this._value =  $("<div class='value'></div>");
            this.element.append(this._value);

            this._status = $.getStatus();
            this.element.append(this._status);
            
            this._panel = $.getPanel({width:190, height:190, circle: {start:140, end:90}});
            this.element.append(this._panel);
            this._panel.panelAddCommand({label:'Close', showlabel: false, className:'close', r:70, deg:140, rotate:false, click:function(e){self.close();e.stopPropagation();}});
            this._panel.panelAddCommand({label:'Charts', showlabel: true, className:'graph', r:70, deg:-30, rotate:false, click:function(e){self.open_graph();e.stopPropagation();}});
            this._panel.hide();
            
            this.element.click(function (e) {self._onclick();e.stopPropagation();})
                .keypress(function (e) {if (e.which == 13 || e.which == 32) {self._onclick(); e.stopPropagation();}
                          else if (e.keyCode == 27) {self.close(); e.stopPropagation();}});
                
            this._initValues(1);
        },

        _statsHandler: function(stats) {
            if (stats && stats.length > 0) {
                this.setValue(parseFloat(stats[0].value));
            } else {
                this.setValue(null);
            }
        },
        
        _eventHandler: function(timestamp, value) {
            this.setValue(parseFloat(value));
        },

        setValue: function(value) {
            var self = this, o = this.options;
            if (value !== null && value !== '') {
                this.element.displayIcon('known');             
                this._value.html(value + '<br />' + o.model_parameters.unit)
                if (this.previousValue) {
                    if (value == this.previousValue) {
                        this._status.attr('class', 'widget_status icon8-status-equal')
                        this._status.html("<span class='offscreen'>linear</span>");
                    } else if (value > this.previousValue) {
                        this._status.attr('class', 'widget_status icon8-status-up')
                        this._status.html("<span class='offscreen'>going up</span>");
                    } else {
                        this._status.attr('class', 'widget_status icon8-status-down')
                        this._status.html("<span class='offscreen'>going down</span>");
                    }
                }
            } else { // Unknown
                this.element.displayIcon('unknown');             
                this._value.html('--<br />' + o.model_parameters.unit)
            }
            this.previousValue = value;
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
            }
        },

        close: function() {
            if (this.isOpen) {
                this.isOpen = false;
                this._panel.hide();           
            }
            this.element.doTimeout( 'timeout');
        },

        open_graph: function() {
            var self = this, o = this.options;
            this.close();

            var dialog = $("<div id='dialog' title='Charts'><ul id='dialog-nav'></ul><div id='dialog-graph' style='width:100%;height:100%;'></div></div>");
            var year = $("<li class='btyear'><button>Year</button></li>");
            year.click(function() {
                self.show_graph('year', 0);
            });
            var month = $("<li class='btmonth'><button>Month</button></li>");
            month.click(function() {
                self.show_graph('month', 0);
            });
            var week = $("<li class='bt7d'><button>Last 7 days</button></li>");
            week.click(function() {
                self.show_graph('7d', 0);
            });
            var day = $("<li class='bt24h'><button>Last 24 hours</button></li>");
            day.click(function() {
                self.show_graph('24h', 0);
            });            
            var hhour = $("<li class='bt8h'><button>Last 8 hours</button></li>");
            hhour.click(function() {
                self.show_graph('8h', 0);
            });



            var previous = $("<li class='previous'><button disabled='disabled'>Previous</button></li>");
            var next = $("<li class='next'><button disabled='disabled'>Next</button></li>");

            dialog.find('#dialog-nav')
                .append(previous)
                .append(next)
                .append(year)
                .append(month)
                .append(week)
                .append(day)
                .append(hhour);

            $('body').append(dialog);
            dialog.dialog({ width:'90%',
                position: ['middle', 50],
                resizable: false,
                modal: true,
                close: function(ev, ui) {
                    $(this).remove();
                }
            });
            day.find('button').focus();
            this.show_graph('24h', 0);
        },
        
        show_graph: function(type, shift) {
            var self = this, o = this.options;
            chart.highcharts.reset();
            $('#dialog-nav button').attr('disabled', 'disabled');
            $('#dialog-nav button.active').removeClass('active');
            $('#dialog-nav li.bt' + type + ' button').addClass('active');
            
            $('#dialog-nav li.previous button').unbind('click').click(function() {
                self.show_graph(type, shift+1);
            });
            if (shift > 0) {
                $('#dialog-nav li.next button').unbind('click').click(function() {
                    self.show_graph(type, shift-1);
                });
            }
            chart.highcharts.show({
                device_id: o.deviceid,
                key: o.key,
                name: o.featurename,
                unit: o.model_parameters.unit,
                type: type,
                shift: shift
            }).always(function(){
                $('#dialog-nav button').removeAttr('disabled');
                if (shift == 0) $('#dialog-nav li.next button').attr('disabled', 'disabled');
            });
        },
    });
})(jQuery);
