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

function getPluginsList() {
	$("#plugins_list li").remove();
    
    rinor.get(['api', 'plugin'])
        .done(function(data, status, xhr){
            if (data.objects && data.objects.length > 0) { // If a least 1 host exist
                var plugin_count = 0;
                $.each(data.objects, function() {
                    var host = this.host;
                    $.each(this.list, function() {
                        plugin_count++;
                        var technology = this.technology.replace(' ', '');
                        if ($("#plugins_list ul#menu_" + technology).length == 0) {
                            $("#plugins_list").append("<li><div class='titlenav2 icon16-technology-" + technology + "'>" + technology + "</div><ul id='menu_" + technology + "'></ul></li>")
                        }
                        var li = $("<li class='" + this.type + "'></li>");
                        var a = $("<a></a>");
                        a.attr('href', ADMIN_URL + '/plugin/' + host + "/" + this.id + "/" + this.type);
                        var status = $("<div><div class='host'>" + host + "</div>" + this.id + "</div>");
                        status.addClass("menu-indicator")
                        if (this.id != 'rest') {
                            if (this.status == 'ON') {
                                if (this.type == 'plugin') {
                                    status.addClass("icon16-status-plugin-up");
                                    status.append("<span class='offscreen'>" + gettext('Plugin Running') + "</span>");                                    
                                } else { // external
                                    status.addClass("icon16-status-external-up");
                                    status.append("<span class='offscreen'>" + gettext('External member Running') + "</span>");                                                                        
                                }
                            } else {
                                if (this.type == 'plugin') {
                                    status.addClass("icon16-status-plugin-down");
                                    status.append("<span class='offscreen'>" + gettext('Plugin Stopped') + "</span>");
                                } else { // external
                                    status.addClass("icon16-status-external-down");
                                    status.append("<span class='offscreen'>" + gettext('External member Stopped') + "</span>");
                                }
                            }
                        }
                        a.append(status);
                        li.append(a);
                        $("#plugins_list ul#menu_" + technology).append(li);	
                    });
                });
                if (plugin_count == 0) { // If no plugin detected
                    var li = $("<li></li>");
                    var a = $("<a>" + gettext('No plugin enabled or installed') + "<br />" + gettext('Click to reload') + "</a>");
                    a.attr('href', '#');
                    a.addClass("icon16-status-error");
                    a.click(function(){getPluginsList();})
                    li.append(a);
                    $("#plugins_list").append(li);
                }                    
            } else {
                var li = $("<li></li>");
                var a = $("<a>" + gettext('No host listed') + "<br />" + gettext('Click to reload') + "</a>");
                a.attr('href', '#');
                a.addClass("icon16-status-error");
                a.click(function(){getPluginsList();})
                li.append(a);
                $("#plugins_list").append(li);
            }
        })
        .fail(function(jqXHR, status, error){
            var li = $("<li></li>");
            var a = $("<a>" + jqXHR.responseText + "<br />" + gettext('Click to reload') + "</a>");
            a.attr('href', '#');
            a.addClass("icon16-status-error");
            a.click(function(){getPluginsList();})
            li.append(a);
            $("#plugins_list").append(li);	
        });
}
