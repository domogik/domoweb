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
