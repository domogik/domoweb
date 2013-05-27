function numbersonly(e) {
    var unicode=e.which;
    if (unicode!=8 && unicode!=0) { //if the key isn't the tab key
        if (unicode<48||unicode>57) {//if not a number return false //disable key press
            return false;
        } else {
            return true;
        }
    }
    return true;
}

(function($) {
    $.widget("ui.dialog_form", {
        _init: function() {
            var self = this, o = this.options;
            this.element.append("<div class='tip'>" + o.tips + "</div><ul class='tip' id='" + o.tipsid + "'></ul>");
            var form = $("<form></form>");
            this._content = $("<fieldset></fieldset>");
            this._allFields = [];
            form.append(this._content);
            this.element.append(form);
            jQuery.each(o.fields, function(index, value) {
                var field = null;
                switch(value.type) {
                case 'text':
                    field = self._addTextField(value.name, value.label, value.required);
                    break;
                case 'numericpassword':
                    field = self._addNumericPasswordField(value.name, value.label, value.required);
                    break;
                case 'checkbox':
                    field = self._addCheckboxField(value.name, value.label, value.required);
                    break;
                case 'select':
                    field = self._addSelectField(value.name, value.label, value.required, value.items, value.options);
                    break;
                }
                self._allFields.push(field);
            });
            
            this.element.dialog({
                autoOpen: false,
                modal: true,
                buttons: {
                    'OK': function() {
                        self._valid();
                    },
                    'Cancel': function() {
                        $(this).dialog('close');
                    }
                },
                close: function() {
                    $.each(self._allFields, function() {$(this).val('').removeClass('ui-state-error')});
                }
            });
        return this;
        },
        
        _addTextField: function(name, label, required) {
            var labelitem = $("<label for='" + name + "'>" + label + "</label>");
            var inputitem = $("<input type='text' class='medium' id='" + name + "' name='" + name + "' />");
            if (required) {
                labelitem.addClass('required');
                inputitem.addClass('required');
            }
            this._content.append(labelitem);
            this._content.append(inputitem);
            return inputitem;
        },
        
        _addNumericPasswordField: function(name, label, required) {
            var labelitem = $("<label for='" + name + "'>" + label + "</label>");
            var inputitem = $("<input type='text' onkeypress='return numbersonly(event)' class='medium' id='" + name + "' name='" + name + "' />");
            if (required) {
                labelitem.addClass('required');
                inputitem.addClass('required');
            }
            this._content.append(labelitem);
            this._content.append(inputitem);
            return inputitem;
        },

        _addCheckboxField: function(name, label, required) {
            var labelitem = $("<label for='" + name + "'>" + label + "</label>");
            var inputitem = $("<input type='checkbox' class='medium' id='" + name + "' name='" + name + "' />");
            if (required) {
                labelitem.addClass('required');
                inputitem.addClass('required');
            }
            this._content.append(labelitem);
            this._content.append(inputitem);
            return inputitem;
        },

        _addSelectField: function(name, label, required, items, options) {
            var labelitem = $("<label for='" + name + "'>" + label + "</label>");
            var inputitem = $("<select class='medium' id='" + name + "' name='" + name + "' style='width:20em;'></select>");
            if (required) {
                labelitem.addClass('required');
                inputitem.addClass('required');
            }
            if (options.placeholder) {
                inputitem.append("<option value=''></option>");
                inputitem.attr('data-placeholder', options.placeholder);
            }
            if (items) {
                jQuery.each(items, function(index, item) {
                    if (item.subitems) {
                        group = $("<optgroup label='" + item.label + "' class='" + item.icon + "' icon='" + item.icon + "'></optgroup>");
                        jQuery.each(item.subitems, function(index, subitem) {
                            group.append("<option class='" + subitem.icon + "' value='" + subitem.value + "'>" + subitem.label + "</option>");                                                    
                        });                                        
                        inputitem.append(group);                        
                    } else {
                        inputitem.append("<option class='" + item.icon + "' value='" + item.value + "' icon='" + item.icon + "'>" + item.label + "</option>");                        
                    }
                });                
            }
            this._content.append(labelitem);
            this._content.append(inputitem);
            inputitem.chosen();
            return inputitem;
        },
        
        _clearTips: function() {
            var self = this, o = this.options;
            $("#" + o.tipsid + " li").remove();
        },
        
        _addTips: function(text) {
            var self = this, o = this.options;
            $("#" + o.tipsid).append("<li>" + text + "</li>");            
        },
        
        _valid: function() {
            var self = this, o = this.options;
            self._clearTips();
            var valid = true;
            jQuery.each(o.fields, function(index, value) {
                if (value.required || self._hasvalue(value)) {
                    switch(value.type) {
                    case 'text':
                        if (!self._validTextLength(value.name, value.options.min, value.options.max)) {
                            $("#" + value.name).addClass('state-error');
                            valid &= self._addTips(value.label + " " + gettext('length has to be between') + " " + value.options. min + " " + gettext('and') + " " + value.options.max + ".");
                        } else {
                            $("#" + value.name).removeClass('state-error');                            
                        }
                        break;
                    case 'numericpassword':
                        if (!self._validTextLength(value.name, value.options.min, value.options.max)) {
                            $("#" + value.name).addClass('state-error');
                            valid &= self._addTips(value.label + " " + gettext('length has to be between') + " " + value.options. min + " " + gettext('and') + " " + value.options.max + ".");
                        } else {
                            $("#" + value.name).removeClass('state-error');                            
                        }
                        break;
                    case 'select':
                        if (!self._validNotInitial(value.name)) {
                            $("#" + value.name + "_button").addClass('state-error');
                            valid &= self._addTips(value.label + " is not selected");
                        } else {
                            $("#" + value.name + "_button").removeClass('state-error');                            
                        }
                        break;
                    }
                }
            });
            return valid;
        },

        _validTextLength: function(name, min, max) {
            var val = $("#" + name).val();
            return (val.length <= max && val.length >= min);
        },

        _validNotInitial: function(name) {
            var val = $("#" + name).val();
            return (val != "");
        },

        _values: function() {
            var self = this, o = this.options;
            var result = new Object();
            jQuery.each(o.fields, function(index, value) {
                switch(value.type) {
                case 'text':
                case 'numericpassword':
                case 'select':
                    result[value.name] = $('#' + value.name).val();
                    break;
                case 'checkbox':
                    result[value.name] = ($('#' + value.name).is(':checked'))?'True':'False';
                    break;
                }
            });
            return result;
        },
        
        _hasvalue: function(value) {
            var result = false;
            switch(value.type) {
            case 'text':
            case 'numericpassword':
            case 'select':
            case 'selectipod':
                result = ($('#' + value.name).val()).lenght > 0;
                break;
            case 'checkbox':
                result = true;
                break;
            }
        },
        
        addbutton: function(ops) {
            var self = this, o = this.options;
            $(ops.button).click(function() {
                self.element.dialog_form('open', {
                    title: ops.title,
                    onok: ops.onok
                }); 
            });
        },

        updbutton: function(ops) {
            var self = this, o = this.options;
            $(ops.button).click(function() {
                self.element.dialog_form('open', {
                    title: ops.title,
                    onok: ops.onok,
                    values: ops.values
                }); 
            });
        },
        
        open: function(ops) {
            var self = this, o = this.options;
            this.element.dialog('option', 'title', ops.title);
            this.element.dialog('option', 'buttons', {
                'Yes': function() {
                    if (self._valid()) {
                        var values = self._values();
                        ops.onok(values);                        
                    }
                },
                'Cancel': function() {
                    $(this).dialog('close');
                }
            });
            if (ops.values) {
                jQuery.each(o.fields, function(index, value) {
                    switch(value.type) {
                    case 'text':
                        var decoded = '';
                        if (ops.values[value.name]) decoded = $("<div/>").html(ops.values[value.name]).text();
                        $('#' + value.name).val(decoded);
                        break;
                    case 'select':
                        $('#' + value.name + ' option[value="' + ops.values[value.name] + '"]').attr('selected', 'selected');
                        $('#' + value.name).trigger("liszt:updated");
                        break;
                    case 'checkbox':
                        if (ops.values[value.name] == true)
                            $('#' + value.name).attr('checked', 'checked');
                        break;
                    }
                });
            }
            this.element.dialog('open');
        }
    });
        
    $.extend($.ui.dialog_form, {
        defaults: {
        }
    });
})(jQuery);