$(function(){    
    $('#dialog').dialog({ width:'auto',
        position: ['middle', 100],
        resizable: true,
        modal: false
    });

    $("li#showmenu a").click(function(){
        $("#panel").toggle();      
    });
    $("li#showmodels a").click(function(){
        $('#dialog').dialog('open');
    });
    
    $('.features, #widgets ul, #model dl').hide();
    
    $('button.device').click(function() {
        $('button.device, button.feature').removeClass('selected');
        $(this).addClass('selected');
        $('.features, #widgets ul, #model dl').hide();
        var deviceid = $(this).attr('deviceid');
        $('#features' + deviceid).show().focus();
    });
    
    $("button.feature").click(function(){
        $('button.feature').removeClass('selected');
        $(this).addClass('selected');
        var featuretype = $(this).attr('featuretype');
        var featureid = $(this).attr('featureid');
        var featuremodel = $(this).attr('featuremodel');
        var featurename = $(this).attr('featurename');
        var devicename = $(this).attr('devicename');
        $("#model dl").hide();
        $("#widgets ul").widget_models({
            featuretype: featuretype,
            featureid: featureid,
            featuremodel: featuremodel,
            featurename: featurename,
            devicename: devicename
        });
        $("#widgets ul").show();
    });

});

(function($) {
    
    function ondrop(event, ui) {
        var helper = ui.draggable.draggable( "option", "helper" );
        var item = null;
        if (helper == 'clone') {
            item = $(ui.helper).clone();
            item.removeAttr('style');
            $(this).append(item);
            item.widget_shape({
                widgetid: ui.draggable.data('widgetid'),
                featureid: ui.draggable.data('featureid'),
                featurename: ui.draggable.data('featurename'),
                devicename: ui.draggable.data('devicename'),
                associationid: ui.draggable.data('associationid'),
                widgetwidth: ui.draggable.data('widgetwidth'),
                widgetheight: ui.draggable.data('widgetheight'),

                draggable:{
                    helper: false,
                    revert: 'invalid',
                    drag: ondrag,
                    stop: onstop
                },
                deletable: true
            });            
            $.addAssociation(item, $(this));            
        } else {
            item = ui.draggable.detach();
            item.removeAttr('style');
            $(this).append(item);
            $.moveAssociation(item, $(this));            
        }
        return false;
    }
    
    function onstop(event, ui) {
        $(".ui-dialog").show();
    }
    
    function ondrag(event, ui) {
        $(".ui-dialog").hide();
    }
    
    $.fn.extend({
	    displayName: function(){
            _devicename = $("<div class='identity identitydevice length" + this.data('widgetwidth') + "'>" + this.data('devicename') + "</div>");
            this.append(_devicename);
            _featurename = $("<div class='identity identityfeature length" + this.data('widgetheight') + "'>" + this.data('featurename') + "</div>");
            this.append(_featurename);
        },
        hasSize: function(width, height) {
            var id = this.data('widgetid');
            if (id) {
                var woptions = get_widgets_options(id)
                return (width == woptions.width && height == woptions.height);                
            } else {
                return false;
            }
        },
        deletable: function() {
            var self = this;
            this.addClass('deletable')
                .append("<button class='icon16-action-remove'><span class='offscreen'>" + gettext('Remove') + "</span></button>")
                .find('button').click(function(){
                        var association_id = self.data('associationid');
                        if (association_id) {
                            rinor.delete(['api', 'association', association_id])
                                .done(function(data, status, xhr){
                                    self.remove();                    
                                })
                                .fail(function(jqXHR, status, error){
                                    if (jqXHR.status == 400)
                                        $.notification('error', jqXHR.responseText);
                                });
                        }
                });
        }
	});
    
    /* Mini Widget */
    $.ui.widget.subclass("ui.widget_models", {
        // default options
        options: {
        },

        _init: function() {
            var self = this, o = this.options;
            this.element.empty();
            var widgets = get_widgets(o.featuretype);
            $.each(widgets, function(index, id) {
                var woptions = get_widgets_options(id);
                if (matchFilter(woptions.filters, o.featuremodel)) {
                    var widget = $("<li><button class='widget'>" + woptions.name + "</button></li>");
                    widget.find('button').click(function() {
                        $('.widget').removeClass('selected');
                        $(this).addClass('selected');
                        $('#model').widget_model({
                            widgetid: id,
                            widgetwidth: o.width,
                            widgetheight: o.height,
                            featureid: o.featureid,
                            featurename: o.featurename,
                            devicename: o.devicename
                        });
                        $("#model dl").show();
                    });
                    self.element.append(widget); 
                }
            });
        },
	
        update: function() {
            this._init();
        }
    });
    
    $.ui.widget.subclass("ui.widget_model", {
        // default options
        options: {
        },

        _init: function() {
            var self = this, o = this.options;
            var woptions = get_widgets_options(o.widgetid)
            if (woptions) {
                o = $.extend ({}, woptions, o);
            }
            this.element.find('dt.model').text(woptions.name);
            this.element.find('dd.version').text(woptions.version);
            this.element.find('dd.author').text(woptions.creator);
            this.element.find('dd.description').text(woptions.description);
            if (woptions.screenshot) {
                this.element.find('dd.screenshot').html("<img src='/widgets/" + woptions.id + "/" + woptions.screenshot + "' />");
            } else {
                this.element.find('dd.screenshot').empty();                
            }
            var model = $('<div></div>');
            model.widget_shape({
                widgetid: o.widgetid,
                widgetwidth: o.width,
                widgetheight: o.height,
                featureid: o.featureid,
                featurename: o.featurename,
                devicename: o.devicename,
                draggable: {
                    helper: "clone",
                    revert: 'invalid',
                    appendTo: 'body',
                    drag: ondrag,
                    stop: onstop
                }
            });
            this.element.find('dd.model')
                .empty()
                .append(model);
        }
    });
    
    $.ui.widget.subclass("ui.widget_shape", {
        // default options
        options: {
            deletable: false
        },

        _init: function() {
            var self = this, o = this.options;
            var woptions = get_widgets_options(o.widgetid)
            if (woptions) {
                o = $.extend ({}, woptions, o);
            }
            this.element.addClass('shape');
            this.element.removeAttr('style');
            this.element.attr('role', 'listitem');
			this.element.addClass('size' + o.width + 'x' + o.height);
            this.element.attr("tabindex", 0);
            this.element.empty();
            this.element.append("<div class='sizetext'>" + o.width + 'x' + o.height + "</div>");
            this.element.data({
                'devicename':o.devicename,
                'featurename':o.featurename,
                'featureid':o.featureid,
                'widgetwidth': o.width,
                'widgetheight':o.height,
                'widgetid': o.widgetid,
                'associationid': o.associationid
            });
            this.element.displayName();
            this.element.draggable(o.draggable);
            if (o.deletable) this.element.deletable();            
        }
    });
 
    $.extend({
        addAssociation: function(model, zone) {
            var page_type = zone.data('page_type');
            var page_id = zone.data('page_id');
            var place_id = zone.data('place');
            var widget_id = model.data('widgetid');
            var feature_id = model.data('featureid');
            rinor.post(['api', 'association'], {"page_type":page_type, "feature_id":feature_id, "page_id":page_id, "widget_id":widget_id, "place_id":place_id})
                .done(function(data, status, xhr){
                    model.data('associationid', data.id);
                })
                .fail(function(jqXHR, status, error){
                    if (jqXHR.status == 400)
                        $.notification('error', jqXHR.responseText);
                });
        },

        moveAssociation: function(model, zone) {
            var place_id = zone.data('place');
            var association_id = model.data('associationid');
            rinor.post(['api', 'uiconfig'], {"name":"association", "reference":association_id, "key":"place", "value":place_id})
                .done(function(data, status, xhr){
                })
                .fail(function(jqXHR, status, error){
                    if (jqXHR.status == 400)
                        $.notification('error', jqXHR.responseText);
                });
        },
        
        initAssociations: function(page_type, page_id) {
            $('.maininfo').droppable({
                    activeClass: 'state-active',
                    hoverClass: 'state-hover',
                    accept: function(draggable) {
                        return (($(".model", this).length  < 1) && draggable.hasSize(1, 1));
                    },
                    drop: ondrop
            })
                .data({'place':'maininfo','page_type': page_type,'page_id':page_id});

            
            $('.mainactions').droppable({
                    activeClass: 'state-active',
                    hoverClass: 'state-hover',
                    accept: function(draggable) {
                        return (($(".model", this).length  < 4) && draggable.hasSize(1, 1));
                    },
                    drop: ondrop
            })
                .data({'place':'mainactions','page_type': page_type,'page_id':page_id});
            
            $('.otheractions').droppable({
                    activeClass: 'state-active',
                    hoverClass: 'state-hover',
                    accept: function(draggable) {
                        return (draggable.hasClass('shape'));
                    },
                    drop: ondrop
            })
                .data({'place':'otheractions','page_type': page_type,'page_id':page_id});
    
            var options = null;
            if (page_type == 'house') {
                options = ['api', 'association', 'house']
            } else {
                options = ['api', 'association', page_type, page_id];
            }
            
            rinor.get(options)
                .done(function(data, status, xhr){
                    $.each(data.objects, function(index, association) {
                        var model = $("<div id='" + association.id + "' role='listitem'></div>");
                        model.widget_shape({
                            widgetid: association.widget,
                            featureid: association.device_feature_id,
                            featurename: association.feature.device_feature_model.name,
                            devicename: association.feature.device.name,
                            associationid: association.id,
                            draggable: {
                                helper: false,
                                revert: 'invalid',
                                drag: ondrag,
                                stop: onstop
                            },
                            deletable: true
                        });
                        $("." + association.place).append(model);
                    });
                })
                .fail(function(jqXHR, status, error){
                    if (jqXHR.status == 400)
                        $.notification('error', jqXHR.responseText);
                });                
        }
    });
    
    function matchFilter(filters, id) {
        var res = false;
        if (filters) {
            $.each(filters, function(index, filter){
                var afilter = filter.split('.');
                var aid = id.split('.');
                res =  (afilter[0] == aid[0] || afilter[0] == '*') && (afilter[1] == aid[1] || afilter[1] == '*') && (afilter[2] == aid[2] || afilter[2] == '*');
            });
        } else {
            res = true;
        }
        return res;
    }
})(jQuery);