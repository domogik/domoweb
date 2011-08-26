$(function(){
	$(window).bind('beforeunload', function () {  $.eventsource("close", "rinor-events"); });
});

(function($) {    
    $.extend({
        initAssociations: function(page_type, page_id, device_usages, device_types) {
            var devices = [];
            var options = null;
            if (page_type == 'house') {
                options = ['base', 'feature_association', 'listdeep', 'by-house']
            } else if (page_type == 'area') {
                options = ['base', 'feature_association', 'listdeep', 'by-area', page_id];
            } else { // room
                options = ['base', 'feature_association', 'list', 'by-room', page_id];
            }

            rinor.get(options)
                .success(function(data, status, xhr){
                    $.each(data, function(index, association) {
                        devices.push(association.device_feature.device_id);
                        rinor.get(['base', 'ui_config', 'list', 'by-reference', 'association', association.id])
                            .success(function(data, status, xhr){
                                var widget = null;
                                var place = null;
                                $.each(data, function(index, item) {
                                    if (item.key == 'widget') widget = item.value;
                                    if (item.key == 'place') place = item.value;
                                });
                                if (association.place_type == page_type || (association.place_type != page_type && place != 'otheractions')) {
                                    rinor.get(['base', 'feature', 'list', 'by-id', association.device_feature_id])
                                        .success(function(data, status, xhr){
                                            var feature = data[0];
                                            var parameters_usage = $.stringToJSON(device_usages[feature.device.device_usage_id].default_options);
                                            var parameters_type = $.stringToJSON(feature.device_feature_model.parameters);
                                            var div = $("<div id='widget_" + association.id + "' role='listitem'></div>");
                                            var options = {
                                                usage: feature.device.device_usage_id,
                                                devicename: feature.device.name,
                                                featurename: feature.device_feature_model.name,
                                                devicetechnology: device_types[feature.device.device_type_id].device_technology_id,
                                                deviceaddress: feature.device.address,
                                                featureconfirmation: feature.device_feature_model.return_confirmation,
                                                deviceid: feature.device_id,
                                                key: feature.device_feature_model.stat_key,
                                                usage_parameters: parameters_usage[feature.device_feature_model.feature_type][feature.device_feature_model.value_type],
                                                model_parameters: parameters_type
                                            }
                                            $("#" + association.place_type + "_" + association.place_id + " ." + place).append(div);
                                            eval("$('#widget_" + association.id + "')." + widget + "(options)");
                                        })
                                        .error(function(jqXHR, status, error){
                                            if (jqXHR.status == 400)
                                                $.notification('error', jqXHR.responseText);
                                        });
                                }
                            })
                            .error(function(jqXHR, status, error){
                                if (jqXHR.status == 400)
                                    $.notification('error', jqXHR.responseText);
                            });
                    });
                    devices = unique(devices);
                    if (devices.length > 0) $.eventRequest(devices);
                })
                .error(function(jqXHR, status, error){
                    if (jqXHR.status == 400)
                        $.notification('error', jqXHR.responseText);
                });
        },
        
        eventRequest: function(devices) {            
            $.eventsource({
                label: "rinor-events",
                url: "/rinor/events/" + devices.join('/') + '/',
                dataType: "json",
                open: function() {        
                },
                message: function( data ) {
                        $(document).trigger('dmg_event', data);
                }
            });   
        },
        
        stringToJSON: function(string) {
            var str = string;
            if (str) {
                str = string.replace(/&quot;/g,'"');
            } else {
                str = '{}';
            }
            return JSON.parse(str);
        }
    });
})(jQuery);

function unique(a) {
    var r = new Array();
    o: for (var i = 0,
    n = a.length; i < n; i++) {
        for (var x = 0,
        y = r.length; x < y; x++) {
            if (r[x] == a[i]) continue o;
        }
        r[r.length] = a[i];
    }
    return r;
}
