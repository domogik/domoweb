DMW.main.menuConfigure = document.getElementById('menuConfigure'),
DMW.main.menuWidgets = document.getElementById('menuWidgets'),
DMW.main.panelConfigure = document.getElementById('panelConfigure'),
DMW.main.main = document.querySelector('main'),
DMW.main.section = document.getElementById('currentsection');
DMW.main.socket = document.getElementById('socket'),
DMW.main.layout = document.getElementById('grid-layout'),
DMW.main.modalOverlay = document.getElementById('modal-overlay'),
DMW.main.ajax = document.getElementById('ajax'),
DMW.main.menu = document.getElementById('main-menu');
DMW.main.navigation = document.getElementById('sections-tree');

NodeList.prototype.forEach = Array.prototype.forEach;
HTMLCollection.prototype.forEach = Array.prototype.forEach; // Because of https://bugzilla.mozilla.org/show_bug.cgi?id=14869

/* When section params changed */
function sectionUpdated(e) {
	var details = e.detail;

	var removed = DMW.grid.refresh(details.params.GridMode, details.params.GridColumns, details.params.GridRows, details.params.GridWidgetSize, details.params.GridWidgetSpace);

	// Remove widgets outside the grid
	// Disabled per issue #28, need to figure out a better way
//	for (var i=0; i<removed.length; i++) {
//		DMW.main.socket.send("widgetinstance-remove", {'instance_id': removed[i]});
//	}

	setSectionStyle();
}

/* When Section changed (navigation) */
function sectionChanged(e) {
	var details = e.detail;

	setSectionStyle();

	/* Remove current widgets */
	while (DMW.main.layout.firstChild) {
  		DMW.main.layout.removeChild(DMW.main.layout.firstChild);
	}

	DMW.grid.init(details.params.GridMode, details.params.GridColumns, details.params.GridRows, details.params.GridWidgetSize, details.params.GridWidgetSpace);

	if (details.widgets) {
		for (var i = 0; i < details.widgets.length; i++) {
			widget = details.widgets[i];
			insertWidgetLink(widget.id, widget.set_id, widget.set_ref);
		}
	}
	if (details.instances) {
		for (var i = 0; i < details.instances.length; i++) {
			instance = details.instances[i];
			var node = insertWidgetInstance(instance.id, instance.widget);
			DMW.grid.appendInstance(node, instance);
		}
		DMW.grid.adjustPlacement();
	}
}

function setSectionStyle() {
	if ('SectionBackgroundCSS' in DMW.main.section.params) {
		DMW.background.setCSS(DMW.main.section.params['SectionBackgroundCSS']);
	} else {
		DMW.background.setGradient(DMW.main.section.params['SectionL0Hue'], DMW.main.section.params['SectionL0Saturation'], DMW.main.section.params['SectionL0Lightness'], DMW.main.section.params['SectionL1Hue'], DMW.main.section.params['SectionL1Saturation'], DMW.main.section.params['SectionL1Lightness'], DMW.main.section.params['SectionL2Hue'], DMW.main.section.params['SectionL2Saturation'], DMW.main.section.params['SectionL2Lightness'], DMW.main.section.params['SectionL3Hue'], DMW.main.section.params['SectionL3Saturation'], DMW.main.section.params['SectionL3Lightness']);
	}
	if ('SectionBackgroundImage' in DMW.main.section.params) {
		DMW.background.setImage(DMW.main.section.params['SectionBackgroundImage'], DMW.main.section.params['SectionBackgroundPosition'], DMW.main.section.params['SectionBackgroundRepeat'], DMW.main.section.params['SectionBackgroundSize'], DMW.main.section.params['SectionBackgroundOpacity']);
	} else {
		DMW.background.setImage('none', null, null, null, null);
	}

	var ss = document.getElementById('sectionstyle');
	var widgetStyle = ss.sheet.cssRules[0];
	widgetStyle.style.color=DMW.main.section.params['WidgetTextColor'];
	widgetStyle.style.backgroundColor=DMW.main.section.params['WidgetBackgroundColor'];
	widgetStyle.style.borderColor=DMW.main.section.params['WidgetBorderColor'];
	widgetStyle.style.borderRadius=DMW.main.section.params['WidgetBorderRadius'];
	widgetStyle.style.boxShadow=DMW.main.section.params['WidgetBoxShadow'];
}

function instanceAdded(topic, json) {
	if (DMW.main.section.sectionid == json.section_id) {
		i18n.loadNamespace(json.widget.set_id, function() {
			insertWidgetLink(json.widget_id, json.widget.set_id, json.widget.set_ref);
			var node = insertWidgetInstance(json.id, json.widget);
			DMW.grid.appendInstance(node, json);
		});
	}
}

function instanceRemoved(topic, json) {
	if (DMW.main.section.sectionid == json.section_id) {
		var node = document.getElementById('instance-' + json.id);
		DMW.grid.removeInstance(node, json);
		node.remove();
	}
}

function instanceMoved(topic, json) {
	if (DMW.main.section.sectionid == json.section_id) {
		var node = document.getElementById('instance-' + json.id);
		DMW.grid.moveInstance(node, json);
	}
}

/*
 * Insert Widget <link> import into <head>
 */
function insertWidgetLink(widget_id, set_id, set_ref) {
	var link = document.head.querySelector("link#" + widget_id);
	if (!link) { // If widget pack not already loaded
		link = document.createElement('link');
		link.setAttribute('id', widget_id);
		link.setAttribute('rel', "import");
		link.setAttribute('href', "/widget/" + set_id + '/' + set_ref + ".html")
		document.head.appendChild(link);
	}
}

/*
 * Insert Widget instance node into layout
 */
function insertWidgetInstance(id, widget) {
	var tag = 'dmw-' + widget.set_id + '-' + widget.set_ref;
	var instance = document.createElement(tag);
	instance.id = "instance-" + id
	instance.classList.add("widget", "loading", "widgetw" + widget.width, "widgeth" + widget.height);
	if (widget.default_style) { // If we load the default style
		instance.classList.add("style-general");
		instance.setAttribute('default_style', true);
	}
	instance.setAttribute('instanceid', id);
	instance.setAttribute('tabindex', 0);
	if (DMW.main.edit == true) {
		instance.setAttribute('edit', 'true');
	}
	DMW.main.layout.appendChild(instance);
	return instance;
}

function configureHandler() {
	var libs = document.head.querySelector('link#fileuploader');
	if (!libs) { // Libraries not loaded yet
		var link = document.createElement('link');
		link.setAttribute('id', "fileuploader");
		link.setAttribute('rel', "stylesheet");
		link.setAttribute('type', "text/css");
		link.setAttribute('href', "/libraries/file-uploader/client/fileuploader.css")
		document.head.appendChild(link);

		var link = document.createElement('link');
		link.setAttribute('rel', "stylesheet");
		link.setAttribute('type', "text/css");
		link.setAttribute('href', "/libraries/image-picker-0.2.4/image-picker/image-picker.css")
		document.head.appendChild(link);
	}

	DMW.main.ajax.setAttribute('handleAs', 'text');
	DMW.main.ajax.addEventListener("polymer-response",
		function(e) {
			var response = e.detail.response;
			if (response == "{success:true}") {
				DMW.main.modalOverlay.classList.remove('on');
				DMW.main.modalOverlay.innerHTML = '';
			} else {
				DMW.main.modalOverlay.innerHTML = response;
				var saveConfig = DMW.main.modalOverlay.querySelector('#saveConfig');
				var cancelConfig = DMW.main.modalOverlay.querySelector('#cancelConfig');
				var formConfig = DMW.main.modalOverlay.querySelector('#formConfig');
			    var section = document.getElementById('currentsection');
				saveConfig.addEventListener("click",
					function(e) {
						if (gridParametersCheck()) {
							DMW.main.ajax.setAttribute('body', $(formConfig).serialize());
							DMW.main.ajax.setAttribute('method', 'POST');
							DMW.main.ajax.setAttribute('params', '{"action":"section", "id":"' + DMW.main.section.sectionid + '"}');
							DMW.main.ajax.go();
						}
						e.preventDefault();
						e.stopPropagation();
						return false;
					});
				cancelConfig.addEventListener("click",
					function(e) {
						DMW.main.modalOverlay.classList.remove('on');
						DMW.main.modalOverlay.innerHTML = '';
						e.preventDefault();
						e.stopPropagation();
						return false;
					});

				// Preview widget
				var inputs = DMW.main.modalOverlay.querySelectorAll('#widgetstyle input');
				inputs = Array.prototype.slice.call(inputs);
				inputs.forEach(function(element) {
					element.addEventListener('change', onWidgetStyleChange);
				});

				// Init Widget Preview
				var widgetpreview = document.getElementById('widgetpreview');
				widgetpreview.style.color = document.getElementById('params-WidgetTextColor').value;
				widgetpreview.style.borderColor = document.getElementById('params-WidgetBorderColor').value;
				widgetpreview.style.backgroundColor = document.getElementById('params-WidgetBackgroundColor').value;
				widgetpreview.style.borderRadius = document.getElementById('params-WidgetBorderRadius').value;
				widgetpreview.style.boxShadow = document.getElementById('params-WidgetBoxShadow').value;

				// Mode selector
				document.querySelectorAll('input.gridType').forEach(function(input) {
					input.addEventListener('click', gridModeSwitch, false);
				});

				// Grid check values
				document.querySelectorAll('.gridParam input').forEach(function(param) {
					param.addEventListener("change", gridParameterChange, false);
				});

				// Background
				var sectionBackgroundCSS = document.getElementById('SectionBackgroundCSS'),
				backgroundPreview = document.getElementById('backgroundpreview'),
				imagePreview = document.getElementById('imagepreview');

				// Gradient generator
				var generator = new ColorfulBackgroundGenerator();
				generator.addLayer(new ColorfulBackgroundLayer(315, section.params.SectionL0Hue, section.params.SectionL0Saturation, section.params.SectionL0Lightness, 100, 70));
				generator.addLayer(new ColorfulBackgroundLayer(225, section.params.SectionL1Hue, section.params.SectionL1Saturation, section.params.SectionL1Lightness, 10, 80));
				generator.addLayer(new ColorfulBackgroundLayer(135, section.params.SectionL2Hue, section.params.SectionL2Saturation, section.params.SectionL2Lightness, 10, 80))
				generator.addLayer(new ColorfulBackgroundLayer(45, section.params.SectionL3Hue, section.params.SectionL3Saturation, section.params.SectionL3Lightness, 0, 70));
				// Assign generated style to the element identified by it's id
				if (!sectionBackgroundCSS.value) gradientHandler(generator, 'backgroundpreview');

				sectionBackgroundCSS.addEventListener('change', function(e) {
					if (sectionBackgroundCSS.value) {
						backgroundPreview.style.background = sectionBackgroundCSS.value;
					} else {
						gradientHandler(generator, 'backgroundpreview');
					}
				}, false);

				document.querySelectorAll('input.gradient[type="range"]').forEach(function(input){
					input.addEventListener('input', function(e) {
						var index = e.target.getAttribute("id").substring(8, 9);
						var value = e.target.getAttribute("id").substring(9);

						var c = generator.getLayerByIndex(index);

					    switch (value) {
					        case "Hue":
					            c.hue = e.target.value;
					            break;
					        case "Lightness":
					            c.lightness = e.target.value;
					            break;
					        case "Saturation":
					            c.saturation = e.target.value;
					    }
					    if (!sectionBackgroundCSS.value) generator.assignStyleToElementId('backgroundpreview');
					});
				})
				document.getElementById('randomgradient').addEventListener('click', function(e) {
					for (var a = generator.getNumberOfLayers() - 1; a >= 0; a--) {
						generator.getLayerByIndex(a).hue = Math.ceil(359 * Math.random());
						generator.getLayerByIndex(a).saturation = Math.ceil(10 * Math.random()) + 90;
						generator.getLayerByIndex(a).lightness = Math.ceil(10 * Math.random()) + 40;
					}
					e.preventDefault();
					e.stopPropagation();
					if (!sectionBackgroundCSS.value) gradientHandler(generator, 'backgroundpreview');
				}, false);

				// Background selector
				$.getScript("/libraries/image-picker-0.2.4/image-picker/image-picker.min.js", function() {
					$("#SectionBackgroundImage").imagepicker({
			          hide_select : true,
			          changed  : function(oldValue, newValue) {
			          	if (newValue != "none") {
							imagePreview.style.backgroundImage = "url('" + newValue + "')";
			          	} else {
			          		imagePreview.style.backgroundImage = "none";
			          	}
			          }
			        });
				});

				document.getElementById('SectionBackgroundOpacity').addEventListener('change', function(e){
					imagePreview.style.opacity = e.target.value;
				}, false);

				$.getScript('/libraries/file-uploader/client/fileuploader.js', function() {
					// Upload button
					var uploader = new qq.FileUploader({
	                    element: document.getElementById('file-uploader-background'),
	                    action: '/upload',
	                    onComplete: function(id, fileName, responseJSON){
	                    	$("#SectionBackgroundImageUploaded").append("<option data-img-src='/backgrounds/thumbnails/" + fileName + "' value='" + fileName + "'>" + fileName + "</option>");
	                    	$("#SectionBackgroundImageUploaded").imagepicker();
	                    },
	                });

				});

				// Display modal
				DMW.main.modalOverlay.classList.add('on');
			}
		});
	DMW.main.ajax.setAttribute('method', 'GET');
	DMW.main.ajax.setAttribute('params', '{"action":"section", "id":"' + DMW.main.section.getAttribute('sectionid') + '"}');
	DMW.main.ajax.go();
}

function gradientHandler(generator, id) {
	for (var a = generator.getNumberOfLayers() - 1; a >= 0; a--) {
		document.getElementById("SectionL" + a + "Hue").value = generator.getLayerByIndex(a).hue;
		document.getElementById("SectionL" + a + "Lightness").value = generator.getLayerByIndex(a).lightness;
		document.getElementById("SectionL" + a + "Saturation").value = generator.getLayerByIndex(a).saturation;
	}
	generator.assignStyleToElementId(id);
}
function widgetsEditHandler() {
	DMW.main.edit = true;
	for (var i = 0; i < DMW.main.layout.children.length; i++) {
		DMW.main.layout.children[i].setAttribute('edit', '');
	}
}

function widgetsFinishHandler() {
	DMW.main.edit = false;
	for (var i = 0; i < DMW.main.layout.children.length; i++) {
		DMW.main.layout.children[i].removeAttribute('edit');
	}
}

function addWidgetHandler() {
	selector = document.createElement('dmw-widgets-selector');
	DMW.main.modalOverlay.appendChild(selector);
	DMW.main.modalOverlay.classList.add('on');
}

function addSectionHandler() {
	DMW.main.ajax.setAttribute('handleAs', 'text');
	DMW.main.ajax.addEventListener("polymer-response",
		function(e) {
			var response = e.detail.response;
			if (response == "{success:true}") {
				DMW.main.modalOverlay.classList.remove('on');
				DMW.main.modalOverlay.innerHTML = '';
			} else {
				DMW.main.modalOverlay.innerHTML = response;
				var saveConfig = DMW.main.modalOverlay.querySelector('#saveConfig');
				var cancelConfig = DMW.main.modalOverlay.querySelector('#cancelConfig');
				var form = DMW.main.modalOverlay.querySelector('#formAddSection');
				saveConfig.addEventListener("click",
					function(e) {
						if (gridParametersCheck()) {
							DMW.main.ajax.setAttribute('body', $(form).serialize());
							DMW.main.ajax.setAttribute('method', 'POST');
							DMW.main.ajax.setAttribute('params', '{"action":"addsection", "id":"' + DMW.main.section.sectionid + '"}');
							DMW.main.ajax.go();
						}
						e.preventDefault();
						e.stopPropagation();
						return false;
					});
				cancelConfig.addEventListener("click",
					function(e) {
						DMW.main.modalOverlay.classList.remove('on');
						DMW.main.modalOverlay.innerHTML = '';
						e.preventDefault();
						e.stopPropagation();
						return false;
					});

				// Mode selector
				document.querySelectorAll('input.gridType').forEach(function(input) {
					input.addEventListener('click', gridModeSwitch, false);
				});

				// Grid check values
				document.querySelectorAll('.gridParam input').forEach(function(param) {
					param.addEventListener("change", gridParameterChange, false);
				});

				// Background
				var sectionBackgroundCSS = document.getElementById('SectionBackgroundCSS'),
				backgroundPreview = document.getElementById('backgroundpreview');

				// Gradient generator
				var generator = new ColorfulBackgroundGenerator();
				generator.addLayer(new ColorfulBackgroundLayer(315, Math.ceil(359 * Math.random()), Math.ceil(10 * Math.random()) + 90, Math.ceil(10 * Math.random()) + 40, 100, 70));
				generator.addLayer(new ColorfulBackgroundLayer(225, Math.ceil(359 * Math.random()), Math.ceil(10 * Math.random()) + 90, Math.ceil(10 * Math.random()) + 40, 10, 80));
				generator.addLayer(new ColorfulBackgroundLayer(135, Math.ceil(359 * Math.random()), Math.ceil(10 * Math.random()) + 90, Math.ceil(10 * Math.random()) + 40, 10, 80))
				generator.addLayer(new ColorfulBackgroundLayer(45, Math.ceil(359 * Math.random()), Math.ceil(10 * Math.random()) + 90, Math.ceil(10 * Math.random()) + 40, 0, 70));

				// Assign generated style to the element identified by it's id
				if (!sectionBackgroundCSS.value) gradientHandler(generator, 'backgroundpreview');

				sectionBackgroundCSS.addEventListener('change', function(e) {
					if (sectionBackgroundCSS.value) {
						backgroundPreview.style.background = sectionBackgroundCSS.value;
					} else {
						gradientHandler(generator, 'backgroundpreview');
					}
				}, false);

				document.querySelectorAll('input.gradient[type="range"]').forEach(function(input){
					input.addEventListener('input', function(e) {
						var index = e.target.getAttribute("id").substring(8, 9);
						var value = e.target.getAttribute("id").substring(9);

						var c = generator.getLayerByIndex(index);
					        switch (value) {
					        case "Hue":
					            c.hue = e.target.value;
					            break;
					        case "Lightness":
					            c.lightness = e.target.value;
					            break;
					        case "Saturation":
					            c.saturation = e.target.value;
					    }
					    if (!sectionBackgroundCSS.value) generator.assignStyleToElementId('backgroundpreview');
					}, false);
				})
				document.getElementById('randomgradient').addEventListener('click', function(e) {
					for (var a = generator.getNumberOfLayers() - 1; a >= 0; a--) {
						generator.getLayerByIndex(a).hue = Math.ceil(359 * Math.random());
						generator.getLayerByIndex(a).saturation = Math.ceil(10 * Math.random()) + 90;
						generator.getLayerByIndex(a).lightness = Math.ceil(10 * Math.random()) + 40;
					}
					e.preventDefault();
					e.stopPropagation();
					if (!sectionBackgroundCSS.value) gradientHandler(generator, 'backgroundpreview');
				}, false);

				// Display modal
				DMW.main.modalOverlay.classList.add('on');
			}
		});
	DMW.main.ajax.setAttribute('method', 'GET');
	DMW.main.ajax.setAttribute('params', '{"action":"addsection", "id":"' + DMW.main.section.getAttribute('sectionid') + '"}');
	DMW.main.ajax.go();
}

/**
 * gridModeSwitch - Method called when a grid type is selected
 * @param  e Event
 */
function gridModeSwitch(e) {

	document.querySelectorAll('.gridParam').forEach(function(param){
		param.style.display = 'none';
	});
	var mode = e.target.value;
	document.querySelectorAll('.gridParamMode' + mode).forEach(function(param){
		param.style.display = 'inline-block';
	});
}

/**
 * gridParameterChange - Method called when a grid parameter field has changed.
 * This method check and validates the values
 * @param  e Event
 */
function gridParameterChange(e) {
	gridParametersCheck();
}

function gridParametersCheck() {
	var type = document.querySelector('input[name="params-GridMode"]:checked').value;
	var columns = document.getElementById('GridColumns').value;
	var rows = document.getElementById('GridRows').value;
	var widgetSize = document.getElementById('GridWidgetSize').value;
	var widgetSpace = document.getElementById('GridWidgetSpace').value;
	var message = DMW.grid.checkValues(type, columns, rows, widgetSize, widgetSpace);
	document.getElementById('gridMessage').innerHTML = message;
	if (message.indexOf('Info') === 0) {
		document.getElementById('gridMessage').className = "info";
		return true;
	} else if (message.indexOf('Warning') === 0) {
		document.getElementById('gridMessage').className = "warning";
		return true;
	} else {
		document.getElementById('gridMessage').className = "error";
		return false;
	}
}

function removeSectionHandler() {
	var id = DMW.main.section.getAttribute('sectionid');
	if (id >1) { // Don't delete Root
	   	DMW.main.socket.send("section-remove", {'section_id':id});
	}
}

function onWidgetStyleChange(e) {
	var widgetpreview = document.getElementById('widgetpreview');

	switch(e.target.id) {
	    case 'WidgetTextColor':
	    	widgetpreview.style.color = e.target.value;
	        break;
	    case 'WidgetBorderColor':
		    widgetpreview.style.borderColor = e.target.value;
	        break;
	    case 'WidgetBackgroundColor':
	    	widgetpreview.style.backgroundColor = e.target.value;
	        break;
	    case 'WidgetBorderRadius':
		    widgetpreview.style.borderRadius = e.target.value;
	        break;
	    case 'WidgetBoxShadow':
		    widgetpreview.style.boxShadow = e.target.value;
	        break;
	}
}
var websocketConnection = null;
function websocketConnected(e) {
	if (websocketConnection === false) {
		notif({
		  type: "success",
		  msg: "Connection restored",
		  position: "center",
		  width: "all",
		  height: 60,
		});
	}
	websocketConnection = true;
}
function websocketClosed(e) {
	if (websocketConnection === true) {
		notif({
		  type: "error",
		  msg: "Connection lost with Domoweb",
		  position: "center",
		  width: "all",
		  height: 60,
		  autohide: false
		});
	}
	websocketConnection = false;
}

