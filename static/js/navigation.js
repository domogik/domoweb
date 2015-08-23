DMW.navigation = DMW.navigation || {};

DMW.navigation.circleRadius = 80;
DMW.navigation.innerRing_items = 3;
DMW.navigation.middleRing_items = 5;
DMW.navigation.outerRing_items = 7;
DMW.navigation.innerRing_radius = 110;
DMW.navigation.middleRing_radius = 220;
DMW.navigation.outerRing_radius = 330;

DMW.navigation.radLevelOneShown = false;
DMW.navigation.radLevelTwoShown = false;
DMW.navigation.radLevelThreeShown = false;
DMW.navigation.$radFirstLevel = null;
DMW.navigation.$radSecondLevel = null;
DMW.navigation.$radLevelOneItems = null;
DMW.navigation.$radLevelTwoItems = null;
DMW.navigation.positionOne = null;
DMW.navigation.positionTwo = null;

var toRadians = Math.PI / 180;

DMW.navigation.init = function() {
	$('<style type="text/css">' +
		'.radial-menu-items { height:'+ DMW.navigation.circleRadius +'px; width:'+ DMW.navigation.circleRadius +'px; border-radius: '+ DMW.navigation.circleRadius +'px }'+
		'.radial-first-items { top: -'+ ($('#toggle-radial').outerHeight() + 2) +'px; left: -2px }'+
		'.radial-upper-items { top: -2px; left: -1px; }'+ 
		'.radial-menu-links { height:'+ DMW.navigation.circleRadius +'px; width:'+ DMW.navigation.circleRadius +'px; border-radius: '+ DMW.navigation.circleRadius +'px; }' +
	'</style>').appendTo('head');
	$('#sections-tree #toggle-radial').click(DMW.navigation.RadLevelOneToggle);
	DMW.navigation.register();
};

window.addEventListener('polymer-ready', function(){
    DMW.main.socket.register('section-added', DMW.navigation.sectionsUpdated);
    DMW.main.socket.register('section-removed', DMW.navigation.sectionsUpdated);
    DMW.main.socket.register('section-tree', DMW.navigation.sectionsReceived);
});


DMW.navigation.register = function() {
	$('#sections-tree > ul li').addClass('radial-menu-items');
	$('#sections-tree ul li > a').addClass('radial-menu-links');

	$('#sections-tree ul.level-1').addClass('hide');
	$('#sections-tree ul.level-1').addClass('radial-first-items');
	$('#sections-tree ul.level-2').addClass('hide');
	$('#sections-tree ul.level-2').addClass('radial-upper-items')
	$('#sections-tree ul.level-3').addClass('hide');
	$('#sections-tree ul.level-3').addClass('radial-upper-items')

	$('#sections-tree li > ul').parent().addClass('have-subs');
	// $('#sections-tree ul li > a').wrap('<div class="radial-label" />')
	$('#sections-tree ul.level-1 > li.have-subs > a').click(DMW.navigation.RadLevelTwoToggle);
	$('#sections-tree ul.level-2 > li.have-subs > a').click(DMW.navigation.RadLevelThreeToggle);

	var sections = document.querySelectorAll('#sections-tree ul li:not(.have-subs) > a');
	for (var i = sections.length - 1; i >= 0; i--) {
		sections[i].addEventListener('click', DMW.navigation.selectSection, false);
	};
}

DMW.navigation.selectSection = function(e) {
 	e.stopPropagation(); //so that it doesn't trigger click event on document
 	DMW.navigation.RadLevelOneToggle();
 	var id = e.target.dataset.section;
 	DMW.main.section.setAttribute('sectionid', id);
};

DMW.navigation.sectionsUpdated = function() {
	DMW.main.socket.send('section-gettree');
};

DMW.navigation.sectionsReceived = function(topic, json) {
	var root = DMW.main.navigation.querySelector('ul');
	DMW.main.navigation.removeChild(root);
	var nodes = DMW.navigation.generateLevelNodes(json);
	if (nodes) {
		DMW.main.navigation.appendChild(nodes);
	}
	DMW.navigation.register();
};

DMW.navigation.generateLevelNodes = function(section) {
	var childs = section['childs'];
	var newlevel = parseInt(section['level']) + 1;
	if (childs.length > 0) {
		var ul = document.createElement('ul');
		ul.setAttribute('class', 'level-' + newlevel);
		var li = document.createElement('li');
		li.setAttribute('class', 'level-main');
		var a = document.createElement('a');
		a.setAttribute('href','#');
		a.dataset.section = section['id'];
		a.appendChild(document.createTextNode(section['name']));
		li.appendChild(a);
		ul.appendChild(li);

		for (var i = 0; i < childs.length; i++) {
			child = childs[i];
			var li = document.createElement('li');
			var a = document.createElement('a');
			a.setAttribute('href','#');
			a.dataset.section = child['id'];
			a.appendChild(document.createTextNode(child['name']));
			li.appendChild(a);
			var nodes = DMW.navigation.generateLevelNodes(child);
			if (nodes) {
				li.appendChild(nodes);
			}
			ul.appendChild(li);
		};
		return ul;
	} else if (parseInt(section['level']) == 0) { // Root case
		var ul = document.createElement('ul');
		ul.setAttribute('class', 'level-' + newlevel);
		var li = document.createElement('li');
		li.setAttribute('class', 'level-main');
		var a = document.createElement('a');
		a.setAttribute('href','#');
		a.dataset.section = section['id'];
		a.appendChild(document.createTextNode(section['name']));
		li.appendChild(a);
		ul.appendChild(li);
		return ul;
	}
	return null;
};

/* ------------ Radial toggle button related behavior: Toggling level-1 Menu ------------*/
DMW.navigation.RadLevelOneToggle = function() {
	if(!DMW.navigation.radLevelOneShown){
		$(this).addClass('active');

		var $level1 = $('ul.level-1');
		DMW.navigation.toggleMenuItems(this, $level1);

		$('#sections-tree ul.level-1').removeClass('hide');
		$('#sections-tree ul.level-1').addClass('show');
		DMW.navigation.radLevelOneShown = true;
	} else {
		DMW.navigation.radLevelOneShown = false;
		$(this).removeClass('active');
		$('#sections-tree ul.level-1 > li').animate({ left: '0px', top: '0px' }, 150);
		$('#sections-tree ul.level-1').fadeOut(200, function(){
			$('#sections-tree ul.level-1 > li.have-subs').removeClass('active');
			$('#sections-tree ul.level-1').removeClass('show');
			$('#sections-tree ul.level-1').addClass('hide');
			if(DMW.navigation.radLevelTwoShown){
				DMW.navigation.$radFirstLevel.fadeTo(200, 1);
				DMW.navigation.$radLevelOneItems.bind('click', DMW.navigation.RadLevelTwoToggle);
				$('#sections-tree ul.level-2 > li').animate({ top: DMW.navigation.positionOne.top, left: DMW.navigation.positionOne.left }, 200);
				$('#sections-tree ul.level-2 > li.have-subs').removeClass('active');
				$('#sections-tree ul.level-2').removeClass('show');
				$('#sections-tree ul.level-2').addClass('hide');
				DMW.navigation.radLevelTwoShown = false;
			}
			if(DMW.navigation.radLevelThreeShown){
				DMW.navigation.$radSecondLevel.fadeTo(200, 1);
				DMW.navigation.$radLevelTwoItems.bind('click', DMW.navigation.RadLevelThreeToggle);
				$('#sections-tree ul.level-3 > li').animate({ top: DMW.navigation.positionTwo.top, left: DMW.navigation.positionTwo.left }, 200);
				$('#sections-tree ul.level-3').removeClass('show');
				$('#sections-tree ul.level-3').addClass('hide');
				DMW.navigation.radLevelThreeShown = false;
			}
		});	
	}
}

/* ------------ Radial toggle button related behavior: Toggling level-2 Menu ------------*/	
DMW.navigation.RadLevelTwoToggle = function() {
	DMW.navigation.$radFirstLevel = $(this).parent().siblings();
	DMW.navigation.$radLevelOneItems = $(this).parent().siblings('.have-subs').children('a');
	DMW.navigation.positionOne = $(this).position();
	if(!DMW.navigation.radLevelTwoShown){
		$(this).parent().addClass('active');
		DMW.navigation.$radFirstLevel.fadeTo(200, 0.1);
		DMW.navigation.$radLevelOneItems.unbind('click');

		var $level2 = ('ul.level-2');
		DMW.navigation.toggleMenuItems(this, $level2);

		$(this).parent().children('ul.level-2').removeClass('hide');
		$(this).parent().children('ul.level-2').addClass('show');
		DMW.navigation.radLevelTwoShown = true;
	} else {
		DMW.navigation.radLevelTwoShown = false;
		$(this).parent().removeClass('active');
		DMW.navigation.$radFirstLevel.fadeTo(200, 1);
		DMW.navigation.$radLevelOneItems.bind('click', DMW.navigation.RadLevelTwoToggle);
		$('#sections-tree ul.level-2 > li').animate({ top: DMW.navigation.positionOne.top, left: DMW.navigation.positionOne.left }, 200);		
		$('#sections-tree ul.level-2').fadeOut(200, function(){	
			$('#sections-tree ul.level-2 > li.have-subs').removeClass('active');	
			$('#sections-tree ul.level-2').removeClass('show');
			$('#sections-tree ul.level-2').addClass('hide');
			if(DMW.navigation.radLevelThreeShown){
				DMW.navigation.$radSecondLevel.fadeTo(200, 1);
				DMW.navigation.$radLevelTwoItems.bind('click', DMW.navigation.RadLevelThreeToggle);
				$('#sections-tree ul.level-3 > li').animate({ top: DMW.navigation.positionTwo.top, left: DMW.navigation.positionTwo.left }, 200);
				$('#sections-tree ul.level-3').removeClass('show');
				$('#sections-tree ul.level-3').addClass('hide');
				DMW.navigation.radLevelThreeShown = false;
			}
		});	
	}
}

/* ------------ Radial toggle button related behavior: Toggling level-3 Menu ------------*/
DMW.navigation.RadLevelThreeToggle = function() {
	DMW.navigation.$radSecondLevel = $(this).parent().siblings();
	DMW.navigation.$radLevelTwoItems = $(this).parent().siblings('.have-subs').children('a');
	DMW.navigation.positionTwo = $(this).position();
	if(!DMW.navigation.radLevelThreeShown){
		$(this).parent().addClass('active');
		DMW.navigation.$radSecondLevel.fadeTo(200, 0.1);
		DMW.navigation.$radLevelTwoItems.unbind('click');
		
		var $level3 = ('ul.level-3');
		DMW.navigation.toggleMenuItems(this, $level3);

		$(this).parent().children('ul.level-3').removeClass('hide');
		$(this).parent().children('ul.level-3').addClass('show');
		DMW.navigation.radLevelThreeShown = true;
	} else {
		DMW.navigation.radLevelThreeShown = false;	
		$(this).parent().removeClass('active');
		DMW.navigation.$radSecondLevel.fadeTo(200, 1);
		DMW.navigation.$radLevelTwoItems.bind('click', DMW.navigation.RadLevelThreeToggle);
		$('#sections-tree ul.level-3 > li').animate({ top: DMW.navigation.positionTwo.top, left: DMW.navigation.positionTwo.left }, 200);		
		$('#sections-tree ul.level-3').fadeOut(200, function(){				
			$('#sections-tree ul.level-3').removeClass('show');
			$('#sections-tree ul.level-3').addClass('hide');
		});	
	}
}

DMW.navigation.toggleMenuItems = function(node, selectParent) {
	var yPositionAdjust, xPositionAdjust;
		
	yPositionAdjust = (DMW.navigation.circleRadius - $(node).outerHeight())/2;
	xPositionAdjust = (DMW.navigation.circleRadius - $(node).outerHeight())/2;			

	var angleDegree = 0;

	var xPosMod = 1;
	var yPosMod = -1;

	var outerAngleIncrease = 90/(DMW.navigation.outerRing_items-1);
	var middleAngleIncrease = 90/(DMW.navigation.middleRing_items-1);
	var innerAngleIncrease = 90/(DMW.navigation.innerRing_items-1);

	/* ------------ Looping for INNER Ring - Sub-Menu level toggle and animation ------------*/		
	for( var index = 0; index < DMW.navigation.innerRing_items; index++ ){
	    angleRad = angleDegree * toRadians;
		xCoord = DMW.navigation.innerRing_radius * Math.cos( angleRad );
		yCoord = DMW.navigation.innerRing_radius * Math.sin( angleRad );	
		$(node).parent().children(selectParent).children(' li:nth-child('+ (index+1) +')').animate({ left: xCoord*xPosMod-xPositionAdjust , top: yCoord*yPosMod-yPositionAdjust}, 200);
		angleDegree += innerAngleIncrease;
	}

	angleDegree = 0;

	/* ------------ Looping for MIDDLE Ring - Sub-Menu level toggle and animation ------------*/	

	for( var index = DMW.navigation.innerRing_items; index < DMW.navigation.innerRing_items + DMW.navigation.middleRing_items; index++ ){
		angleRad = angleDegree * toRadians;
		xCoord = DMW.navigation.middleRing_radius * Math.cos( angleRad );
		yCoord = DMW.navigation.middleRing_radius * Math.sin( angleRad );			
		$(node).parent().children(selectParent).children(' li:nth-child('+ (index+1) +')').animate({ left: xCoord*xPosMod-xPositionAdjust, top: yCoord*yPosMod-yPositionAdjust }, 200);
		angleDegree += middleAngleIncrease;
	}
	/* ------------ Looping for OUTER Ring - Sub-Menu level toggle and animation ------------*/	

	angleDegree = 0;

	for( var index = DMW.navigation.innerRing_items + DMW.navigation.middleRing_items; index < DMW.navigation.innerRing_items + DMW.navigation.middleRing_items + DMW.navigation.outerRing_items; index++ ){
		angleRad = angleDegree * toRadians;
		xCoord = DMW.navigation.outerRing_radius * Math.cos( angleRad );
		yCoord = DMW.navigation.outerRing_radius * Math.sin( angleRad );			
		$(node).parent().children(selectParent).children(' li:nth-child('+ (index+1) +')').animate({ left: xCoord*xPosMod-xPositionAdjust, top: yCoord*yPosMod-yPositionAdjust }, 200);
		angleDegree += outerAngleIncrease;
	}
/*
	for( var index = DMW.navigation.innerRing_items; index < DMW.navigation.innerRing_items + DMW.navigation.outerRing_items; index++ ){
		$(node).parent().children(selectParent).children('li:nth-child('+ (index+1) +')').removeClass('hide');		    				
	}*/
}