var rest = new REST();

$(function(){
	$(window).bind('beforeunload', function () { rest.cancelAll(); });
});

function REST() {
    this.uid = 0;
    this.processing = new Array();
}

REST.prototype.get = function(parameters, callback) {
    var self = this;
    url = rest_url + '/';
    // Build the REST url
    $.each(parameters, function(){
        url += encodeURIComponent(this) + '/';     
    });
    return this.jsonp(url, callback,
                      function(xOptions, textStatus) {$.notification('error', 'REST communication : ' + textStatus + ' (' + url + ')');}
            );
}

REST.prototype.jsonp = function(url, successCallback, errorCallback) {
    var self = this;
    return $.jsonp({
        cache: false,
        type: "GET",
        url: url,
        dataType: "jsonp",
        callback: "_" + self.getuid(),
        callbackParameter: "callback",
        beforeSend: function(xOptions) {
            self.register(xOptions);
        },
        complete: function(xOptions) {
            self.unregister(xOptions);
        },
        success:
            successCallback,
        error:
            errorCallback
    });
}

REST.prototype.register = function(xOptions) {
    this.processing[xOptions.callback] = xOptions;
    return xOptions.callback;
}

REST.prototype.unregister = function(xOptions) {
    delete this.processing[xOptions.callback];
}

REST.prototype.getuid = function() {
    return this.uid++;
}

REST.prototype.cancel = function(id) {
    if (id) {
        xOptions = this.processing[id];
        if (xOptions) {
            xOptions.abort();
            this.unregister(id);
        }        
    }
}

REST.prototype.cancelAll = function(id) {
    for (var i in this.processing) {
        this.processing[i].abort();
    }
}