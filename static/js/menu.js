DMW.menu = DMW.menu || {};

window.onload = function(){
	DMW.menu.init();
};

DMW.menu.init = function() {
	DMW.menu.items = [
		{'id':'menuConfigure',
		'label':i18n.t('menu.configuration')},
		{'id':'menuWidgets',
		'label':i18n.t('menu.widgets'),
		'childs': [
			{'id':'menuFinishWidgets',
			'label':i18n.t('menu.finishWidgets'),
			'close': true},
			{'id':'menuAddWidget',
			'label':i18n.t('menu.addWidget')}
		]},
		{'id':'menuSections',
		'label':i18n.t('menu.sections'),
		'childs': [
			{'id':'menuFinishSections',
			'label':i18n.t('menu.finishSections'),
			'close': true},
			{'id':'menuAddSection',
			'label':i18n.t('menu.addSection')}
		]}
	];
	DMW.menu.displayed = [];
	DMW.menu.open = false;
	DMW.menu.main = true;
	DMW.menu.root = document.getElementById('main-menu-root');
	DMW.menu.cnbutton = document.getElementById('cnbutton');
	DMW.menu.contentoverlay = document.getElementById('contentoverlay');
	DMW.menu.emptyoverlay = document.getElementById('emptyoverlay');
	DMW.menu.cnwrapper = document.getElementById('cnwrapper');
	DMW.menu.cnbutton.addEventListener('click', DMW.menu.handler, false);
	DMW.menu.cnwrapper.addEventListener('click', DMW.menu.cnhandle, false);
	document.addEventListener('click', DMW.menu.closeNav.bind(this));
	DMW.menu.displayItems(null);
};

DMW.menu.openNav = function(){
	DMW.menu.open = true;
    DMW.menu.cnbutton.innerHTML = "<span class='sr-only'>Close Menu</span>";
    if (DMW.menu.main) {
    	DMW.menu.contentoverlay.classList.add('on-overlay');
	} else {
    	DMW.menu.emptyoverlay.classList.add('on-overlay');
	}
    DMW.menu.cnwrapper.classList.add('opened-nav');
};
DMW.menu.closeNav = function(){
	DMW.menu.open = false;
	DMW.menu.cnbutton.innerHTML = "<span class='sr-only'>Open Menu</span>";
    if (DMW.menu.main) {
    	DMW.menu.contentoverlay.classList.remove('on-overlay');
	} else {
    	DMW.menu.emptyoverlay.classList.remove('on-overlay');
	}
    DMW.menu.cnwrapper.classList.remove('opened-nav');
};
DMW.menu.handler = function(e){
	if (!e) var e = window.event;
 	e.stopPropagation();//so that it doesn't trigger click event on document
  	if(!DMW.menu.open){
    	DMW.menu.openNav();
  	}
 	else{
    	DMW.menu.closeNav();
  	}
};
DMW.menu.cnhandle = function(e){
	e.stopPropagation();
};
DMW.menu.selectItem = function(e) {
  	var item = DMW.menu.findItem(DMW.menu.items, e.target.id);
  	if (item.childs) {
		DMW.menu.displayItems(item);
		DMW.menu.main = false;
    	DMW.menu.contentoverlay.classList.remove('on-overlay');
    	DMW.menu.emptyoverlay.classList.add('on-overlay');
  	} else {
		DMW.menu.closeNav();
  	}
  	if (item.close) {
		DMW.menu.displayItems(null);
		DMW.menu.main = true;
  	}
  	if (item.id) {
		switch(item.id) {
		    case 'menuConfigure':
		        configureHandler();
		        break;
		    case 'menuWidgets':
		        widgetsEditHandler();
		        break;
		    case 'menuFinishWidgets':
		        widgetsFinishHandler();
		        break;
		    case 'menuAddWidget':
			    addWidgetHandler();
		        break;
		    case 'menuAddSection':
			    addSectionHandler();
		        break;
		}
  	}
};

DMW.menu.findItem = function (treeNodes, searchID){
    for (var nodeIdx = 0; nodeIdx <= treeNodes.length-1; nodeIdx++) {
        var currentNode = treeNodes[nodeIdx],
            currentId = currentNode.id;
        if (currentId == searchID) {    
            return currentNode;
        }
        else {
        	if (currentNode.childs) {
	            var foundDescendant = DMW.menu.findItem(currentNode.childs, searchID); 
	            if (foundDescendant) {
	                return foundDescendant;
	            }        		
        	}
        }
    }
    return false;
};

DMW.menu.displayItems = function(parent) {
	var root = null
	if (parent === null) {
		root = DMW.menu.items;
	} else {
		root = parent.childs;
	}
	
	// Clean the menu
	while (DMW.menu.root.firstChild) {
  		DMW.menu.root.removeChild(DMW.menu.root.firstChild);
	}
	for (var i = 0; i < root.length; i++){
      	DMW.menu.appendMenu(root[i]);
	}
    // Add blank items
    for (i ; i < 5; i++) {
      	DMW.menu.appendMenu(null);
    }
};

DMW.menu.appendMenu = function(item) {
	var li = document.createElement('li');
	if (item) {
		var button = document.createElement('div');
		button.setAttribute('id', item.id);
		if (item.close) {
			button.setAttribute('class', 'menuitem finish');
		} else {
			button.setAttribute('class', 'menuitem');
		}
		button.setAttribute('role', 'button');
		button.setAttribute('tabindex', 0);
		button.addEventListener('click', DMW.menu.selectItem, false);

		var label = document.createElement('span');
		label.setAttribute('class', 'label');
		label.appendChild(document.createTextNode(item.label));
		button.appendChild(label);
		li.appendChild(button);
	} else {
		var button = document.createElement('div');
		button.setAttribute('class', 'menuitem');
		li.appendChild(button);		
	}
	DMW.menu.root.appendChild(li);
};