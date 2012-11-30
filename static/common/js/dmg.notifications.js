(function($) {
    $.jGrowl.defaults.closerTemplate = '<div>' + gettext('hide all notifications') + '</div>';

    $.extend({
        notification: function(status, msg) {
            var header = null;
            var theme = status;
            var sticky = false;
            var msgformated = msg.replace( /\n/g, '<br />\n' );
            switch (theme) {
                case 'success':
                    header = gettext('Success');
                    break;
                case 'info':
                    header = gettext('Information');
                    sticky = true;
                    break;
                case 'error':
                    header = gettext('Error');
                    sticky = true;
                    break;
                case 'warning':
                    header = gettext('Warning');
                    break;
                case 'debug':
                    header = gettext('Debug');
                    break;
            }    
            $.jGrowl(msgformated, { header: header, sticky: sticky, theme: theme });
        }
    });
})(jQuery);

