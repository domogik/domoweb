DMW.navigation = DMW.navigation || {};

DMW.navigation.init = function() {
	$("#sections-list").radialResponsiveMenu();
	var sections = document.querySelectorAll('#sections-list ul li > a');
	for (var i = sections.length - 1; i >= 0; i--) {
		sections[i].addEventListener('click', DMW.navigation.selectSection, false);
	};
};

DMW.navigation.selectSection = function(e) {
 	e.stopPropagation(); //so that it doesn't trigger click event on document
 	var id = e.target.dataset.section;
 	DMW.main.section.setAttribute('sectionid', id);
};

(function($){
	$.fn.radialResponsiveMenu = function(options) {
	options = $.extend({}, $.fn.radialResponsiveMenu.defaults, options);			
		
		return this.each(function(){
			/* ------------------------ Function for Radial Responsive menu  ------------------------ */
			var radLevelOneShown = false, 	radLevelTwoShown = false, 	radLevelThreeShown = false,
				$radFirstLevel, $radSecondLevel,
				$radLevelOneItems, $radLevelTwoItems,
				$level1, $level2, $level3,
				$menuItems,
				
				angleDegree, angleRad,
				outerAngleIncrease = 90/(options.outerRing_items-1),
				innerAngleIncrease = 90/(options.innerRing_items-1),
				toRadians = Math.PI / 180,
			
				xCoord, yCoord,
				xPosMod, yPosMod, yAdjustMod,
				positionOne, positionTwo,
				togglePosition;
				
				togglePosition = $('#toggle-radial').offset();
				
				$('<style type="text/css">' +
					'.radial-menu-items { height:'+ options.circleRadius +'px; width:'+ options.circleRadius +'px; border-radius: '+ options.circleRadius +'px }'+
					'.radial-first-items { top: -'+ ($('#toggle-radial').outerHeight() + 2) +'px; left: -2px }'+
					'.radial-upper-items { top: -2px; left: -1px; }'+ 
					'.radial-menu-links { height:'+ options.circleRadius +'px; width:'+ options.circleRadius +'px; border-radius: '+ options.circleRadius +'px; }' +
				'</style>').appendTo('head');
				
				xPosMod = 1;
				yPosMod = -1;
				yAdjustMod = -1;
				
				$('#sections-list > ul li').addClass('radial-menu-items');
				$('#sections-list ul li > a').addClass('radial-menu-links');
				
				$('#sections-list ul.level-1').addClass('hide');
				$('#sections-list ul.level-1').addClass('radial-first-items');
				$('#sections-list ul.level-2').addClass('hide');
				$('#sections-list ul.level-2').addClass('radial-upper-items')
				$('#sections-list ul.level-3').addClass('hide');
				$('#sections-list ul.level-3').addClass('radial-upper-items')
					
				$('#sections-list li > ul').parent().addClass('have-subs');
				// $('#sections-list ul li > a').wrap('<div class="radial-label" />')
				$('#sections-list #toggle-radial').click(RadLevelOneToggle);
				$('#sections-list ul.level-1 > li.have-subs > a').click(RadLevelTwoToggle);
				$('#sections-list ul.level-2 > li.have-subs > a').click(RadLevelThreeToggle);
				$menuItems = $('#sections-list ul li');
	
			/* ------------ Radial toggle button related behavior: Toggling level-1 Menu ------------*/		
			function RadLevelOneToggle(){
				if(!radLevelOneShown){
					$(this).addClass('active');
					
					$level1 = $('ul.level-1');
					toggleMenuItems.call(this, $level1, options.lv1_outerRing );
			
					$('#sections-list ul.level-1').removeClass('hide');
					$('#sections-list ul.level-1').addClass('show');
					radLevelOneShown = true;		
				} else {
					radLevelOneShown = false;	
					$(this).removeClass('active');
					$('#sections-list ul.level-1 > li').animate({ left: '0px', top: '0px' }, 150);
					$('#sections-list ul.level-1').fadeOut(200, function(){
						$('#sections-list ul.level-1 > li.have-subs').removeClass('active');
						$('#sections-list ul.level-1').removeClass('show');
						$('#sections-list ul.level-1').addClass('hide');			
						if(radLevelTwoShown){
							$radFirstLevel.fadeTo(200, 1);
							$radLevelOneItems.bind('click', RadLevelTwoToggle);
							$('#sections-list ul.level-2 > li').animate({ top: positionOne.top, left: positionOne.left }, 200);
							$('#sections-list ul.level-2 > li.have-subs').removeClass('active');
							$('#sections-list ul.level-2').removeClass('show');
							$('#sections-list ul.level-2').addClass('hide');
							radLevelTwoShown = false;
						}
						if(radLevelThreeShown){
							$radSecondLevel.fadeTo(200, 1);
							$radLevelTwoItems.bind('click', RadLevelThreeToggle);
							$('#sections-list ul.level-3 > li').animate({ top: positionTwo.top, left: positionTwo.left }, 200);
							$('#sections-list ul.level-3').removeClass('show');
							$('#sections-list ul.level-3').addClass('hide');
							radLevelThreeShown = false;
						}
					});	
				}
			}

			/* ------------ Radial toggle button related behavior: Toggling level-2 Menu ------------*/	
			function RadLevelTwoToggle(){
				$radFirstLevel = $(this).parent().siblings();
				$radLevelOneItems = $(this).parent().siblings('.have-subs').children('a');
				positionOne = $(this).position();
				if(!radLevelTwoShown){
					$(this).parent().addClass('active');
					$radFirstLevel.fadeTo(200, 0.1);
					$radLevelOneItems.unbind('click');
					
					$level2 = ('ul.level-2');
					toggleMenuItems.call(this, $level2, options.lv2_outerRing );

					$(this).parent().children('ul.level-2').removeClass('hide');
					$(this).parent().children('ul.level-2').addClass('show');
					radLevelTwoShown = true;
				} else {
					radLevelTwoShown = false;	
					$(this).parent().removeClass('active');
					$radFirstLevel.fadeTo(200, 1);
					$radLevelOneItems.bind('click', RadLevelTwoToggle);
					$('#sections-list ul.level-2 > li').animate({ top: positionOne.top, left: positionOne.left }, 200);		
					$('#sections-list ul.level-2').fadeOut(200, function(){	
						$('#sections-list ul.level-2 > li.have-subs').removeClass('active');	
						$('#sections-list ul.level-2').removeClass('show');
						$('#sections-list ul.level-2').addClass('hide');
						if(radLevelThreeShown){
							$radSecondLevel.fadeTo(200, 1);
							$radLevelTwoItems.bind('click', RadLevelThreeToggle);
							$('#sections-list ul.level-3 > li').animate({ top: positionTwo.top, left: positionTwo.left }, 200);
							$('#sections-list ul.level-3').removeClass('show');
							$('#sections-list ul.level-3').addClass('hide');
							radLevelThreeShown = false;
						}
					});	
				}
			}

			/* ------------ Radial toggle button related behavior: Toggling level-3 Menu ------------*/
			function RadLevelThreeToggle(){
				$radSecondLevel = $(this).parent().siblings();
				$radLevelTwoItems = $(this).parent().siblings('.have-subs').children('a');
				positionTwo = $(this).position();
				if(!radLevelThreeShown){
					$(this).parent().addClass('active');
					$radSecondLevel.fadeTo(200, 0.1);
					$radLevelTwoItems.unbind('click');
					
					$level3 = ('ul.level-3');
					toggleMenuItems.call(this, $level3, options.lv3_outerRing );
		
					$(this).parent().children('ul.level-3').removeClass('hide');
					$(this).parent().children('ul.level-3').addClass('show');
					radLevelThreeShown = true;
				} else {
					radLevelThreeShown = false;	
					$(this).parent().removeClass('active');
					$radSecondLevel.fadeTo(200, 1);
					$radLevelTwoItems.bind('click', RadLevelThreeToggle);
					$('#sections-list ul.level-3 > li').animate({ top: positionTwo.top, left: positionTwo.left }, 200);		
					$('#sections-list ul.level-3').fadeOut(200, function(){				
						$('#sections-list ul.level-3').removeClass('show');
						$('#sections-list ul.level-3').addClass('hide');
					});	
				}
			}	
		
			function toggleMenuItems(selectParent, isOuterRing){
				var yPositionAdjust, xPositionAdjust;
					
				yPositionAdjust = (options.circleRadius - $(this).outerHeight())/2;
				xPositionAdjust = (options.circleRadius - $(this).outerHeight())/2;			
	
				angleDegree = 0;
				/* ------------ Looping for INNER Ring - Sub-Menu level toggle and animation ------------*/		
				for( var index = 0; index < options.innerRing_items; index++ ){
				    angleRad = angleDegree * toRadians;
					xCoord = options.innerRing_radius * Math.cos( angleRad );
					yCoord = options.innerRing_radius * Math.sin( angleRad );	
					$(this).parent().children(selectParent).children(' li:nth-child('+ (index+1) +')').animate({ left: xCoord*xPosMod-xPositionAdjust , top: yCoord*yPosMod-yPositionAdjust}, 200);
					angleDegree += innerAngleIncrease;
				}

				angleDegree = 0;
				if(isOuterRing){
					for( var index = options.innerRing_items; index < options.innerRing_items + options.outerRing_items; index++ ){
						$(this).parent().children(selectParent).children('li:nth-child('+ (index+1) +')').removeClass('hide');		    				
					}
					/* ------------ Looping for OUTER Ring (if enabled) - Sub-Menu level toggle and animation ------------*/				
					for( var index = options.innerRing_items; index < options.innerRing_items + options.outerRing_items; index++ ){
			    		angleRad = angleDegree * toRadians;
						xCoord = options.outerRing_radius * Math.cos( angleRad );
						yCoord = options.outerRing_radius * Math.sin( angleRad );			
						$(this).parent().children(selectParent).children(' li:nth-child('+ (index+1) +')').animate({ left: xCoord*xPosMod-xPositionAdjust, top: yCoord*yPosMod-yPositionAdjust }, 200);
						angleDegree += outerAngleIncrease;
					}
				} else {
					for( var index = options.innerRing_items; index < options.innerRing_items + options.outerRing_items; index++ ){		    				
						$(this).parent().children(selectParent).children('li:nth-child('+ (index+1) +')').addClass('hide');
					}
				}					
			}
		});	
	};
	
	$.fn.radialResponsiveMenu.defaults = {
		'circleRadius': 80,
		'lv1_outerRing': true,
		'lv2_outerRing': true,
		'lv3_outerRing': true,
		'innerRing_items': 3,
		'outerRing_items': 5,
		'innerRing_radius': 110,
		'outerRing_radius': 220,
		'togglePosition': 'bottom-left'
	};
	
})( jQuery );