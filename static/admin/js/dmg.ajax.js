(function($) {
    var methodsAjaxButton = {
        init : function( options ) {
            return this.each(function(){
                var self = $(this);
                self.addClass('button ' + options.icon);
                self.unbind('.ajaxButton');

                var processFunction = function(options) {
                    if (jQuery.isFunction(options.url))
                        var url = options.url($(this));
                    else
                        var url = options.url;
                    if (url[0] == 'api') {
                        if (options.type == 'POST')
                            var defer = rinor.post(url, options.data);
                        else
                            var defer = rinor.put(url, options.data);
                    } else {
                        url = REST_URL + '/' + url.join('/') + '/';
                        var defer = $.ajax({
                            type: 'GET',
                            url: url,
                            data: options.data,
                            processData:  false
                        });
                    }
                    defer.done(function(data, status, xhr){
                            $.notification('success', options.successMsg);
                            if (options.successFct)
                                options.successFct(data, status, xhr);
                        })
                        .fail(function(jqXHR, status, error){
                            if (jqXHR.status == 400)
                                $.notification('error', jqXHR.responseText);
                            if (options.errorFct)
                                options.errorFct(jqXHR, status, error);
                        })
                        .always(function(){
                            self.addClass(options.icon).removeClass('icon16-status-loading');
                            self.removeAttr("disabled");
                        });
                }
                
                var clickFunction = function(event) {
                    var preResult = true;
                    self.attr("disabled", "disabled");
                    self.removeClass(options.icon).addClass('icon16-status-loading');
                    if (options.preFct) {
                        options.preFct(self, options, processFunction);
                    } else {
                        processFunction(options);                        
                    }
                };
                self.bind('click.ajaxButton', clickFunction);
            });
        },

        destroy : function( ) {
            return this.each(function(){
                var self = $(this);
                self.attr('class', '');
                self.unbind('.ajaxButton');
            })    
        }
    };
  
    $.fn.ajaxButton = function( method ) {
        if ( methodsAjaxButton[method] ) {
            return methodsAjaxButton[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
            return methodsAjaxButton.init.apply( this, arguments );
        } else {
            $.error( gettext('Method') + ' ' +  method + ' ' + gettext('does not exist on jQuery.ajaxButton') );
        }
    };
    
    var methodsAjaxSwitch = {
        init : function( options ) {
            return this.each(function(){
                var self = $(this);
                self.data('ajaxSwitch', { options: options });
                self.unbind('.ajaxSwitch')
                self.addClass('button');
            });
        },

        run : function( default_id ) {
            return this.each(function(){
                var self = $(this);
                //find options
                var data_switch = self.data('ajaxSwitch');
                var state = null;
                var state_inv = null;
                $.each(data_switch.options.states, function() {
                    if (this.id == default_id)
                        state = this;
                    else
                        state_inv = this;
                });
                
                if (state) {
                    self.text(state.text);
                    self.removeClass(state_inv.icon);
                    self.addClass(state.icon);
            
                    var clickFunction = function() {
                        self.attr("disabled", "disabled");
                        self.removeClass(state.icon).addClass('icon16-status-loading');
                        rinor.put(data_switch.options.url, state.data)
                            .done(function(data, status, xhr){
                                $.notification('success', state.successMsg);
                                var tmp = state;
                                state = state_inv;
                                state_inv = tmp;
                                self.text(state.text);
                                self.removeClass('icon16-status-loading');
                                self.addClass(state.icon);

                                if (data_switch.options.successFct)
                                    data_switch.options.successFct(state, status, xhr);
                            })
                            .fail(function(jqXHR, status, error){
                                self.addClass(state.icon).removeClass('icon16-status-loading');
                                if (jqXHR.status == 400)
                                    $.notification('error', jqXHR.responseText);
                                if (data_switch.options.errorFct)
                                    data_switch.options.errorFct(jqXHR, status, error);
                            })
                            .always(function(){
                                self.removeAttr("disabled");
                            });
            
                    };
                    self.bind('click.ajaxSwitch', clickFunction);
                }
            });
        },
        
        destroy : function( ) {
            return this.each(function(){
                var self = $(this);
                self.attr('class', '');
                self.unbind('.ajaxButton');
            })    
        }
    };
  
    $.fn.ajaxSwitch = function( method ) {
        if ( methodsAjaxSwitch[method] ) {
            return methodsAjaxSwitch[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
            return methodsAjaxSwitch.init.apply( this, arguments );
        } else {
            $.error( gettext('Method') + ' ' +  method + ' ' + gettext('does not exist on jQuery.ajaxButton') );
        }
    };
})(jQuery);