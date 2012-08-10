$(function(){
    var es = new EventSource(EVENTS_URL + '/');
    es.addEventListener('open', function (event) {
    }, false);
    es.addEventListener('message', function (event) {
        data = jQuery.parseJSON(event.data);
        $(document).trigger('dmg_event', data);
    }, true);
    es.addEventListener('error', function (event) {
    }, false);
    
	$(window).bind('beforeunload', function () {  es.close(); });
});

(function($) {    
    $.extend({
        initAssociations: function(page_id, device_usages, device_types) {
            $.each(data.objects, function(index, association) {
                var parameters_usage = $.stringToJSON(device_usages[association.feature.device.device_usage_id].default_options);
                var parameters_type = $.stringToJSON(association.feature.device_feature_model.parameters);
                var div = $("<div id='widget_" + association.id + "' role='listitem'></div>");
                var options = {
                    usage: association.feature.device.device_usage_id,
                    devicename: association.feature.device.name,
                    featurename: association.feature.device_feature_model.name,
                    devicetechnology: device_types[association.feature.device.device_type_id].device_technology_id,
                    deviceaddress: association.feature.device.address,
                    featureconfirmation: association.feature.device_feature_model.return_confirmation,
                    deviceid: association.feature.device_id,
                    key: association.feature.device_feature_model.stat_key,
                    usage_parameters: parameters_usage[association.feature.device_feature_model.feature_type][association.feature.device_feature_model.value_type],
                    model_parameters: parameters_type
                }
                $("#" + association.place_type + "_" + association.place_id + " ." + association.place).append(div);
                eval("$('#widget_" + association.id + "')." + association.widget + "(options)");
            });
        },

        stringToJSON: function(string) {
            var str = string;
            if (str) {
                // Decode HTML entites
                str = $('<div />').html(string).text();
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
