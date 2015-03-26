DMW.grid = DMW.grid || {};

DMW.grid.draggables = [];

DMW.grid.widgetsize = 100; // px
DMW.grid.widgetspace = 20; // px
DMW.grid.matrix = null;

DMW.grid.init = function () {
	DMW.grid.browserWidth = window.innerWidth;
	DMW.grid.browserHeight = window.innerHeight;
	DMW.grid.sizeX = Math.floor(DMW.grid.browserWidth / DMW.grid.widgetsize);
	DMW.grid.sizeY = Math.floor(DMW.grid.browserHeight / DMW.grid.widgetsize);
	DMW.grid.marginLeft = Math.floor((DMW.grid.browserWidth - (DMW.grid.sizeX * DMW.grid.widgetsize)) / 2);
	DMW.grid.marginTop = Math.floor((DMW.grid.browserHeight - (DMW.grid.sizeY * DMW.grid.widgetsize)) / 2);

	DMW.grid.matrix = [];

	// Placement matrix creation
	for(var i=0; i<DMW.grid.sizeY; i++) {
		DMW.grid.matrix[i] = new Array(DMW.grid.sizeX);
	}

	// Insert style
	var ss = document.getElementById('gridstyle');
	ss.sheet.insertRule("#grid-layout .widget { width: " + DMW.grid.widgetsize + "px; height: " + DMW.grid.widgetsize + "px;}");
	for (var i=2; i <= 7; i++) {
		// Calculate the pixel size of widgets
		var px = i * DMW.grid.widgetsize + (i-1) * DMW.grid.widgetspace;
		ss.sheet.insertRule("#grid-layout .widget.widgetw" + i + " { width: " + px + "px; }");
		ss.sheet.insertRule("#grid-layout .widget.widgeth" + i + " { height: " + px + "px; }");
	}
};

DMW.grid.removedInstance = function(node, instance) {
	for(var y=instance.y; y<instance.y + instance.widget.height; y++) {
		for(var x=instance.x; x<instance.x + instance.widget.width; x++) {
			DMW.grid.matrix[y][x] = null;
		}
	}
};

DMW.grid.appendedInstance = function(node, instance) {
	var top = DMW.grid.marginTop;
	var left = DMW.grid.marginLeft;

	top += instance.y * (DMW.grid.widgetsize + DMW.grid.widgetspace);
	left += instance.x * (DMW.grid.widgetsize + DMW.grid.widgetspace);

	node.style.top = top + "px";
	node.style.left = left + "px";
	
	for(var y=instance.y; y<instance.y + instance.widget.height; y++) {
		for(var x=instance.x; x<instance.x + instance.widget.width; x++) {
			DMW.grid.matrix[y][x] = instance.id;
		}
	}
};

DMW.grid.orderChanged = function() {
};

DMW.grid.editChanged = function(value) {
	if (value == true) {
		var draggableElems = document.querySelectorAll('.widget');
		// array of Draggabillies
		var draggies = []
		// init Draggabillies
		for ( var i=0, len = draggableElems.length; i < len; i++ ) {
  			var draggableElem = draggableElems[i];
  			var draggie = new Draggabilly( draggableElem, {
    			// options...
  			});
		  draggies.push( draggie );
		}
	}
};

DMW.grid.firstEmptyPosition = function(w, h) {
	for(var y=0; y<DMW.grid.matrix.length; y++) {
		for(var x=0; x<DMW.grid.matrix[y].length; x++) {
			// Find the first empty space, that matches the widget size
			var isAvailable = true;
			var i = 0;
			while (isAvailable && i <= (w-1)) {
				var j = 0;
				while (isAvailable && j <= (h-1)) {
					if (DMW.grid.matrix[y+j][x+i] != null) {
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