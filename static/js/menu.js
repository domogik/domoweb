(function(){
	var button = document.getElementById('cn-button'),
    wrapper = document.getElementById('cn-wrapper'),
    overlay = document.getElementById('cn-overlay');

	//open and close menu when the button is clicked
	var open = false;
	button.addEventListener('click', handler, false);
	wrapper.addEventListener('click', cnhandle, false);

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

})();

