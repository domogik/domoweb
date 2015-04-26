DMW.grid = DMW.grid || {};

DMW.grid.draggables = [];

DMW.grid.matrix = null;
DMW.grid.list =null;
DMW.grid.draggables = [];
DMW.grid.edit = false;


DMW.grid.init = function (sizeX, sizeY, widgetSize, widgetSpace) {
	DMW.grid.setParams(sizeX, sizeY, widgetSize, widgetSpace);
	// Placement matrix creation
	DMW.grid.initMatrix(DMW.grid.sizeX, DMW.grid.sizeY);
	DMW.grid.list = []
	DMW.grid.setCSSstyle();
};

DMW.grid.refresh = function (sizeX, sizeY, widgetSize, widgetSpace) {
	DMW.grid.setParams(sizeX, sizeY, widgetSize, widgetSpace);
	// Update matrix size
	var removed = DMW.grid.resizeMatrix(DMW.grid.sizeX, DMW.grid.sizeY);

	// Remove deleted node from list
	for(var i=0; i<removed.length; i++) {
		delete DMW.grid.list[i];
	}
	// Update nodes location after grid resize
	for(var i in DMW.grid.list) {
		if (DMW.grid.list.hasOwnProperty(i)) {
			var item = DMW.grid.list[i];
			DMW.grid.placeNode(item['node'], item['x'], item['y']);			
		}
	}

	DMW.grid.setCSSstyle();
	return removed;
};

DMW.grid.setParams = function (sizeX, sizeY, widgetSize, widgetSpace) {
	DMW.grid.browserWidth = window.innerWidth;
	DMW.grid.browserHeight = window.innerHeight;
	if (sizeX && sizeY) {
		DMW.grid.sizeX = parseInt(sizeX);
		DMW.grid.sizeY = parseInt(sizeY);
		if (widgetSize) {
			DMW.grid.widgetSize = parseInt(widgetSize);
			DMW.grid.widgetSpace = DMW.grid.generateWidgetSpace(DMW.grid.sizeX, DMW.grid.widgetSize);
		} else {
			DMW.grid.widgetSpace = parseInt(widgetSpace)
			DMW.grid.widgetSize = DMW.grid.generateWidgetSize(DMW.grid.sizeX, DMW.grid.widgetSpace);
		}
	} else if (widgetSize) {
		DMW.grid.widgetSize = parseInt(widgetSize);
		DMW.grid.widgetSpace = parseInt(widgetSpace);
		DMW.grid.sizeX = DMW.grid.generateSizeX(DMW.grid.widgetSize, DMW.grid.widgetSpace);
		DMW.grid.sizeY = DMW.grid.generateSizeY(DMW.grid.widgetSize, DMW.grid.widgetSpace);
	}

	DMW.grid.marginLeft = Math.floor((DMW.grid.browserWidth - (DMW.grid.sizeX * DMW.grid.widgetSize) - ((DMW.grid.sizeX-1) * DMW.grid.widgetSpace)) / 2);
	DMW.grid.marginTop = Math.floor((DMW.grid.browserHeight - (DMW.grid.sizeY * DMW.grid.widgetSize) - ((DMW.grid.sizeY-1) * DMW.grid.widgetSpace)) / 2);
};

DMW.grid.setCSSstyle = function () {
	// Insert style
	var ss = document.getElementById('gridstyle');
	ss.innerHTML = "";
	ss.sheet.insertRule("#grid-layout .dropZone { z-index:0; position: absolute; width: " + DMW.grid.widgetSize + "px; height: " + DMW.grid.widgetSize + "px;}", ss.sheet.cssRules.length);
	ss.sheet.insertRule("#grid-layout .dropZone.highlight { background-color: rgba(255, 255, 255, 0.5);}", ss.sheet.cssRules.length);
	ss.sheet.insertRule("#grid-layout .widget { width: " + DMW.grid.widgetSize + "px; height: " + DMW.grid.widgetSize + "px; transform-style: flat;}", ss.sheet.cssRules.length);
	for (var i=2; i <= 7; i++) {
		// Calculate the pixel size of widgets
		var px = i * DMW.grid.widgetSize + (i-1) * DMW.grid.widgetSpace;
		ss.sheet.insertRule("#grid-layout .widget.widgetw" + i + ", #grid-layout .dropZone.widgetw" + i + " { width: " + px + "px; }", ss.sheet.cssRules.length);
		ss.sheet.insertRule("#grid-layout .widget.widgeth" + i + ", #grid-layout .dropZone.widgeth" + i + " { height: " + px + "px; }", ss.sheet.cssRules.length);
	}
};

DMW.grid.initMatrix = function(x, y) {
	DMW.grid.matrix = [];
	for(var i=0; i<y; i++) {
		DMW.grid.matrix[i] = new Array(x);
	}
};

DMW.grid.resizeMatrix = function(x, y) {
	var tmp = DMW.grid.matrix;
	DMW.grid.initMatrix(x, y);
	var outside = [];
	// Find Widgets outside the matrix
	if (tmp.length > y) {
		for(var i=y; i<tmp.length; i++) {
			for(var j=0; j<tmp[0].length; j++) {
				if (tmp[i][j] != null && outside.indexOf(tmp[i][j]) < 0) {
					outside.push(tmp[i][j]);
				}
			}
		}
	}
	if (tmp[0].length > x) {
		for(var j=x; j<tmp[0].length; j++) {
			for(var i=0; i<y; i++) {
				if (tmp[i][j] != null && outside.indexOf(tmp[i][j]) < 0) {
					outside.push(tmp[i][j]);
				}
			}
		}
	}
	// Copy existing values
	for(var i=0; i<tmp.length; i++) {
		for(var j=0; j<tmp[0].length; j++) {
			if (DMW.grid.matrix[i] !== undefined && DMW.grid.matrix[i][j] !== undefined && outside.indexOf(tmp[i][j]) < 0) {
				DMW.grid.matrix[i][j] = tmp[i][j];
			}
		}
	}

	return outside;
};

DMW.grid.generateSizeX = function(widgetSize, widgetSpace) {
	return Math.floor((DMW.grid.browserWidth + widgetSpace) / (widgetSize + widgetSpace));
};

DMW.grid.generateSizeY = function(widgetSize, widgetSpace) {
	return Math.floor((DMW.grid.browserHeight + widgetSpace) / (widgetSize + widgetSpace));
};

DMW.grid.generateWidgetSize = function(sizeX, widgetSpace) {
	return Math.floor((DMW.grid.browserWidth - ((sizeX + 1) * widgetSpace)) / sizeX);
};

DMW.grid.generateWidgetSpace = function(sizeX, widgetSize) {
	return Math.floor((DMW.grid.browserWidth - (sizeX * widgetSpace)) / (sizeX + 1));
};

DMW.grid.checkValues = function (sizeX, sizeY, widgetSize, widgetSpace) {
	if (sizeX && sizeY && widgetSize && widgetSpace) {
		return "Error: To many parameters";
	}
	if ((sizeX && !sizeY) || (!sizeX && sizeY) || (sizeX && sizeY && !widgetSize && !widgetSpace) || (!sizeX && !sizeY && !widgetSize && widgetSpace) || (!sizeX && !sizeY && widgetSize && !widgetSpace)) {
		return "Error: Missing a parameter";
	}

	if (sizeX && sizeY) {
		sizeX = parseInt(sizeX);
		sizeY = parseInt(sizeY);
		if (widgetSize) {
			widgetSize = parseInt(widgetSize);
			widgetSpace = DMW.grid.generateWidgetSpace(sizeX, widgetSize);
		} else {
			widgetSpace = parseInt(widgetSpace)
			widgetSize = DMW.grid.generateWidgetSize(sizeX, widgetSpace);
		}
	} else if (widgetSize) {
		widgetSize = parseInt(widgetSize);
		widgetSpace = parseInt(widgetSpace);
		sizeX = DMW.grid.generateSizeX(widgetSize, widgetSpace);
		sizeY = DMW.grid.generateSizeY(widgetSize, widgetSpace);
	}

	// Check if it is not bigger than the browser size
	if (sizeX == 0 || sizeY == 0) {
		return "Error: Grid too small Width:" + sizeX + " Height:" + sizeY;
	} else if ((sizeX * widgetSize + (sizeX - 1) * widgetSpace) > DMW.grid.browserWidth) {
		return "Error: This combination (" + (sizeX * widgetSize + (sizeX - 1) * widgetSpace) + ") is bigger than the browser width (" + DMW.grid.browserWidth + ")";
	} else if ((sizeY * widgetSize + (sizeY - 1) * widgetSpace) > DMW.grid.browserHeight) {
		return "Error: This combination (" + (sizeY * widgetSize + (sizeY - 1) * widgetSpace) + ") is bigger than the browser height (" + DMW.grid.browserHeight + ")";
	} else {
		return "OK: Grid size " + sizeX + "x" + sizeY + " - Widgets size " + widgetSize + "px - Widgets space " + widgetSpace + "px";
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
	delete DMW.grid.list[parseInt(instance.id)];
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

	DMW.grid.list[parseInt(instance.id)] = {'node':node, 'x':instance.x, 'y':instance.y};

	if (DMW.grid.edit) DMW.grid.addDraggable(node);
};

DMW.grid.moveInstance = function(node, instance) {
	DMW.grid.removeInstance(instance);
	DMW.grid.appendInstance(node, instance);
};

DMW.grid.locationChanged = function(node, x, y) {
	DMW.main.socket.send("widgetinstance-location", {'instance_id':node.getAttribute('instanceid'), 'x':x, 'y':y});
};

DMW.grid.addDraggable = function(el) {
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
							dropMargin : DMW.grid.widgetSize/2,
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
};

DMW.grid.editChanged = function(value) {
	DMW.grid.edit = value;
	if (value == true) {
		// initialize draggable(s)
		[].slice.call(document.querySelectorAll( '.widget' )).forEach( function( el ) {
			DMW.grid.addDraggable(el);
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

	top += y * (DMW.grid.widgetSize + DMW.grid.widgetSpace);
	left += x * (DMW.grid.widgetSize + DMW.grid.widgetSpace);
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