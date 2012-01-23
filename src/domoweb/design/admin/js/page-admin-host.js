    var tableInstalledPlugins, tableAvailablePlugins
    var tableInstalledExternals, tableAvailableExternals

    $(function(){
        $("#update_cache").ajaxButton({
            'url':['api', 'repository'],
            'data':{'action':'refresh'},
            'successMsg':"Package cache updated",
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
                "sEmptyTable": "No plugin installed"
            },
            "bProcessing": true,
            "sAjaxSource": '/rinor/api/package-installed/' + host_id + '/plugin/',
            "sAjaxDataProp": "objects",
            "sPaginationType": "full_numbers",
            "sDom": 'flrt<"bottom"p>',
            "aoColumns": [
                {
                    "fnRender": function ( oObj ) {
                        return "<span class='package'><span class='icon' style='background-image:url(/admin/resource/icon/package/installed/plugin/" + oObj.aData['id'] + ")'></span>" + oObj.aData['id'] + "</span>";
                    }
                },
                { "mDataProp": "release" },
                {
                    "fnRender": function ( oObj ) {
                        var str = "";
                        if (oObj.aData['enabled'] == 'True') {
                            str += "<button class='disable'>Disable</button>";
                        }
                        else {
                            str += "<button class='enable'>Enable</button>";
                        }
                        str+= "<button class='uninstall'>Uninstall</button>";
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
                    'successMsg':"Package uninstalled",
                    'icon':'icon16-action-del',
                    'successFct':function(data, status, xhr) {tableAvailablePlugins.fnReloadAjax();tableInstalledPlugins.fnReloadAjax();}
                });
                $("button.enable", nRow).ajaxButton({
                    'url':['api', 'plugin', host_id, aData['id']],
                    'data':{command : 'enable'},
                    'successMsg':"Package enabled",
                    'icon':'icon16-status-active',
                    'successFct':function(data, status, xhr) {tableInstalledPlugins.fnReloadAjax()}
                });
        
                $("button.disable", nRow).ajaxButton({
                    'url':['api', 'plugin', host_id, aData['id']],
                    'data':{command : 'disable'},
                    'successMsg':"Package disabled",
                    'icon':'icon16-status-inactive',
                    'successFct':function(data, status, xhr) {tableInstalledPlugins.fnReloadAjax()}
                });
                return nRow;
            },
        });
        tableAvailablePlugins = $('#available_plugins').dataTable( {
            "iDisplayLength": 50,
            "oLanguage": {
                "sEmptyTable": "No plugin available to install"
            },
            "bProcessing": true,
            "sAjaxSource": '/rinor/api/package-available/' + host_id + '/plugin/',
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
                        return "<span class='package'><span class='icon' style='background-image:url(/admin/resource/icon/package/available/plugin/" + oObj.aData['id'] + "/" + oObj.aData['release'] + ")'></span>" + oObj.aData['release'] + "</span>";
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
                { "mDataProp": "techno" },
                {
                    "fnRender": function ( oObj ) {
                        return oObj.aData['desc'].replace(/\n/g, '<br />');
                    },
                },
                { "mDataProp": "author" },
                {
                    "fnRender": function ( oObj ) {
                        var str = "";
                        str += "<button class='install'>Install</button><a href='" + oObj.aData['doc'] + "' target='_blank' class='button external-button'>Documentation</a>";
                        return str;
                    },
                    "sClass": "center"
                },

            ],
            "fnRowCallback": function( nRow, aData, iDisplayIndex ) {
                $("button.install", nRow).ajaxButton({
                    'url':['api', 'package-available', host_id, aData['type']],
                    'data':{command : 'install', package : aData['id'], release : aData['release']},
                    'successMsg':"Package installed",
                    'icon':'icon16-action-add',
                    'successFct':function(data, status, xhr) {tableAvailablePlugins.fnReloadAjax();tableInstalledPlugins.fnReloadAjax();}
                });
                $("button.update", nRow).ajaxButton({
                    'url':['api', 'package-available', host_id, aData['type']],
                    'data':{command : 'update', package : aData['id'], release : aData['release']},
                    'successMsg':"Package updated",
                    'icon':'icon16-action-refresh',
                    'successFct':function(data, status, xhr) {tableAvailablePlugins.fnReloadAjax();tableInstalledPlugins.fnReloadAjax();}
                });
                return nRow;
            },
        }).rowGrouping();
    
        tableInstalledExternals = $('#installed_externals').dataTable( {
            "bProcessing": true,
            "oLanguage": {
                "sEmptyTable": "No external member installed"
            },
            "sAjaxSource": '/rinor/api/package-installed/' + host_id + '/external/',
            "sAjaxDataProp": "objects",
            "sPaginationType": "full_numbers",
            "sDom": 'flrt<"bottom"p>',
            "aoColumns": [
                {
                    "fnRender": function ( oObj ) {
                        return "<span class='package'><span class='icon' style='background-image:url(/admin/resource/icon/package/installed/external/" + oObj.aData['id'] + ")'></span>" + oObj.aData['id'] + "</span>";
                    }
                },
                { "mDataProp": "release" },
                {
                    "fnRender": function ( oObj ) {
                        var str = "";
                        str+= "<button class='uninstall'>Uninstall</button>";
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
                    'successMsg':"Package uninstalled",
                    'icon':'icon16-action-del',
                    'successFct':function(data, status, xhr) {tableAvailableExternals.fnReloadAjax();tableInstalledExternals.fnReloadAjax();}
                });
                return nRow;
            },
        });
        tableAvailableExternals = $('#available_externals').dataTable( {
            "iDisplayLength": 50,
            "oLanguage": {
                "sEmptyTable": "No external member available to install"
            },
            "bProcessing": true,
            "sAjaxSource": '/rinor/api/package-available/' + host_id + '/external/',
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
                        return "<span class='package'><span class='icon' style='background-image:url(/admin/resource/icon/package/available/external/" + oObj.aData['id'] + "/" + oObj.aData['release'] + ")'></span>" + oObj.aData['release'] + "</span>";
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
                { "mDataProp": "techno" },
                {
                    "fnRender": function ( oObj ) {
                        return oObj.aData['desc'].replace(/\n/g, '<br />');
                    },
                },
                { "mDataProp": "author" },
                {
                    "fnRender": function ( oObj ) {
                        var str = "";
                        str += "<button class='install'>Install</button><a href='" + oObj.aData['doc'] + "' target='_blank' class='button external-button'>Documentation</a>";
                        return str;
                    },
                    "sClass": "center"
                },

            ],
            "fnRowCallback": function( nRow, aData, iDisplayIndex ) {
                $("button.install", nRow).ajaxButton({
                    'url':['api', 'package-available', host_id, aData['type']],
                    'data':{command : 'install', package : aData['id'], release : aData['release']},
                    'successMsg':"Package installed",
                    'icon':'icon16-action-add',
                    'successFct':function(data, status, xhr) {tableAvailableExternals.fnReloadAjax();tableInstalledExternals.fnReloadAjax();}
                });
                $("button.update", nRow).ajaxButton({
                    'url':['api', 'package-available', host_id, aData['type']],
                    'data':{command : 'update', package : aData['id'], release : aData['release']},
                    'successMsg':"Package updated",
                    'icon':'icon16-action-refresh',
                    'successFct':function(data, status, xhr) {tableAvailableExternals.fnReloadAjax();tableInstalledExternals.fnReloadAjax();}
                });
                return nRow;
            },
        }).rowGrouping();
    });