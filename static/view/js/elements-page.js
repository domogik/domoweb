function ondrop(event, ui) {
    if ($(this).attr('id') == 'widgetsmatrix') {
	var helper = ui.draggable.draggable( "option", "helper" );
	var item = null;
	item = $(ui.helper).clone();
	item.removeAttr('style');
    
	$(this).append(item);
	var randomnumber=Math.floor(Math.random()*10001)
	id = 'n' + randomnumber;
	item.data('instanceid', id);
	item.attr('id', "widgetinstance_" + id);
	item.append('<input type="hidden" name="instance[' + id + '][featureid]" value="' + ui.draggable.data('featureid') + '" />');	    
	item.append('<input type="hidden" name="instance[' + id + '][featuretype]" value="' + ui.draggable.data('featuretype') + '" />');	    
	item.append('<input type="hidden" name="instance[' + id + '][widgetid]" value="' + ui.draggable.data('widgetid') + '" />');	    
    
	$('#configpanel').append("<article id='configinstance_" + id + "' style='display: none'> \
				<h2>Widget " + id + " parameters</h2> \
				<p><a href='#' class='remove_widget' data-instanceid='" + id + "' role='button'>Remove</a><p> \
			    	<div class='content'></div> \
				</article>");
	
	$('#configinstance_' + id + ' .content').load(VIEW_URL + "/elements/widgetparams/" + id + "/" + ui.draggable.data('featureid') + "/" + ui.draggable.data('featuretype'));
    }
    return false;
}

function onstop(event, ui) {
    $(".ui-dialog").show();
}

function ondrag(event, ui) {
    $(".ui-dialog").hide();
}
	
$(function(){    
    $('#dialog').dialog({ width:'auto',
        position: ['middle', 100],
        resizable: true,
        modal: true,
	draggable: false,
    });

    $("a#showwidgets").click(function(){
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
    $.fn.extend({
        hasSize: function(width, height) {
            var id = this.data('widgetid');
            if (id) {
                var woptions = get_widgets_options(id)
                return (width == woptions.width && height == woptions.height);                
            } else {
                return false;
            }
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
                if (matchFilter(woptions.filters, o.featuretype)) {
                    var widget = $("<li><button class='widget'>" + woptions.name + "</button></li>");
                    widget.find('button').click(function() {
                        $('.widget').removeClass('selected');
                        $(this).addClass('selected');
                        $('#model').widget_model({
                            widgetid: id,
                            widgetwidth: o.width,
                            widgetheight: o.height,
                            featureid: o.featureid,
                            featuretype: o.featuretype,
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
                this.element.find('dd.screenshot').html("<img src='" + STATIC_WIDGETS_URL + "/" + woptions.id + "/" + woptions.screenshot + "' />");
            } else {
                this.element.find('dd.screenshot').empty();                
            }
            var model = $('<div></div>');
            model.widget_shape({
                widgetid: o.widgetid,
                widgetwidth: o.width,
                widgetheight: o.height,
                featureid: o.featureid,
                featuretype: o.featuretype,
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
            this.element.append("<div class='sizetext'>" + o.width + 'x' + o.height + "</div>");
             this.element.data({
                'featureid':o.featureid,
                'featuretype':o.featuretype,
                'widgetid': o.widgetid,
            });
            this.element.append("<div class='identity identitydevice length" + o.width + "'>" + o.devicename + "</div>");
            this.element.append("<div class='identity identityfeature length" + o.height + "'>" + o.featurename + "</div>");

            if (o.draggable) this.element.draggable(o.draggable);
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