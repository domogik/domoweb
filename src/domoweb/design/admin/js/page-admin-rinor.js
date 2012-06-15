$(function(){
    $("#domogik_request_list, #devices_request_list").dataTable({
        "sPaginationType": "full_numbers",
        "sDom": 'lrt<"bottom"ip>'
    });
    $("#force_refresh").click(function() {refresh()});
    refresh();
    $('body').everyTime('10s', function() {refresh()});
});

function refresh() {
    rinor.get(['api', 'info'])
        .done(function(data, status, xhr){
            // Queues
            $.each(data.queue, function(index, value) {
                var avalue = value.split('/');
                var valuewidth = avalue[0] * 100 / avalue[1];
                $("#" + index + " .indicator .valuetxt")
                    .text(value);
                $("#" + index + " .indicator .valuegraph")
                    .width(valuewidth);
            });
            
            // Events {{rest.event.Number_of_requests}} / {{rest.event.Max_size_for_request_queues}}
            $("#request_number").empty();
            $("#request_number").append("<li><span class='label'>" + gettext('Number of Domogik requests') + ": </span>" + data.event.Number_of_Domogik_events_requests + "</li>")
            $("#request_number").append("<li><span class='label'>" + gettext('Number of devices requests') + ": </span>" + data.event.Number_of_devices_events_requests + "</li>")
            $("#request_number").append("<li><span class='label'>" + gettext('Max size for request queues') + ": </span>" + data.event.Max_size_for_request_queues + "</li>")
            
            // Domogik Request list
            $("#domogik_request_list").dataTable().fnClearTable();
            $.each(data.event.Domogik_requests, function(index, request) {
                var creation_date = new Date(request.creation_date * 1000);
                var last_access_date = new Date(request.last_access_date * 1000);
                $("#domogik_request_list").dataTable().fnAddData( [
                    index,
                    creation_date.toLocaleString(),
                    last_access_date.toLocaleString(),
                    request.queue_size,
                    request.instance.unfinished_tasks,
                    request.instance.maxsize
                ]);
            });

            // Devices Request list
            $("#devices_request_list").dataTable().fnClearTable();
            $.each(data.event.Devices_requests, function(index, request) {
                var creation_date = new Date(request.creation_date * 1000);
                var last_access_date = new Date(request.last_access_date * 1000);
                $("#devices_request_list").dataTable().fnAddData( [
                    index,
                    creation_date.toLocaleString(),
                    last_access_date.toLocaleString(),
                    request.device_id_list,
                    request.queue_size,
                    request.instance.unfinished_tasks,
                    request.instance.maxsize
                ]);
            });
        })
        .fail(function(jqXHR, status, error){
            if (jqXHR.status == 400)
                $.notification('error', jqXHR.responseText);
        });
}