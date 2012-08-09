$(function(){
    $.fn.extend({
        createItemContent: function (item) {
            var ikey = item.key;
            var iid = item.id;
            var idescription = item.description;
            var idefault = item['default'];
            var itype = item.type;
            var iprefix = item.prefix;
            var ioptionnal = item.optionnal;
            var tr = $("<tr id='" + item.key + "'></tr>");
            tr.attr('key_prefix', iprefix);
            if (ioptionnal == "yes") {
                optionnalDisplay = "";
            }
            else {
                optionnalDisplay = "<img src='" + STATIC_DESIGN_URL + "/common/images/required.png' alt='Required'/>";
            }
            tr.append("<td class='key'><span>" +  ikey + "</span> " + optionnalDisplay + "</td><td><label for='value_" + ikey + "'>" +  idescription + "</label></td>");
            var td = $("<td class='value' type='" + item.type + "'></td>");
            if (itype == 'boolean') {
                td.append("<input type='checkbox' name='value_" + ikey + "' id='value_" + ikey + "' />");
                tr.append(td);
                tr.append("<td></td>");
            } else if (itype == 'password') {
                td.append("<input type='password' name='value_" + ikey + "' id='value_" + ikey + "'  class='medium' value='' />");
                tr.append(td);
                tr.append("<td></td>");
            } else {
                td.append("<input type='text' name='value_" + ikey + "' id='value_" + ikey + "' class='medium' value='' />");                                                                            
                tr.append(td);
                var resetButton = $("<button id='reset" + ikey + "' class='icon16-action-reset buttonicon' title='Reset " + ikey + "'><span class='offscreen'>" + gettext('Reset') + " " + ikey + "</span></button>");
                resetButton.attr('tr_id', ikey);
                resetButton.attr('default', idefault);
                resetButton.click(function(event) {
                    $("tr#" + $(this).attr('tr_id') +" .value").setNotConfigured($(this).attr('default'));
                    event.stopPropagation();
                });
                var td = $("<td><ul class='actions'><li></li></ul></td>");
                $("li", td).append(resetButton);
                tr.append(td);                                    
            }
            this.append(tr);
        },

        configureItemContent: function (item) {
            var ikey = item.key;
            var iid = item.id 
            var idefault = item['default'];
            var itype = item.type;
            var iprefix = item.prefix;
            var td = $("tr#" + ikey +" .value");

            rinor.get(['api', 'pluginconfig', plugin_host, plugin_id, ikey])
                .done(function(data, status, xhr){
                    if (itype == 'boolean') {
                        if (data.value  == "True") {
                            $("input", td).attr('checked', true);
                        }
                    } else {    
                        $("input", td).val(data.value);
                    }
                })
                .fail(function(jqXHR, status, error){
                    if (jqXHR.status == 400)
                        $.notification('error', jqXHR.responseText);
                    if (jqXHR.status == 404) { // If not configured
                        if (itype == 'boolean') {
                            td.setNotConfigured();
                        } else {
                            if (idefault == "None")
                                idefault = null;
                            td.setNotConfigured(idefault);
                        }
                    }
                });
        },
        
        setNotConfigured: function(defaultValue) {
            this.addClass('icon16-status-warning');
            this.prepend("<span class='offscreen'>" + gettext('Not configured') + "</span>");
            $("input", this).attr("class", "default");
            if ((defaultValue) && (defaultValue != "None")) {
                $("input", this).val(defaultValue);            
            } else {
                $("input", this).val("");                        
            }
        },
        
        createConfigurationTable: function (idName) {
            this.append("<table id='" + idName +"' class='simple'> \
                         <thead> \
                         <tr><th scope='col'>" + gettext('Key') + "</th><th scope='col'>" + gettext('Description') + "</th><th scope='col'>" + gettext('Value') + "</th><th>" + gettext('Actions') + "</th></tr> \
                         </thead> \
                         <tbody> \
                         </tbody> \
                         </table>");
        },
    });
    
    function deleteConfigKey(host, id, key) {
        rinor.delete(['api', 'pluginconfig', host, id, key])
            .fail(function(jqXHR, status, error){
                if (jqXHR.status == 400)
                    $.notification('error', jqXHR.responseText);
            });
    }
    
    function deleteConfig(host, id) {
        rinor.delete(['api', 'pluginconfig', host, id])
            .done(function(data, status, xhr){
                $.reloadPage({'status': 'success', 'msg': gettext('Configuration deleted')});
            })
            .fail(function(jqXHR, status, error){
                if (jqXHR.status == 400)
                    $.notification('error', jqXHR.responseText);
            });
    }
    
    function saveConfig(host, id, configuration, nbInterface) {
        var itemSaved = 0;
        $.each(configuration, function(index, item) {
            var value = null;
            if (item.type == 'boolean') {
                value = ($('#value_' + item.key + ':checked').length > 0)? 'True':'False';
            } else {
                value = $('#value_' + item.key).val();
            }
            rinor.put(['api', 'pluginconfig', host, id, item.key], {'value': value})
                .done(function(data, status, xhr){
                    $('#value_' + item.key).parent().attr('class', 'value icon16-status-true');
                    itemSaved++;
                    if (itemSaved == configuration.length) { // All saved without error
                        $.notification('success', gettext('Configuration saved successfully'));
                        $("#buttonstatus").attr('disabled', false);
                    }
                })
                .fail(function(jqXHR, status, error){
                    $('#value_' + item.key).parent().attr('class', 'value icon16-status-false');
                    if (jqXHR.status == 400)
                        $.notification('error', jqXHR.responseText);
                });
        });
        if (nbInterface != undefined) {
            rinor.put(['api', 'pluginconfig', host, id, 'nb-int'], {'value': nbInterface})
                .fail(function(jqXHR, status, error){
                    if (jqXHR.status == 400)
                        $.notification('error', jqXHR.responseText);
                });
        }
    }

    /* init table for simple configuration items */
    $('#simple_configuration_items').createConfigurationTable('configuration_items');
    
    /* Get the list of configuration items */
    rinor.get(['api', 'info'])
        .done(function(data, status, xhr){
            // Check configuration items
            var num_items = data.configuration.length;
            var options = data.configuration.sort(sortOptions);
            var pluginCfg = [];
            var nbPluginCfg = 0;
            var nbInterface;
            $.each(options, function(index, item) {
                if (item.element_type == "item") {
                    item.prefix = item.key
                    pluginCfg[nbPluginCfg] = item;
                    nbPluginCfg++;
                    $("#configuration_items").createItemContent(item);
                    $("#configuration_items").configureItemContent(item);
                }
                else {
                    var addInterfaceButton = $("<button class='button icon16-action-add'>" + gettext('Add interface') + "</button>");
                    $('#group_buttons').append(addInterfaceButton);

                    var delInterfaceButton = $("<button class='button icon16-action-del'>" + gettext('Delete interface') + "</button>");
                    $('#group_buttons').append(delInterfaceButton);

                    // get number of registered interfaces
                    rinor.get(['api', 'pluginconfig', plugin_host, plugin_id, 'nb-int'])
                        .done(function(data, status, xhr){
                            // If already configured
                            nbInterface = data.value;

                            // display interfaces
                            for(i=1;i<=nbInterface;i++) {
                                $('#grouped_configuration_items').createConfigurationTable('configuration_items_'+i);
                                var options = item.elements.sort(sortOptions);
                                $.each(options, function(group_index, group_item) {
                                    if (i == 1)
                                        group_item.prefix = group_item.key;
                                    group_item.key = group_item.prefix + "-" + i;
                                    group_item.nbInterface = nbInterface
                                    pluginCfg[nbPluginCfg] = clone(group_item);
                                    nbPluginCfg++;
                                    $('#configuration_items_' + i).createItemContent(group_item); 
                                    $('#configuration_items_' + i).configureItemContent(group_item); 
                                });
                            }
                             if (nbInterface == 1)
                                 delInterfaceButton.hide();
                        })
                        .fail(function(jqXHR, status, error){
                            if (jqXHR.status == 400)
                                $.notification('error', jqXHR.responseText);
                            if (jqXHR.status == 404) {
                                nbInterface = 1;
                                // display interfaces
                                for(i=1;i<=nbInterface;i++) {
                                    $('#grouped_configuration_items').createConfigurationTable('configuration_items_'+i);
                                    var options = item.elements.sort(sortOptions);
                                    $.each(options, function(group_index, group_item) {
                                        if (i == 1)
                                            group_item.prefix = group_item.key;
                                        group_item.key = group_item.prefix + "-" + i;
                                        group_item.nbInterface = nbInterface
                                        pluginCfg[nbPluginCfg] = clone(group_item);
                                        nbPluginCfg++;
                                        $('#configuration_items_' + i).createItemContent(group_item); 
                                        $('#configuration_items_' + i).configureItemContent(group_item); 
                                    });
                                }
                                delInterfaceButton.hide();
                            }
                        });

                    addInterfaceButton.click( function() {
                        nbInterface++;
                        var divCloned= $('#configuration_items' + "_1").clone();
                        $('#grouped_configuration_items').append(divCloned);
                        divCloned.attr('id', 'configuration_items' + '_' + nbInterface);

                        $('tr', divCloned).each(function(index, item) {
                            newKey = $(item).attr('key_prefix') + '-' + nbInterface;
                            // todo : why have we to test about undefined here ?
                            if ($(item).attr('key_prefix') != undefined) {
                                $(item).attr('id', newKey);
                                $(".value", $(item)).setNotConfigured();
                                $(".key span", this).text(newKey);
                                $("label", this).attr('for', 'value_' + newKey);
                                $("input", this).attr('id', 'value_' + newKey);
                                $("input", this).attr('name', 'value_' + newKey);
                                $("button", this).attr('id', 'reset' + newKey);
                                $("button", this).attr('tr_id', newKey);
                                $("button", this).attr('title', 'Reset ' + newKey);
                                $("button", this).click(function(event) {
                                    $("tr#" + $(this).attr('tr_id') +" .value").setNotConfigured($(this).attr('default'));
                                    event.stopPropagation();
                                });
                                $(".offscreen", this).text(gettext('Reset') + " " + newKey);
                                addedGroup = {};
                                addedGroup.key = newKey;
                                addedGroup.type = $(".value", $(item)).attr('type');
                                addedGroup.nbInterface = nbInterface;
                                pluginCfg[nbPluginCfg] = addedGroup;
                                nbPluginCfg++;
                            }
                        });
                        
                        delInterfaceButton.show();
                    });

                    delInterfaceButton.click( function() {
                        // delete config data
                        $('tr', '#configuration_items_' + nbInterface).each(function(index, item) {
                            if (item.id)
                                deleteConfigKey(plugin_host, plugin_id, item.id);
                        });
                        // delete elements from pluginCfg
                        var k = 0;
                        var pluginCfg2 = [];
                        for(var j=0;j<pluginCfg.length;j++) {
                            if (pluginCfg[j].nbInterface != nbInterface) {
                                pluginCfg2[k] = clone(pluginCfg[j]);
                                 k++;
                            }
                            else {
                                nbPluginCfg--;
                            }
                        }
                        pluginCfg = pluginCfg2;
                            
                        // save new nbInterface
                        nbInterface--;
                        rinor.put(['api', 'pluginconfig', plugin_host, plugin_id, 'nb-int'], {'value': nbInterface})
                            .fail(function(jqXHR, status, error){
                                if (jqXHR.status == 400)
                                    $.notification('error', jqXHR.responseText);
                            });

                        // hide/delete interface display
                        $('#grouped_configuration_items .simple:last').remove();
                        // hide delete button
                        if (nbInterface == 1) {
                            delInterfaceButton.hide();
                        }
                    });
                }
                 
            });
            
            rinor.get(['api', 'pluginconfig', plugin_host, plugin_id])
                .done(function(data, status, xhr){
                    var never_configured = num_items - data.length;
                    if (never_configured > 0) {
                        $.notification('warning', never_configured + " " + gettext('item(s) not configured yet'));
                        $("#buttonstatus").attr('disabled', true);
                    }
                })
                .fail(function(jqXHR, status, error){
                    if (jqXHR.status == 400)
                        $.notification('error', jqXHR.responseText);
                });
            $("#configuration").append("<p><button id='configurationsubmit' class='button icon16-action-save'>" + gettext('Save') + "</button></p>");
            $("#configurationsubmit").click(function(event) {
                saveConfig(plugin_host, plugin_id, pluginCfg, nbInterface);
                event.stopPropagation();
            });
        })
        .fail(function(jqXHR, status, error){
            if (jqXHR.status == 400)
                $.notification('error', jqXHR.responseText);
        });

    $("#configurationdelete").click(function(event) {
        deleteConfig(plugin_host, plugin_id);
    });
});

function sortOptions(a, b){
    return (a.id - b.id) //causes an array to be sorted numerically and ascending
}

function clone(obj){
    if(obj == null || typeof(obj) != 'object')
        return obj;

    var temp = new obj.constructor(); 
    for(var key in obj)
        temp[key] = clone(obj[key]);

    return temp;
}
