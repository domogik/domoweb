DMW.grid = DMW.grid || {};

DMW.grid.draggables = [];

DMW.grid.init = function () {
	DMW.grid.packery = new Packery(DMW.main.layout, {
	  	// options
	  	itemSelector: '.widget',
	  	gutter: 20,
	  	columnWidth: 100,
		rowHeight: 100,
	});
	var instances = DMW.main.layout.querySelectorAll('.widget');
	for ( var i=0, len = instances.length; i < len; i++ ) {
		var instance = instances[i];
		var draggie = new Draggabilly(instance);
		DMW.grid.draggables[instance.getAttribute('instanceid')] = draggie;
		draggie.disable();
	  	// bind Draggabilly events to Packery
	  	DMW.grid.packery.bindDraggabillyEvents( draggie );
	}
	DMW.grid.packery.on( 'dragItemPositioned', DMW.grid.orderChanged );
};

DMW.grid.destroy = function() {
	if (DMW.grid.packery) DMW.grid.packery.destroy()
	DMW.grid.draggables = [];
};

DMW.grid.removedInstance = function(instance) {
	delete DMW.grid.draggables[instance.getAttribute('instanceid')];
	DMW.grid.packery.remove(instance);	
	DMW.grid.packery.layout();
};

DMW.grid.appendedInstance = function(instance) {
	DMW.grid.packery.appended(instance);
    DMW.grid.packery.layout();

	var draggie = new Draggabilly(instance);
	DMW.grid.draggables[instance.getAttribute('instanceid')] = draggie;
	if (DMW.main.edit == false) {
		draggie.disable();
	}
  	// bind Draggabilly events to Packery
  	DMW.grid.packery.bindDraggabillyEvents( draggie );
};

DMW.grid.orderChanged = function() {
	var itemElems = DMW.grid.packery.getItemElements();
	for ( var i=0, len = itemElems.length; i < len; i++ ) {
		var elem = itemElems[i];
		DMW.main.socket.send("widgetinstance-order", {'instance_id':elem.getAttribute('instanceid'), 'order':i+1});
	}
};

DMW.grid.editChanged = function(value) {
	for (var id in DMW.grid.draggables) {
	    if (value == true) {
		  	DMW.grid.draggables[id].enable();
	    } else {
		  	DMW.grid.draggables[id].disable();
	    }
	}
};
