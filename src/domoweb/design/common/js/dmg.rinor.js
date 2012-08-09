var rinor = new RINOR();

$(function(){
	$(window).bind('beforeunload', function () { rinor.cancelAll(); });
});

function RINOR() {
    this.uidcounter = 0;
    this.processing = new Array();
}

RINOR.prototype.send = function(type, parameters, data) {
    var self = this;
    var data_str = null;
    url = REST_URL + '/';
	
    // Build the RINOR url
    $.each(parameters, function(){
        url += encodeURIComponent(this) + '/';     
    });
    
    if (data) data_str = JSON.stringify(data);
    return $.ajax({
            type: type,
            url: url,
            data: data_str,
            processData:  false,
            contentType:  'application/json',
            dataType: "json",
            beforeSend: function(jqXHR, settings) {
                self.uid = self.register(jqXHR);
            }
        }).fail(function(jqXHR, status, error){
            if (jqXHR.status == 500) {
                if (jqXHR.responseText[0] == "{")
                    response = JSON.parse(jqXHR.responseText).error_message;
                else
                    response = jqXHR.responseText
                $.notification('error', 'RINOR : ' + response + ' <span class="url">(' + url + ')</span>');
            }
        }).always(function(jqXHR, textStatus) {
            self.unregister(self.uid);
        });
}

RINOR.prototype.get = function(parameters) {
    return this.send('GET', parameters, null);
}

RINOR.prototype.put = function(parameters, data) {
    return this.send('PUT', parameters, data);
}

RINOR.prototype.post = function(parameters, data) {
    return this.send('POST', parameters, data);
}

RINOR.prototype.delete = function(parameters) {
    return this.send('DELETE', parameters, null);
}

RINOR.prototype.register = function(jqXHR) {
    id = this.getuid();
    this.processing[id] = jqXHR;
    return id;
}

RINOR.prototype.unregister = function(id) {
    delete this.processing[id];
}

RINOR.prototype.getuid = function() {
    return this.uidcounter++;
}

RINOR.prototype.cancel = function(id) {
    if (id) {
        jqXHR = this.processing[id];
        if (jqXHR) {
            jqXHR.abort();
            this.unregister(id);
        }        
    }
}

RINOR.prototype.cancelAll = function() {
    for (var id in this.processing) {
        this.cancel(id);
    }
}

$.extend({
    URLEncode: function(c) {
        var o = '';
        var x = 0;
        c = c.toString();
        var r = /(^[a-zA-Z0-9_.]*)/;
        while (x < c.length) {
            var m = r.exec(c.substr(x));
            if (m != null && m.length > 1 && m[1] != '') {
                o += m[1];
                x += m[1].length;
            } else {
                if (c[x] == ' ') o += '+';
                else {
                    var d = c.charCodeAt(x);
                    var h = d.toString(16);
                    o += '%' + (h.length < 2 ? '0': '') + h.toUpperCase();
                }
                x++;
            }
        }
        return o;
    },
    
    URLDecode: function(s) {
        var o = s;
        var binVal, t;
        var r = /(%[^%]{2})/;
        while ((m = r.exec(o)) != null && m.length > 1 && m[1] != '') {
            b = parseInt(m[1].substr(1), 16);
            t = String.fromCharCode(b);
            o = o.replace(m[1], t);
        }
        return o;
    },

    getUrlVars: function(){
        var vars = [], hash;
        var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
        for(var i = 0; i < hashes.length; i++)
        {
            hash = hashes[i].split('=');
            vars.push(hash[0]);
            vars[hash[0]] = $.URLDecode(hash[1]);
        }
        return vars;
    },
  
    getUrlVar: function(name){
        return $.getUrlVars()[name];
    },

    reloadPage: function(data) {
        var newlocation = window.location.href.substring(0, window.location.href.indexOf('?'));
        newlocation += "?";
        $.each(data, function(key, value) {
            newlocation += key + "=" + value + "&";
        });
        window.location = newlocation;
    },

    loadPage: function(url, data) {
        var newlocation = url;
        newlocation += "?";
        $.each(data, function(key, value) {
            newlocation += key + "=" + value + "&";
        });
        window.location = newlocation;
    }
});