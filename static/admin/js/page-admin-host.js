    var tableInstalledPlugins, tableAvailablePlugins
    var tableInstalledExternals, tableAvailableExternals

    $(function(){
        $("#update_cache").ajaxButton({
            'url':['api', 'repository'],
            'data':{'action':'refresh'},
            'successMsg': gettext('Package cache updated'),
            'icon':'icon16-action-reset',
            'successFct':function(data, status, xhr) {
                tableAvailablePlugins.fnReloadAjax();
                tableInstalledPlugins.fnReloadAjax();
                tableAvailableExternals.fnReloadAjax();
                tableInstalledExternals.fnReloadAjax();
            }
        });

        tableInstalledPlugins = $('#installed_plugins').dataTable( {
            "oLanguage": {
                "sEmptyTable": gettext('No plugin installed')
            },
            "bProcessing": true,
            "sAjaxSource": REST_URL + '/api/package-installed/' + host_id + '/plugin/',
            "sAjaxDataProp": "objects",
            "sPaginationType": "full_numbers",
            "sDom": 'flrt<"bottom"p>',
            "aoColumns": [
                {
                    "fnRender": function ( oObj ) {
                        return "<span class='package'><span class='icon' style='background-image:url(" + ADMIN_URL + "/resource/icon/package/installed/plugin/" + oObj.aData['id'] + ")'></span>" + oObj.aData['id'] + "</span>";
                    }
                },
                { "mDataProp": "version" },
                {
                    "fnRender": function ( oObj ) {
                        var str = "";
                        if (oObj.aData['enabled'] == 'True') {
                            str += "<button class='disable'>" + gettext('Disable') + "</button>";
                            url = config_url.replace('plugin_id', oObj.aData['id']).replace('plugin_type', 'plugin');
                            str += "<a href='" + url + "' class='button icon16-action-customize'>" + gettext('Configure') + "</a>";
                        }
                        else {
                            str += "<button class='enable'>" + gettext('Enable') + "</button>";
                        }
                        str+= "<button class='uninstall'>" + gettext('Uninstall') + "</button>";
                        $.each(oObj.aData['updates'], function(index, update) {
                            str+= "<button class='update' version='" + update.version + "'>" + gettext('Update') + "&nbsp;(" + update.version + ")</button>";
                        });
                        return str;
                    },
                    "sClass": "center"
                },
            ],
            "fnRowCallback": function( nRow, aData, iDisplayIndex ) {
                /* Append the grade to the default row class name */
                $("button.uninstall", nRow).ajaxButton({
                    'url':['api', 'package-installed', host_id, aData['type']],
                    'data':{command : 'uninstall', package : aData['id']},
                    'successMsg': gettext('Package uninstalled'),
                    'icon':'icon16-action-del',
                    'successFct':function(data, status, xhr) {tableAvailablePlugins.fnReloadAjax();tableInstalledPlugins.fnReloadAjax();}
                });
                $("button.enable", nRow).ajaxButton({
                    'url':['api', 'plugin', host_id, aData['id']],
                    'data':{command : 'enable'},
                    'successMsg':gettext('Package enabled'),
                    'icon':'icon16-status-active',
                    'successFct':function(data, status, xhr) {tableInstalledPlugins.fnReloadAjax();getPluginsList();}
                });
        
                $("button.disable", nRow).ajaxButton({
                    'url':['api', 'plugin', host_id, aData['id']],
                    'data':{command : 'disable'},
                    'successMsg':gettext('Package disabled'),
                    'icon':'icon16-status-inactive',
                    'successFct':function(data, status, xhr) {tableInstalledPlugins.fnReloadAjax();getPluginsList();}
                });
                
                $("button.update", nRow).ajaxButton({
                    'url':['api', 'package-available', host_id, aData['type']],
                    'data':{command : 'install', package : aData['id'], version : $("button.update", nRow).attr('version')},
                    'successMsg': gettext('Package installed'),
                    'icon':'icon16-action-add',
                    'successFct':function(data, status, xhr) {tableAvailablePlugins.fnReloadAjax();tableInstalledPlugins.fnReloadAjax();},
                    'preFct':function(self, options, processFunction) {
                        rinor.get(['api', 'package-dependency', host_id, aData['type'], aData['id'], self.attr('version')])
                            .done(function(data, status, xhr){
                                var missing = false;
                                var dialog_html = "<ul class='dependencies'>";
                                $.each(data.objects, function(index, dependency) {
                                    dialog_html += "<li>" + dependency.id
                                    if (dependency.installed == 'False') {
                                        dialog_html += "<div style='float:right' class='icon16-text icon16-status-false'>" + gettext('Missing') + "</div>"                                                                                
                                        if (dependency.error)
                                            dialog_html += "<p class='error'>" + dependency.error + "</p>";
                                        if (dependency.cmdline)
                                            dialog_html += "<code>" + dependency.cmdline + "</code>";
                                    } else {
                                        dialog_html += "<div style='float:right' class='icon16-text icon16-status-true'>" + gettext('Installed') + "</div>"                                        
                                    }
                                    dialog_html += "</li>";
                                    if (dependency.installed == 'False') {
                                        missing = true;
                                    }
                                });
                                dialog_html += '</ul>';

                                if (missing) {
                                    self.addClass(options.icon).removeClass('icon16-status-loading');
                                    self.removeAttr("disabled");
                                    // Display alert windows
                                    $('#dialog_dependency').dialog('option', 'title', gettext('Missing dependency'));
                                    $('#dialog_dependency').html(dialog_html);
                                    $('#dialog_dependency').dialog('open');
                                } else {
                                    // Process with install request
                                    processFunction(options);
                                }
                            })
                            .fail(function(jqXHR, status, error){
                                self.addClass(options.icon).removeClass('icon16-status-loading');
                                self.removeAttr("disabled");
                                if (jqXHR.status == 400)
                                    $.notification('error', jqXHR.responseText);                                    
                            })
                        return false;
                    }
                });
                return nRow;
            },
        });
        tableAvailablePlugins = $('#available_plugins').dataTable( {
            "iDisplayLength": 50,
            "oLanguage": {
                "sEmptyTable": gettext('No plugin available to install')
            },
            "bProcessing": true,
            "sAjaxSource": REST_URL + '/api/package-available/' + host_id + '/plugin/',
            "sAjaxDataProp": "objects",
            "sPaginationType": "full_numbers",
            "sDom": 'flrt<"bottom"p>',
            "bAutoWidth": false,
            "aoColumns": [
                {
                    "fnRender": function ( oObj ) {
                        return oObj.aData['id'];
                    },
                },
                {
                    "fnRender": function ( oObj ) {
                        return "<span class='package'><span class='icon' style='background-image:url(" + ADMIN_URL + "/resource/icon/package/available/plugin/" + oObj.aData['id'] + "/" + oObj.aData['version'] + ")'></span>" + oObj.aData['version'] + "</span>";
                    }
                },
                {
                    "fnRender": function ( oObj ) {
                        source = oObj.aData['source'];
                        if (source.charAt(source.length-1) == '/') {
                            source = source.substr(0, source.length-1);
                        }
                        array_source = source.split('/');
                        repository = array_source.pop();
                        return "<span class='repository'><span class='icon' style='background-image:url(" + source + "/icon)'></span>" + repository + "</span>";
                  return 'null';
                    },
                },
                { "mDataProp": "category" },
                {
                    "fnRender": function ( oObj ) {
                        var str = '';
                        if (oObj.aData['description']) {
                            str = oObj.aData['description'].replace(/\n/g, '<br />');
                        }
                        return str;
                    },
                },
                { "mDataProp": "author" },
                {
                    "fnRender": function ( oObj ) {
                        var str = "";
                        str += "<button class='install'>" + gettext('Install') + "</button>";
                        if (oObj.aData['documentation'])
                            str += "<a href='" + oObj.aData['documentation'] + "' target='_blank' class='button external-button'>" + gettext('Documentation') + "</a>";
                        return str;
                    },
                    "sClass": "center"
                },

            ],
            "fnRowCallback": function( nRow, aData, iDisplayIndex ) {
                $("button.install", nRow).ajaxButton({
                    'url':['api', 'package-available', host_id, aData['type']],
                    'data':{command : 'install', package : aData['id'], version : aData['version']},
                    'successMsg': gettext('Package installed'),
                    'icon':'icon16-action-add',
                    'successFct':function(data, status, xhr) {tableAvailablePlugins.fnReloadAjax();tableInstalledPlugins.fnReloadAjax();},
                    'preFct':function(self, options, processFunction) {
                        rinor.get(['api', 'package-dependency', host_id, aData['type'], aData['id'], aData['version']])
                            .done(function(data, status, xhr){
                                var missing = false;
                                var dialog_html = "<ul class='dependencies'>";
                                $.each(data.objects, function(index, dependency) {
                                    dialog_html += "<li>" + dependency.id
                                    if (dependency.installed == 'False') {
                                        dialog_html += "<div style='float:right' class='icon16-text icon16-status-false'>"+ gettext('Missing') + "</div>"                                                                                
                                        if (dependency.error)
                                            dialog_html += "<p class='error'>" + dependency.error + "</p>";
                                        if (dependency.cmdline)
                                            dialog_html += "<code>" + dependency.cmdline + "</code>";
                                    } else {
                                        dialog_html += "<div style='float:right' class='icon16-text icon16-status-true'>" + gettext('Installed') + "</div>"                                        
                                    }
                                    dialog_html += "</li>";
                                    if (dependency.installed == 'False') {
                                        missing = true;
                                    }
                                });
                                dialog_html += '</ul>';

                                if (missing) {
                                    self.addClass(options.icon).removeClass('icon16-status-loading');
                                    self.removeAttr("disabled");
                                    // Display alert windows
                                    $('#dialog_dependency').dialog('option', 'title', gettext('Missing dependency'));
                                    $('#dialog_dependency').html(dialog_html);
                                    $('#dialog_dependency').dialog('open');
                                } else {
                                    // Process with install request
                                    processFunction(options);
                                }
                            })
                            .fail(function(jqXHR, status, error){
                                self.addClass(options.icon).removeClass('icon16-status-loading');
                                self.removeAttr("disabled");
                                if (jqXHR.status == 400)
                                    $.notification('error', jqXHR.responseText);                                    
                            })
                        return false;
                    }
                });
                return nRow;
            },
        }).rowGrouping();
    
        tableInstalledExternals = $('#installed_externals').dataTable( {
            "bProcessing": true,
            "oLanguage": {
                "sEmptyTable": gettext('No external member installed')
            },
            "sAjaxSource": REST_URL + '/api/package-installed/' + host_id + '/external/',
            "sAjaxDataProp": "objects",
            "sPaginationType": "full_numbers",
            "sDom": 'flrt<"bottom"p>',
            "aoColumns": [
                {
                    "fnRender": function ( oObj ) {
                        return "<span class='package'><span class='icon' style='background-image:url(" + ADMIN_URL + "/resource/icon/package/installed/external/" + oObj.aData['id'] + ")'></span>" + oObj.aData['id'] + "</span>";
                    }
                },
                { "mDataProp": "version" },
                {
                    "fnRender": function ( oObj ) {
                        var str = "";
                        str+= "<button class='uninstall'>" + gettext('Uninstall') + "</button>";
                        $.each(oObj.aData['updates'], function(index, update) {
                            str+= "<button class='update' version='" + update.version + "'>" + gettext('Update') + "&nbsp;(" + update.version + ")</button>";
                        });
                        return str;
                    },
                    "sClass": "center"
                },
            ],
            "fnRowCallback": function( nRow, aData, iDisplayIndex ) {
                /* Append the grade to the default row class name */
                $("button.uninstall", nRow).ajaxButton({
                    'url':['api', 'package-installed', host_id, aData['type']],
                    'data':{command : 'uninstall', package : aData['id']},
                    'successMsg': gettext('Package uninstalled'),
                    'icon':'icon16-action-del',
                    'successFct':function(data, status, xhr) {tableAvailableExternals.fnReloadAjax();tableInstalledExternals.fnReloadAjax();}
                });
                $("button.update", nRow).ajaxButton({
                    'url':['api', 'package-available', host_id, aData['type']],
                    'data':{command : 'install', package : aData['id'], version : $("button.update", nRow).attr('version')},
                    'successMsg': gettext('Package installed'),
                    'icon':'icon16-action-add',
                    'successFct':function(data, status, xhr) {tableAvailableExternals.fnReloadAjax();tableInstalledExternals.fnReloadAjax();}
                });

                return nRow;
            },
        });
        tableAvailableExternals = $('#available_externals').dataTable( {
            "iDisplayLength": 50,
            "oLanguage": {
                "sEmptyTable": gettext('No external member available to install')
            },
            "bProcessing": true,
            "sAjaxSource": REST_URL + '/api/package-available/' + host_id + '/external/',
            "sAjaxDataProp": "objects",
            "sPaginationType": "full_numbers",
            "sDom": 'flrt<"bottom"p>',
            "bAutoWidth": false,
            "aoColumns": [
                {
                    "fnRender": function ( oObj ) {
                        return oObj.aData['id'];
                    },
                },
                {
                    "fnRender": function ( oObj ) {
                        return "<span class='package'><span class='icon' style='background-image:url(" + ADMIN_URL + "/resource/icon/package/available/external/" + oObj.aData['id'] + "/" + oObj.aData['version'] + ")'></span>" + oObj.aData['version'] + "</span>";
                    }
                },
                {
                    "fnRender": function ( oObj ) {
                        source = oObj.aData['source'];
                        if (source.charAt(source.length-1)) {
                            source = source.substr(0, source.length-1);
                        }
                        array_source = source.split('/');
                        repository = array_source.pop();
                        return "<span class='repository'><span class='icon' style='background-image:url(" + source + "/icon)'></span>" + repository + "</span>";
                    },
                },
                { "mDataProp": "category" },
                {
                    "fnRender": function ( oObj ) {
                        var str = '';
                        if (oObj.aData['description']) {
                            str = oObj.aData['description'].replace(/\n/g, '<br />');
                        }
                        return str;
                    },
                },
                { "mDataProp": "author" },
                {
                    "fnRender": function ( oObj ) {
                        var str = "";
                        str += "<button class='install'>" + gettext('Install') + "</button>";
                        if (oObj.aData['documentation'])
                            str += "<a href='" + oObj.aData['documentation'] + "' target='_blank' class='button external-button'>" + gettext('Documentation') + "</a>";
                        return str;
                    },
                    "sClass": "center"
                },
            ],
            "fnRowCallback": function( nRow, aData, iDisplayIndex ) {
                $("button.install", nRow).ajaxButton({
                    'url':['api', 'package-available', host_id, aData['type']],
                    'data':{command : 'install', package : aData['id'], version : aData['version']},
                    'successMsg': gettext('Package installed'),
                    'icon':'icon16-action-add',
                    'successFct':function(data, status, xhr) {tableAvailableExternals.fnReloadAjax();tableInstalledExternals.fnReloadAjax();}
                });
                return nRow;
            },
        }).rowGrouping();
    });