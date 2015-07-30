DMW.grid = DMW.grid || {};

DMW.grid.draggables = [];

DMW.grid.matrix = null;
DMW.grid.list =null;
DMW.grid.draggables = [];
DMW.grid.edit = false;

/**
 * init - called when a section is loaded
 * @param  columns - the section configured horizontal number of widgets
 * @param  rows - the section configured vertical number of widgets
 * @param  widgetSize - The size of widgets
 * @param  widgetSpace - The size between widgets
 */
DMW.grid.init = function (mode, columns, rows, widgetSize, widgetSpace) {
	DMW.grid.setParams(mode, columns, rows, widgetSize, widgetSpace);
	// Placement matrix creation
	DMW.grid.matrix = [];
	for(var i=0; i<DMW.grid.rows; i++) {
		DMW.grid.matrix[i] = new Array(DMW.grid.columns);
	}

	DMW.grid.list = [];
	DMW.grid.setCSSstyle();
};

DMW.grid.refresh = function (mode, columns, rows, widgetSize, widgetSpace) {
	DMW.grid.setParams(mode, columns, rows, widgetSize, widgetSpace);
	// Update matrix size
	var removed = DMW.grid.resizeMatrix(DMW.grid.columns, DMW.grid.rows);

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

DMW.grid.browserWidth = function() { return window.innerWidth; };
DMW.grid.browserHeight = function() { return window.innerHeight; };

/**
 * setParams - generate the missing grid parameters base on the mode, and the provided values
 * @param mode        The grid mode
 * @param columns       The grid horizontal number
 * @param rows       The grid vertical number
 * @param widgetSize  The widgets size
 * @param widgetSpace The space between widgets
 */
DMW.grid.setParams = function (mode, columns, rows, widgetSize, widgetSpace) {
	DMW.grid.mode = parseInt(mode);
	switch(DMW.grid.mode) {
		case 1:
			DMW.grid.columns = parseInt(columns);
			DMW.grid.rows = parseInt(rows);
			DMW.grid.widgetSize = parseInt(widgetSize);
			DMW.grid.widgetSpace = DMW.grid.generateWidgetSpace(DMW.grid.columns, DMW.grid.widgetSize);
			if (DMW.grid.widgetSpace < 0) DMW.grid.widgetSpace = 0;
			break;
		case 2:
			DMW.grid.columns = parseInt(columns);
			DMW.grid.rows = parseInt(rows);
			DMW.grid.widgetSpace = parseInt(widgetSpace)
			DMW.grid.widgetSize = DMW.grid.generateWidgetSize(DMW.grid.columns, DMW.grid.widgetSpace);
			if (DMW.grid.widgetSize < 50) DMW.grid.widgetSize = 50;
			break;
		case 3:
			DMW.grid.widgetSize = parseInt(widgetSize);
			DMW.grid.widgetSpace = parseInt(widgetSpace);
			DMW.grid.columns = DMW.grid.generateSizeX(DMW.grid.widgetSize, DMW.grid.widgetSpace);
			DMW.grid.rows = DMW.grid.generateSizeY(DMW.grid.widgetSize, DMW.grid.widgetSpace);
			break;
	}

	DMW.grid.marginLeft = Math.floor((DMW.grid.browserWidth() - (DMW.grid.columns * DMW.grid.widgetSize) - ((DMW.grid.columns-1) * DMW.grid.widgetSpace)) / 2);
	if (DMW.grid.marginLeft < 0) DMW.grid.marginLeft = 0;

	DMW.grid.marginTop = Math.floor((DMW.grid.browserHeight() - (DMW.grid.rows * DMW.grid.widgetSize) - ((DMW.grid.rows-1) * DMW.grid.widgetSpace)) / 2);
	if (DMW.grid.marginTop < 0) DMW.grid.marginTop = 0;
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


/**
 * adjustPlacement - Adjust grid and widgets positions to match browser size
 * This method is called on browser resize event
 * 
 */
DMW.grid.adjustPlacement = function() {
	if (DMW.grid.mode == 1) {
		DMW.grid.adjustMode1();
	} else if (DMW.grid.mode == 2) {
		DMW.grid.adjustMode2();
	} else if (DMW.grid.mode == 3) {
		DMW.grid.adjustMode3();
	}
};

DMW.grid.adjustMode1 = function() {
	// Adjust spaces between elements
	DMW.grid.setParams(DMW.grid.mode, DMW.grid.columns, DMW.grid.rows, DMW.grid.widgetSize, null);
	// Update nodes location after grid resize
	for(var i in DMW.grid.list) {
		if (DMW.grid.list.hasOwnProperty(i)) {
			var item = DMW.grid.list[i];
			DMW.grid.placeNode(item['node'], item['x'], item['y']);			
		}
	}
	DMW.grid.setCSSstyle();
}

DMW.grid.adjustMode2 = function() {
	// Adjust widget size
	DMW.grid.setParams(DMW.grid.mode, DMW.grid.columns, DMW.grid.rows, null, DMW.grid.widgetSpace);
	// Update nodes location after grid resize
	for(var i in DMW.grid.list) {
		if (DMW.grid.list.hasOwnProperty(i)) {
			var item = DMW.grid.list[i];
			DMW.grid.placeNode(item['node'], item['x'], item['y']);			
		}
	}
	DMW.grid.setCSSstyle();
}

DMW.grid.adjustMode3 = function() {
	var x = DMW.grid.generateSizeX(DMW.grid.widgetSize, DMW.grid.widgetSpace);
	var y = DMW.grid.generateSizeY(DMW.grid.widgetSize, DMW.grid.widgetSpace);
	if (x > 0) {
		DMW.grid.list = adjustMatrix(DMW.grid.list, DMW.grid.matrix, x, y);
		// Update nodes location after grid resize
		for(var i in DMW.grid.list) {
			if (DMW.grid.list.hasOwnProperty(i)) {
				var item = DMW.grid.list[i];
				if (item['status'] == 'moved') {
					DMW.grid.placeNode(item['node'], item['x'], item['y']);			
				}
			}
		}
	}
}

DMW.grid.generateSizeX = function(widgetSize, widgetSpace) {
	return Math.floor((DMW.grid.browserWidth() + widgetSpace) / (widgetSize + widgetSpace));
};

DMW.grid.generateSizeY = function(widgetSize, widgetSpace) {
	return Math.floor((DMW.grid.browserHeight() + widgetSpace) / (widgetSize + widgetSpace));
};

DMW.grid.generateWidgetSize = function(columns, widgetSpace) {
	return Math.floor((DMW.grid.browserWidth() - ((columns + 1) * widgetSpace)) / columns);
};

DMW.grid.generateWidgetSpace = function(columns, widgetSize) {
	return Math.floor((DMW.grid.browserWidth() - (columns * widgetSize)) / (columns + 1));
};

DMW.grid.checkValues = function (type, columns, rows, widgetSize, widgetSpace) {
	type = parseInt(type);
	columns = parseInt(columns);
	rows = parseInt(rows);
	widgetSize = parseInt(widgetSize);
	widgetSpace = parseInt(widgetSpace)
	if (type == 1) {
		if (!columns || !rows || !widgetSize) return "Error: Missing or incorrect parameter";
		widgetSpace = DMW.grid.generateWidgetSpace(columns, widgetSize);

	} else if (type == 2) {
		if (!columns || !rows || !widgetSpace) return "Error: Missing or incorrect parameter";
		widgetSize = DMW.grid.generateWidgetSize(columns, widgetSpace);

	} else if (type == 3) {
		if (!widgetSize || !widgetSpace) return "Error: Missing or incorrect parameter";
		columns = DMW.grid.generateSizeX(widgetSize, widgetSpace);
		rows = DMW.grid.generateSizeY(widgetSize, widgetSpace);
	} else
		return "Error: Unknown grid type";

	// Check if it is not bigger than the browser size
	if (columns == 0 || rows == 0) {
		return "Error: Grid too small Width:" + columns + " Height:" + rows;
	} else if ((columns * widgetSize + (columns - 1) * widgetSpace) > DMW.grid.browserWidth()) {
		return "Warning: This combination (" + columns + " col. = " + (columns * widgetSize + (columns - 1) * widgetSpace) + "px) is bigger than the browser width (" + DMW.grid.browserWidth() + "px)";
	} else if ((rows * widgetSize + (rows - 1) * widgetSpace) > DMW.grid.browserHeight()) {
		return "Warning: This combination (" + rows + " rows = " + (rows * widgetSize + (rows - 1) * widgetSpace) + "px) is bigger than the browser height (" + DMW.grid.browserHeight() + "px)";
	} else {
		return "Info: Grid size " + columns + "x" + rows + " - Widgets size " + widgetSize + "px - Widgets space " + widgetSpace + "px";
	}
};

DMW.grid.removeInstance = function(instance) {
	removeMatrix(DMW.grid.matrix, parseInt(instance.id));
	delete DMW.grid.list[parseInt(instance.id)];
};

DMW.grid.appendInstance = function(node, instance) {
	DMW.grid.placeNode(node, instance.x, instance.y);
	node.dataset.h = instance.widget.height;
	node.dataset.w = instance.widget.width;
	node.dataset.x = instance.x;
	node.dataset.y = instance.y;

	insertMatrix(DMW.grid.matrix, parseInt(instance.id), instance.x, instance.y, instance.widget.width, instance.widget.height);

	DMW.grid.list[parseInt(instance.id)] = {'node':node, 'x':instance.x, 'y':instance.y, 'originalX':instance.x, 'originalY':instance.y, 'width':instance.widget.width, 'height':instance.widget.height, 'status': null};

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
	return findEmptyPositionMatrix(DMW.grid.matrix, w, h);
};

DMW.grid.hasEnoughSpace = function(x, y, w, h, id) {
	var isAvailable = true;
	y = parseInt(y)
	x = parseInt(x)
	w = parseInt(w)
	h = parseInt(h)
	var i = y;

	// If does exeed the matrix size
	if (DMW.grid.rows < (y+h) || DMW.grid.columns < (x+w)) {
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

function insertMatrix(matrix, id, x, y, width, height) {
	// Resize Matrix if too small
	if (matrix.length < y+height) {
		for (var i=matrix.length; i<y+height; i++) {
			matrix[i] = [];
			for(var j=0; j<matrix[0].length; j++) {
				matrix[i][j] = null;
			}
		}
	}

	if (matrix[0].length < x+width) {
		for (var i=0; i<matrix.length; i++) {
			for (var j=matrix[0].length; j<x+width; j++) {
				matrix[i][j] = null;
			}
		}
	}

	// Place the node in matrix
	for(var i=y; i<y+height; i++) {
		for(var j=x; j<x+width; j++) {
			matrix[i][j] = id;
		}
	}
}

function removeMatrix(matrix, id) {
	for(var i=0; i<matrix.length; i++) {
		for(var j=0; j<matrix[i].length; j++) {
			if (matrix[i][j] == id) {
				matrix[i][j] = null;
			}
		}
	}	
}

function findEmptyPositionMatrix(matrix, w, h) {
	printMatrix(matrix);
	for(var y=0; y<matrix.length; y++) {
		for(var x=0; x<matrix[y].length; x++) {
			// Find the first empty space, that matches the widget size
			var isAvailable = true;
			var i = 0;
			while (isAvailable && i <= (h-1)) {
				var j = 0;
				while (isAvailable && j <= (w-1)) {
					if (matrix[y+i][x+j] != null) {
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
}

function findEmptyPositionMatrix2(matrix, columns, rows, w, h) {
	for(var y=0; y<rows; y++) {
		for(var x=0; x<columns; x++) {
			// Find the first empty space, that matches the widget size
			var isAvailable = true;
			var i = 0;
			while (isAvailable && i <= (h-1)) {
				var j = 0;
				while (isAvailable && j <= (w-1)) {
					if (matrix[y+i][x+j] != null) {
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
}

function adjustMatrix(list, matrix, columns, rows) {
	var placement = [];
	var outside = [];
	// Init placement matrix
	for (var i=0; i < matrix.length; i++) {
		placement[i] = matrix[i].slice();
	}
//	printMatrix(placement);

	// List elements outside the new matrix
	for (var i=0; i < placement.length; i++) {
		for (var j=columns; j < placement[0].length; j++) {
			if (placement[i][j] != null) {
				var id = placement[i][j];
				if (outside.indexOf(id) == -1) outside.push(id);
			}
		}
	}

	// Identify and move elements
	for(var id in DMW.grid.list) {
		if (DMW.grid.list.hasOwnProperty(id)) {
			id = parseInt(id);
			var item = DMW.grid.list[id];
			if (outside.indexOf(id) >= 0) {
				// Is outside the new matrix, and needs to be moved
				removeMatrix(placement, id);
				var newPos = findEmptyPositionMatrix2(placement, columns, rows, list[id]['width'], list[id]['height']);
				insertMatrix(placement, id, newPos[0], newPos[1], list[id]['width'], list[id]['height']);
				list[id]['status'] = 'moved';
				list[id]['x'] = newPos[0];
				list[id]['y'] = newPos[1];
			} else if (list[id]['x'] != list[id]['originalX'] || list[id]['y'] != list[id]['originalY']) {
				// Was previously moved, but need to be moved back
				list[id]['status'] = 'moved';
				list[id]['x'] = list[id]['originalX'];
				list[id]['y'] = list[id]['originalY'];
			} else {
				list[id]['status'] = null;
			}
		}
	}
//	printMatrix(placement);

	return list;
}

DMW.grid.hasResized = debounce(function() {
//	console.debug(DMW.grid.browserWidth(), DMW.grid.browserHeight());
	DMW.grid.adjustPlacement();
}, 100);

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};

function printMatrix(matrix) {
	var output = "";
	for (var i=0; i < matrix.length; i++) {
		output += "\n|";
		for (var j=0; j < matrix[i].length; j++) {
			if (matrix[i][j]) {
				if (parseInt(matrix[i][j]) > 9) {
					output += " " + matrix[i][j] + " |";
				} else {
					output += "  " + matrix[i][j] + " |";
				}
			} else {
				output += "    |";
			}
		}
	}
	console.debug(output);
}