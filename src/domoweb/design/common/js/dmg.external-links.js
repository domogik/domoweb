$(function(){
    $('a[href^="http://"]').attr({
        target: "_blank",
        title: gettext('Opens in a new window')
    });
});