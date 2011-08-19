var rinor = new RINOR();

function RINOR() {
}

RINOR.prototype.get = function(parameters) {
    var self = this;
    url = '/rinor/';
    // Build the RINOR url
    $.each(parameters, function(){
        url += encodeURIComponent(this) + '/';     
    });    
    return $.ajax({
            type: 'GET',
            url: url,
            data: null,
            dataType: "json"
        }).error(function(jqXHR, status, error){
            if (jqXHR.status == 500)
                $.notification('error', 'RINOR : ' + jqXHR.responseText + ' (' + url + ')');
        });
}

