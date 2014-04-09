(function(){
	var button = document.querySelector('#cn-button'),
    wrapper = document.querySelector('#cn-wrapper'),
    overlay = document.querySelector('#cn-overlay'),
    menuConfigure = document.querySelector('#menuConfigure'),
    menuWidgets = document.querySelector('#menuWidgets'),
    panelConfigure = document.querySelector('#panelConfigure'),
    main = document.querySelector('main');

	//open and close menu when the button is clicked
	var open = false;
	button.addEventListener('click', handler, false);
	wrapper.addEventListener('click', cnhandle, false);
	menuConfigure.addEventListener('click', configureHandler, false);
	menuWidgets.addEventListener('click', widgetsHandler, false);

	function cnhandle(e){
		e.stopPropagation();
	}

	function handler(e){
		if (!e) var e = window.event;
	 	e.stopPropagation();//so that it doesn't trigger click event on document

	  	if(!open){
	    	openNav();
	  	}
	 	else{
	    	closeNav();
	  	}
	}
	function openNav(){
		open = true;
	    button.innerHTML = "<span class='sr-only'>Close Menu</span>";
	    overlay.classList.add('on-overlay');
	    wrapper.classList.add('opened-nav');
	}
	function closeNav(){
		open = false;
		button.innerHTML = "<span class='sr-only'>Open Menu</span>";
	    overlay.classList.remove('on-overlay');
	    wrapper.classList.remove('opened-nav');
	}
	document.addEventListener('click', closeNav);

	function configureHandler(){
		panelConfigure.classList.remove('hidden');
		closeNav();
	}

	function widgetsHandler(){
		var b = document.createElement('button');
		b.addEventListener('click',widgetSelection,false);
		b.classList.add('btn', 'btn-primary', 'btn-lg');
		b.innerHTML = 'Add Widget';
		main.appendChild(b);
		closeNav();
	}

	function widgetSelection(){
        var link = document.querySelector('link[rel=import]#widgetSelector');
        var template = link.import.querySelector('#widgets-list-template');
        document.body.appendChild(document.importNode(template.content, true));
		buttons = document.querySelectorAll('.addWidget');
		for (var i = 0; i < buttons.length; i++) {
		    var button = buttons[i];
		    button.addEventListener('click', appendWidget, false);
		}

		var buttonClose = document.querySelector("#remove-widgets-list");
		buttonClose.addEventListener('click',widgetSelectionClose,false);
	}
})();

