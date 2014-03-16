function getHostsList() {
	$("#hosts_list li").remove();
    
    rinor.get(['api', 'host'])
        .done(function(data, status, xhr){
                if (data.meta.total_count > 0) { // If a least 1 plugin is enabled
                    $.each(data.objects, function() {
                        var li = $("<li></li>");
                        var a = $("<a>" + this.id + "</a>");
                        a.attr('href', ADMIN_URL + '/host/' + this.id);
                        if (this.primary == "True")
                            a.addClass('icon16-status-primary');
                        li.append(a);
                        $("#hosts_list").append(li);	
                    });
                } else {
                    var li = $("<li></li>");
                    var a = $("<a>" + gettext('No hosts') + "<br />" + gettext('Click to reload') + "</a>");
                    a.attr('href', '#');
                    a.addClass("icon16-status-error");
                    a.click(function(){getHostsList();})
                    li.append(a);
                    $("#hosts_list").append(li);
                }                    
        })
        .fail(function(jqXHR, status, error){
            var li = $("<li></li>");
            var a = $("<a>" + jqXHR.responseText + "<br />" + gettext('Click to reload') + "</a>");
            a.attr('href', '#');
            a.addClass("icon16-status-error");
            a.click(function(){getHostsList();})
            li.append(a);
            $("#hosts_list").append(li);	
        });
}

