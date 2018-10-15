DMW.main.menuConfigure = document.getElementById('menuConfigure');
DMW.main.section = document.getElementById('currentsection');
DMW.main.socket = document.getElementById('socket');
DMW.main.layout = document.getElementById('grid-layout');
DMW.main.modalOverlay = document.getElementById('modal-overlay');
DMW.main.ajax = document.getElementById('ajax');
DMW.menus = document.getElementById('menus');

NodeList.prototype.forEach = Array.prototype.forEach;
HTMLCollection.prototype.forEach = Array.prototype.forEach; // Because of https://bugzilla.mozilla.org/show_bug.cgi?id=14869

/* When section params changed */
function sectionUpdated(e) {
	var details = e.detail;

	var removed = DMW.main.layout.refresh(details.params.GridMode, details.params.GridColumns, details.params.GridRows, details.params.GridWidgetSize, details.params.GridWidgetSpace);

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

	/* Initialize grid-layout, Removing current widgets */
	DMW.main.layout.init(details.params.GridMode, details.params.GridColumns, details.params.GridRows, details.params.GridWidgetSize, details.params.GridWidgetSpace);

	if (details.widgets) {
		for (var i = 0; i < details.widgets.length; i++) {
			widget = details.widgets[i];
			insertWidgetLink(widget.id, widget.set_id, widget.set_ref);
		}
	}
	if (details.instances) {
        var instance;
		for (var i = 0; i < details.instances.length; i++) {
			instance = details.instances[i];
			var node = insertWidgetInstance(instance.id, instance.widget);
            // preserve from old widget definition
            if (!instance.height) {instance.height = instance.widget.height; }
            if (!instance.width) {instance.width = instance.widget.width; }
			DMW.main.layout.appendInstance(node, instance);
		}
        DMW.menus.activateCorner();
        $("#loading").fadeOut(200);
	}
}

function setSectionStyle() {
	if ('SectionBackgroundCSS' in DMW.main.section.params) {
		DMW.background.setCSS(DMW.main.section.params['SectionBackgroundCSS']);
	} else {
		DMW.background.setGradient(DMW.main.section.params['SectionL0Hue'], DMW.main.section.params['SectionL0Saturation'], DMW.main.section.params['SectionL0Lightness'], DMW.main.section.params['SectionL1Hue'], DMW.main.section.params['SectionL1Saturation'], DMW.main.section.params['SectionL1Lightness'], DMW.main.section.params['SectionL2Hue'], DMW.main.section.params['SectionL2Saturation'], DMW.main.section.params['SectionL2Lightness'], DMW.main.section.params['SectionL3Hue'], DMW.main.section.params['SectionL3Saturation'], DMW.main.section.params['SectionL3Lightness']);
	}
	if (('SectionBackgroundImage' in DMW.main.section.params) && (DMW.main.section.params['SectionBackgroundImage']!='none')){
		DMW.background.setImage(DMW.main.section.params['SectionBackgroundImage'], DMW.main.section.params['SectionBackgroundPosition'], DMW.main.section.params['SectionBackgroundRepeat'], DMW.main.section.params['SectionBackgroundSize'], DMW.main.section.params['SectionBackgroundOpacity']);
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
        insertWidgetLink(json.widget_id, json.widget.set_id, json.widget.set_ref);
        var node = insertWidgetInstance(json.id, json.widget);
        DMW.main.layout.appendInstance(node, json);
	}
}

function instanceRemoved(topic, json) {
	if (DMW.main.section.sectionid == json.section_id) {
        var widget = DMW.main.layout.getWidget(json.id);
        DMW.main.layout.removeInstance(widget);
		notif({
		  type: "success",
		  msg: "Widget deleted",
		  position: "center",
		  //width: "all",
		  height: 60,
		});
	}
}

function instanceMoved(topic, json) {
	if (DMW.main.section.sectionid == json.section_id) {
        var widget = DMW.main.layout.getWidget(json.id);
        if (!json.height) {json.height = json.widget.height; }
        if (!json.width) {json.width = json.widget.width; }
        DMW.main.layout.setWidgetPosition(widget, json.x, json.y, json.width, json.height);
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
                instance.setAttribute("style", "z-index:" + id + 1);   // Don't remove the '+1', else the first widget can't be edited!
		instance.setAttribute('default_style', true);
	}
	instance.setAttribute('instanceid', id);
	instance.setAttribute('tabindex', 0);
	if (DMW.main.edit == true) {
		instance.setAttribute('edit', 'true');
	}
	return instance;
}

function configureHandler() {
	var libs = document.head.querySelector('link#fileuploader');
	if (!libs) { // Libraries not loaded yet
		var link = document.createElement('link');
		link.setAttribute('id', "fileuploader");
		link.setAttribute('rel', "stylesheet");
		link.setAttribute('type', "text/css");
		link.setAttribute('href', "/libraries/file-uploader-2.0b/client/fileuploader.css")
		document.head.appendChild(link);

		var link = document.createElement('link');
		link.setAttribute('rel', "stylesheet");
		link.setAttribute('type', "text/css");
		link.setAttribute('href', "/libraries/image-picker-0.2.4/image-picker/image-picker.css")
		document.head.appendChild(link);
	}

	DMW.main.ajax.setAttribute('handleAs', 'text');
	DMW.main.ajax.addEventListener("polymer-response",
		function handler(e) {
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
					element.addEventListener('input', onWidgetStyleChange);
				});

				// Init Widget Preview
				var widgetpreview = document.getElementById('widgetSectionPreview');
				widgetpreview.style.color = document.getElementById('params_WidgetTextColor').value;
			//	widgetpreview.style.borderColor = document.getElementById('params_WidgetBorderColor').value;
                widgetpreview.style.borderColor = getWidgetColorValue('params_WidgetBorderColor');
				widgetpreview.style.backgroundColor = getWidgetColorValue('params_WidgetBackgroundColor'); // document.getElementById('params_WidgetBackgroundColor').value;
              //  setWidgetColorValue('params_WidgetBackgroundColor', document.getElementById('params_WidgetBackgroundColor').value);
				widgetpreview.style.borderRadius = document.getElementById('params_WidgetBorderRadius').value;
				widgetpreview.style.boxShadow = getWidgetBoxShadowValue('params_WidgetBoxShadow');
              //  setWidgetBoxShadowValue('params_WidgetBoxShadow', document.getElementById('params_WidgetBoxShadow').value);
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
                    imagePreview = document.getElementById('imagepreview'),
                    widgetStyleBackground = document.getElementById('widgetstyleBackground');

				// Gradient generator
				var generator = new ColorfulBackgroundGenerator();
				generator.addLayer(new ColorfulBackgroundLayer(315, section.params.SectionL0Hue, section.params.SectionL0Saturation, section.params.SectionL0Lightness, 100, 70));
				generator.addLayer(new ColorfulBackgroundLayer(225, section.params.SectionL1Hue, section.params.SectionL1Saturation, section.params.SectionL1Lightness, 10, 80));
				generator.addLayer(new ColorfulBackgroundLayer(135, section.params.SectionL2Hue, section.params.SectionL2Saturation, section.params.SectionL2Lightness, 10, 80))
				generator.addLayer(new ColorfulBackgroundLayer(45, section.params.SectionL3Hue, section.params.SectionL3Saturation, section.params.SectionL3Lightness, 0, 70));
				// Assign generated style to the element identified by it's id
                if (!sectionBackgroundCSS.value) {
                    gradientHandler(generator, 'backgroundpreview');
                    if (widgetStyleBackground.style.background == "") {
                        generator.assignStyleToElementId('widgetstyleBackground');
                    }
                } else {
                    backgroundPreview.style.background = sectionBackgroundCSS.value;
                    if (widgetStyleBackground.style.background == "") {
                        widgetStyleBackground.style.background = sectionBackgroundCSS.value;
                    }
                }
				sectionBackgroundCSS.addEventListener('change', function(e) {
					if (sectionBackgroundCSS.value) {
						backgroundPreview.style.background = sectionBackgroundCSS.value;
                        if (imagePreview.style.backgroundImage == "none") {
                            widgetStyleBackground.style.background = sectionBackgroundCSS.value;
                        }
					} else {
						gradientHandler(generator, 'backgroundpreview');
                        if (imagePreview.style.backgroundImage == "none") {
                            widgetStyleBackground.style.background = backgroundPreview.style.background;
                        }
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
					    if (!sectionBackgroundCSS.value) {
                            generator.assignStyleToElementId('backgroundpreview');
                            widgetStyleBackground.style.background = backgroundPreview.style.background;
                        }
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
                            widgetStyleBackground.style.backgroundImage = "url('" + newValue + "')";
			          	} else {
			          		imagePreview.style.backgroundImage = "none";
                            widgetStyleBackground.style.backgroundImage = "none";
                            widgetStyleBackground.style.background = backgroundPreview.style.background;
			          	}
			          }
			        });
				});

				document.getElementById('SectionBackgroundOpacity').addEventListener('change', function(e){
					imagePreview.style.opacity = e.target.value;
				}, false);

				$.getScript('/libraries/file-uploader-2.0b/client/fileuploader.js', function() {
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
                this.removeEventListener('polymer-response', handler);			}
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
    DMW.main.layout.setEdit(true);
    var list = DMW.main.layout.widgetList()
	for (var i = 0; i < list.length; i++) {
		list[i].setAttribute('edit', '');
	}
}

function widgetsFinishHandler() {
	DMW.main.edit = false;
    DMW.main.layout.setEdit(false);
    var list = DMW.main.layout.widgetList()
	for (var i = 0; i < list.length; i++) {
		list[i].removeAttribute('edit');
	}
}

function addWidgetHandler() {
	var selector = document.createElement('dmw-widgets-selector');
	DMW.main.modalOverlay.appendChild(selector);
	DMW.main.modalOverlay.classList.add('on');
}

function addButlerHandler() {
	selector = document.createElement('dmw-butler');
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
	var type = document.querySelector('input[name="params_GridMode"]:checked').value;
	var columns = document.getElementById('GridColumns').value;
	var rows = document.getElementById('GridRows').value;
	var widgetSize = document.getElementById('GridWidgetSize').value;
	var widgetSpace = document.getElementById('GridWidgetSpace').value;
	var message = DMW.main.layout.checkGridValues(type, columns, rows, widgetSize, widgetSpace);
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
	var widgetpreview = document.getElementById('widgetSectionPreview');
    let key = e.target.id.split('_')[1].split('-')[0];
    switch (key) {
        case 'WidgetTextColor' :
            widgetpreview.style.color = e.target.value;
            break;
        case 'WidgetBackgroundColor' :
            widgetpreview.style.backgroundColor = getWidgetColorValue(e.target.id);
            break;
        case 'WidgetBorderColor' :
            widgetpreview.style.borderColor = getWidgetColorValue(e.target.id);
            break;
        case 'WidgetBorderRadius' :
            widgetpreview.style.borderRadius = e.target.value;
           break;
        case 'WidgetBoxShadow':
            widgetpreview.style.boxShadow = getWidgetBoxShadowValue(e.target.id);
            break;
	}
}

function getWidgetColorValue(widgetId) {
    const ids = widgetId.split('-');
    const baseId = ( ids.length != 1) ? ids.slice(0, ids.length -1).join("-") : ids[0];
    let color = document.getElementById(baseId +"-WidgetColor");
    let opacity = document.getElementById(baseId +"-WidgetOpacity");
  //  setWidgetColorValue(baseId,hex2rgba(color.value, opacity.value / 10.0));
    return hex2rgba(color.value, opacity.value / 10.0);
}

function setWidgetColorValue(widgetId, value) {
    let color = document.getElementById(widgetId +"-WidgetColor");
    let opacity = document.getElementById(widgetId +"-WidgetOpacity");
    let cValue, oValue;
    if (value[0] == '#') {
        cValue = value;
        oValue = 10;
    } else if (value.search(",") == -1) {
        if (value == "transparent") {
            cValue = "#000000";
            oValue = 0;
        } else {
            cValue = value;
            oValue = 1;
        }
    } else {
        let val = value.slice(5, value.length -1).split(",");
        cValue = `#${('00' + parseInt(val[0]).toString(16)).slice(-2)}${('00' + parseInt(val[1]).toString(16)).slice(-2)}${('00' + parseInt(val[2]).toString(16)).slice(-2)}`;
        oValue = parseInt(parseFloat(val[3]) * 10.0);
    }
    color.value = cValue;
    opacity.value = oValue;
}

function getWidgetBoxShadowValue(widgetId) {
    const ids = widgetId.split('-');
    const baseId = ids[0];
    let subformNode = document.getElementById(baseId + '-InsetField');
    let newValue = subformNode.checked ? "inset " : "";
    subformNode = document.getElementById(baseId + '-ShiftRightField');
    newValue += subformNode.value + 'px ';
    subformNode = document.getElementById(baseId + '-ShiftDownField');
    newValue += subformNode.value + 'px ';
    subformNode = document.getElementById(baseId + '-BlurField');
    newValue += subformNode.value + 'px ';
    subformNode = document.getElementById(baseId + '-SpreadField');
    newValue += subformNode.value + 'px ';
    newValue += getWidgetColorValue(baseId + "-ColorField-");
 //   setWidgetBoxShadowValue(baseId, newValue);
    return newValue;
}

function setWidgetBoxShadowValue(widgetId, value) {
    values = value.split(" ")
    let inset = false,
        shiftR = 0,
        shiftD = 0,
        blur = 0,
        spread = 0,
        color = "";
    for (i=0; i<values.length; i++) {
        let len = values[i].length;
        if (values[i]=='inset'){
            inset = true;
        } else if (values[i].slice(len-2, len) == "px") {
            val = parseInt(values[i].slice(0,len-2));
            if (shiftR == 0) {
                shiftR = val;
            } else if (shiftD == 0) {
                shiftD = val;
            } else if (blur == 0) {
                blur = val;
            } else if (spread == 0) {
                spread = val;
            } else {
               color = values[i];
            }
        }
    }
    document.getElementById(widgetId +"-InsetField").checked = inset;
    document.getElementById(widgetId +"-ShiftRightField").value = inset;
    document.getElementById(widgetId +"-ShiftDownField").value = inset;
    document.getElementById(widgetId +"-BlurField").value = inset;
    document.getElementById(widgetId +"-SpreadField").value = inset;
    setWidgetColorValue(widgetId +"-ColorField", color);
}

var websocketConnection = null;
function websocketConnected(e) {
	if (websocketConnection === null || websocketConnection === false) {
		notif({
		  type: "success",
		  msg: "Connection restored",
		  position: "center",
		  //width: "all",
		  height: 60,
		});
	}
	websocketConnection = true;
}
function websocketClosed(e) {
	if (websocketConnection === null || websocketConnection === true) {
		notif({
		  type: "error",
		  msg: "Connection lost with Domoweb",
		  position: "center",
		  //width: "all",
		  height: 60,
		  autohide: false
		});
	}
	websocketConnection = false;
}

function websocketLogin(event, msg) {
    console.log(msg);
    if (msg.error != "") {
        notif({
          type: "error",
          msg: msg.error,
          position: "center",
          //width: "all",
          height: 60,
        });
        setTimeout(function() {window.location = "/logout";}, 3000);
    }
}
