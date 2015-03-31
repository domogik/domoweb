DMW.grid = DMW.grid || {};

DMW.grid.draggables = [];

DMW.grid.widgetsize = 100; // px
DMW.grid.widgetspace = 20; // px
DMW.grid.matrix = null;
DMW.grid.draggables = []

DMW.grid.init = function () {
	DMW.grid.browserWidth = window.innerWidth;
	DMW.grid.browserHeight = window.innerHeight;
	DMW.grid.sizeX = Math.floor(DMW.grid.browserWidth / (DMW.grid.widgetsize + DMW.grid.widgetspace));
	DMW.grid.sizeY = Math.floor(DMW.grid.browserHeight / (DMW.grid.widgetsize + DMW.grid.widgetspace));
	DMW.grid.marginLeft = Math.floor((DMW.grid.browserWidth - (DMW.grid.sizeX * DMW.grid.widgetsize) - ((DMW.grid.sizeX-1) * DMW.grid.widgetspace)) / 2);
	DMW.grid.marginTop = Math.floor((DMW.grid.browserHeight - (DMW.grid.sizeY * DMW.grid.widgetsize) - ((DMW.grid.sizeY-1) * DMW.grid.widgetspace)) / 2);

	DMW.grid.matrix = [];

	// Placement matrix creation
	for(var i=0; i<DMW.grid.sizeY; i++) {
		DMW.grid.matrix[i] = new Array(DMW.grid.sizeX);
	}

	// Insert style
	var ss = document.getElementById('gridstyle');
	ss.sheet.insertRule("#grid-layout .dropZone { z-index:0; position: absolute; width: " + DMW.grid.widgetsize + "px; height: " + DMW.grid.widgetsize + "px;}", ss.sheet.cssRules.length);
	ss.sheet.insertRule("#grid-layout .dropZone.highlight { background-color: rgba(255, 255, 255, 0.5);", ss.sheet.cssRules.length);
	ss.sheet.insertRule("#grid-layout .widget { width: " + DMW.grid.widgetsize + "px; height: " + DMW.grid.widgetsize + "px; transform-style: flat;}", ss.sheet.cssRules.length);
	for (var i=2; i <= 7; i++) {
		// Calculate the pixel size of widgets
		var px = i * DMW.grid.widgetsize + (i-1) * DMW.grid.widgetspace;
		ss.sheet.insertRule("#grid-layout .widget.widgetw" + i + ", #grid-layout .dropZone.widgetw" + i + " { width: " + px + "px; }", ss.sheet.cssRules.length);
		ss.sheet.insertRule("#grid-layout .widget.widgeth" + i + ", #grid-layout .dropZone.widgeth" + i + " { height: " + px + "px; }", ss.sheet.cssRules.length);
	}
};

DMW.grid.removeInstance = function(instance) {
	for(var i=0; i<DMW.grid.matrix.length; i++) {
		for(var j=0; j<DMW.grid.matrix[i].length; j++) {
			if (DMW.grid.matrix[i][j] == parseInt(instance.id)) {
				DMW.grid.matrix[i][j] = null;
			}
		}
	}
};

DMW.grid.appendInstance = function(node, instance) {
	DMW.grid.placeNode(node, instance.x, instance.y);
	node.dataset.h = instance.widget.height;
	node.dataset.w = instance.widget.width;
	node.dataset.x = instance.x;
	node.dataset.y = instance.y;

	for(var i=instance.y; i<instance.y+instance.widget.height; i++) {
		for(var j=instance.x; j<instance.x+instance.widget.width; j++) {
			DMW.grid.matrix[i][j] = parseInt(instance.id);
		}
	}
};

DMW.grid.moveInstance = function(node, instance) {
	DMW.grid.removeInstance(instance);
	DMW.grid.appendInstance(node, instance);
};

DMW.grid.locationChanged = function(node, x, y) {
	DMW.main.socket.send("widgetinstance-location", {'instance_id':node.getAttribute('instanceid'), 'x':x, 'y':y});
};

DMW.grid.editChanged = function(value) {
	if (value == true) {
		// initialize draggable(s)
		[].slice.call(document.querySelectorAll( '.widget' )).forEach( function( el ) {
			DMW.grid.draggables.push( new Draggable( el, {
				draggabilly : { containment: document.body },
				onStart : function(instance) {
					var el = instance.el;
					var droppableArr = [];
					// insert drop zones
					for(var y=0; y<DMW.grid.matrix.length; y++) {
						for(var x=0; x<DMW.grid.matrix[y].length; x++) {
							if (DMW.grid.hasEnoughSpace(x, y, el.dataset.w, el.dataset.h, el.getAttribute('instanceid'))) {
								var zone = DMW.grid.insertDropzone(x, y, el.dataset.w, el.dataset.h);
								droppableArr.push( new Droppable( zone, {
									dropMargin : DMW.grid.widgetsize/2,
									onDrop : function( instance, draggableEl, changed ) {
										var el = instance.el;
										// If the widget was moved
										if (changed) {
											DMW.grid.locationChanged(draggableEl, el.dataset.x, el.dataset.y);
										}
									}
								} ) );
							}
						}
					}
					instance.updateDroppables(droppableArr);
				},
				onEnd : function(wasDropped) {
					// Remove all drop zones
					var elements = document.querySelectorAll(".dropZone");
					Array.prototype.forEach.call( elements, function( node ) {
					    node.parentNode.removeChild( node );
					});
				},
				testChanged: function(droppableEl, draggableEl) {
					return (draggableEl.dataset.x != droppableEl.dataset.x || draggableEl.dataset.y != droppableEl.dataset.y); 
				}

			} ) );
		} );
	} else {
		Array.prototype.forEach.call( DMW.grid.draggables, function( draggables ) {
			draggables.destroy();
		});
		DMW.grid.draggables = [];
	}
};

DMW.grid.insertDropzone = function(x, y, w, h) {
	var zone = document.createElement('div');
	zone.className = "dropZone widgetw" + w + " widgeth" + h;
	zone.dataset.x = x;
	zone.dataset.y = y;
	DMW.grid.placeNode(zone, x, y);
	DMW.main.layout.appendChild(zone);
	return zone;
};

DMW.grid.placeNode = function(node, x, y) {
	var top = DMW.grid.marginTop;
	var left = DMW.grid.marginLeft;

	top += y * (DMW.grid.widgetsize + DMW.grid.widgetspace);
	left += x * (DMW.grid.widgetsize + DMW.grid.widgetspace);
	node.style.top = top + "px";
	node.style.left = left + "px";
};

DMW.grid.firstEmptyPosition = function(w, h) {
	for(var y=0; y<DMW.grid.matrix.length; y++) {
		for(var x=0; x<DMW.grid.matrix[y].length; x++) {
			// Find the first empty space, that matches the widget size
			var isAvailable = true;
			var i = 0;
			while (isAvailable && i <= (h-1)) {
				var j = 0;
				while (isAvailable && j <= (w-1)) {
					if (DMW.grid.matrix[y+i][x+j] != null) {
						isAvailable = false;
					}
					j++;
				}
				i++;
			}
			if (isAvailable) {
				return [x, y];
			}
		}
	}
};

DMW.grid.hasEnoughSpace = function(x, y, w, h, id) {
	var isAvailable = true;
	y = parseInt(y)
	x = parseInt(x)
	w = parseInt(w)
	h = parseInt(h)
	var i = y;

	// If does exeed the matrix length
	if (DMW.grid.matrix.length < (y+h) || DMW.grid.matrix[0].length < (x+w)) {
		isAvailable = false;
	}
	// If not we test the matrix content
	while (isAvailable && i <= (y+h-1)) {
		var j = x;
		while (isAvailable && j <= (x+w-1)) {
			if (DMW.grid.matrix[i][j] != null && DMW.grid.matrix[i][j] != id) {
				isAvailable = false;
			}
			j++;
		}
		i++;
	}
	return isAvailable;
};