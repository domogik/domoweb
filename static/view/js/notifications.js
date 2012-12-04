(function($) {
    $.extend({
        notification: function(type, msg) {
            var msgformated = msg.replace( /\n/g, '<br />\n' );
            switch (type) {
                case 'success':
                    header = gettext('Success');
                    break;
                case 'information':
                    header = gettext('Information');
                    break;
                case 'error':
                    header = gettext('Error');
                    break;
                case 'warning':
                    header = gettext('Warning');
                    break;
                case 'alert':
                    header = gettext('Alert');
                    break;
                default:
                    header = gettext('Alert');
                    break;
            }
            noty({type: type, text: header + " - " + msgformated});
        }
    });
})(jQuery);

