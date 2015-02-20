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

function sectionUpdated(e) {
	var details = e.detail;
	/* Remove current widgets */
	while (DMW.main.layout.firstChild) {
  		DMW.main.layout.removeChild(DMW.main.layout.firstChild);
	}
	/* Update page style */
	var ss = document.getElementById('sectionstyle');
	var bodyStyle = ss.sheet.cssRules[0];
	if ('SectionBackgroundImage' in DMW.main.section.params) {
		bodyStyle.style.backgroundImage = DMW.main.section.params['SectionBackgroundImage'];
		if ('SectionBackgroundRepeat' in DMW.main.section.params) {
			bodyStyle.style.backgroundRepeat = DMW.main.section.params['SectionBackgroundRepeat'];
		} else {
			bodyStyle.style.backgroundRepeat = "no-repeat";
		}
		if ('SectionBackgroundPosition' in DMW.main.section.params) {
			bodyStyle.style.backgroundPosition = DMW.main.section.params['SectionBackgroundPosition'];
		} else {
			bodyStyle.style.backgroundPosition = "0 0";
		}
		if ('SectionBackgroundSize' in DMW.main.section.params) {
			bodyStyle.style.backgroundSize = DMW.main.section.params['SectionBackgroundSize'];
		} else {
			bodyStyle.style.backgroundSize = "cover";
		}
	}
	if ('SectionBackground' in DMW.main.section.params) {
		bodyStyle.style.background = DMW.main.section.params['SectionBackground'];
	}
	if ('SectionBackgroundImageUploaded' in DMW.main.section.params) {
		bodyStyle.style.backgroundImage = "url('/backgrounds/" + DMW.main.section.params['SectionBackgroundImageUploaded'] + "')";
		bodyStyle.style.backgroundRepeat = "no-repeat";
		bodyStyle.style.backgroundPosition = "0 0";
		bodyStyle.style.backgroundSize = "cover";
	}

	var widgetStyle = ss.sheet.cssRules[1];
	widgetStyle.style.color=DMW.main.section.params['WidgetTextColor'];
	widgetStyle.style.backgroundColor=DMW.main.section.params['WidgetBackgroundColor'];
	widgetStyle.style.borderColor=DMW.main.section.params['WidgetBorderColor'];
	widgetStyle.style.borderRadius=DMW.main.section.params['WidgetBorderRadius'];
	widgetStyle.style.boxShadow=DMW.main.section.params['WidgetBoxShadow'];

	DMW.grid.destroy();

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

			if (instance.widget.default_style == 'true') {
				insertWidgetStyle(instance);
			}
		}		
	}
	setTimeout(function(){
		DMW.grid.init();
	}, 500);
}

function instanceAdded(topic, json) {
	if (DMW.main.section.sectionid == json.section_id) {
		insertWidgetLink(json.widget_id, json.widget.set_id, json.widget.set_ref);
		var node = insertWidgetInstance(json.id, json.widget);
		DMW.grid.appendedInstance(node);
	}
}

function instanceRemoved(topic, json) {
	if (DMW.main.section.sectionid == json.section_id) {
		var node = document.getElementById('instance-' + json.id);
		DMW.grid.removedInstance(node);
		node.remove();
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
	if (DMW.main.layout.getAttribute('edit') != null) {
		instance.setAttribute('edit', '');
	}
	DMW.main.layout.appendChild(instance);
	return instance;
}

/*
 * Insert Widget <style> into <head>
 */
function insertWidgetStyle(instance) {
	var style = document.createElement('style');
	style.setAttribute('id', 'style-instance-' + instance.id);
	style.setAttribute('type', 'text/css');
	var css = "#instance-" + instance.id + " {";
	if ('WidgetBackgroundColor' in instance.options)
		css += "background-color: " + instance.options['WidgetBackgroundColor'] + ";"
	if ('WidgetBorderColor' in instance.options)
		css += "border: 1px solid " + instance.options['WidgetBorderColor'] + ";"
    if ('WidgetBorderRadius' in instance.options)
    	css += "border-radius: " + instance.options['WidgetBorderRadius'] + ";"
    if ('WidgetTextColor' in instance.options)
    	css += "color: " + instance.options['WidgetTextColor'] + ";"
    if ('WidgetBoxShadow' in instance.options)
    	css += "box-shadow: " + instance.options['WidgetBoxShadow'] + ";"
	css += "}";
	if (style.styleSheet){
	  style.styleSheet.cssText = css;
	} else {
	  style.appendChild(document.createTextNode(css));
	}
	document.head.appendChild(style);
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
		link.setAttribute('href', "/libraries/image-picker/image-picker/image-picker.css")
		document.head.appendChild(link);

		var script = document.createElement('script');
		script.setAttribute('type', "text/javascript");
		script.setAttribute('src', "/libraries/file-uploader/client/fileuploader.js")
		document.head.appendChild(script);

		var script = document.createElement('script');
		script.setAttribute('type', "text/javascript");
		script.setAttribute('src', "/libraries/image-picker/image-picker/image-picker.min.js")
		document.head.appendChild(script);
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
						DMW.main.ajax.setAttribute('body', serialize(formConfig));
						DMW.main.ajax.setAttribute('method', 'POST');
						DMW.main.ajax.setAttribute('params', '{"action":"section", "id":"' + DMW.main.section.sectionid + '"}');
						DMW.main.ajax.go();
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

				// Background selector
				$("#SectionBackgroundImageUploaded").imagepicker();

				// Upload button
				var uploader = new qq.FileUploader({
                    element: document.getElementById('file-uploader-background'),
                    action: '/upload',
                    onComplete: function(id, fileName, responseJSON){
                    	$("#SectionBackgroundImageUploaded").append("<option data-img-src='/backgrounds/thumbnails/" + fileName + "' value='" + fileName + "'>" + fileName + "</option>");
                    	$("#SectionBackgroundImageUploaded").imagepicker();
                    },
                });           

				DMW.main.modalOverlay.classList.add('on');
			}
		});
	DMW.main.ajax.setAttribute('method', 'GET');
	DMW.main.ajax.setAttribute('params', '{"action":"section", "id":"' + DMW.main.section.getAttribute('sectionid') + '"}');
	DMW.main.ajax.go();
}

function widgetsEditHandler() {
	DMW.main.edit = true;
	for (var i = 0; i < DMW.main.layout.children.length; i++) {
		DMW.main.layout.children[i].setAttribute('edit', '');
	}
	DMW.grid.editChanged(DMW.main.edit);
}

function widgetsFinishHandler() {
	DMW.main.edit = false;
	for (var i = 0; i < DMW.main.layout.children.length; i++) {
		DMW.main.layout.children[i].removeAttribute('edit');
	}
	DMW.grid.editChanged(DMW.main.edit);
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
						DMW.main.ajax.setAttribute('body', serialize(form));
						DMW.main.ajax.setAttribute('method', 'POST');
						DMW.main.ajax.setAttribute('params', '{"action":"addsection", "id":"' + DMW.main.section.sectionid + '"}');
						DMW.main.ajax.go();
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
				DMW.main.modalOverlay.classList.add('on');
			}
		});
	DMW.main.ajax.setAttribute('method', 'GET');
	DMW.main.ajax.setAttribute('params', '{"action":"addsection", "id":"' + DMW.main.section.getAttribute('sectionid') + '"}');
	DMW.main.ajax.go();
}

function removeSectionHandler() {
	var id = DMW.main.section.getAttribute('sectionid');
	if (id >1) { // Don't delete Root
	   	DMW.main.socket.send("section-remove", {'section_id':id});
	}
}

function onWidgetStyleChange(e) {
	var widgetpreview = document.getElementById('modal-overlay #widgetpreview');
	switch(e.target.id) {
	    case 'params-WidgetTextColor':
	    	widgetpreview.style.color = e.target.value;
	        break;
	    case 'params-WidgetBorderColor':
		    widgetpreview.style.borderColor = e.target.value;
	        break;
	    case 'params-WidgetBackgroundColor':
	    	widgetpreview.style.backgroundColor = e.target.value;
	        break;
	    case 'params-WidgetBorderRadius':
		    widgetpreview.style.borderRadius = e.target.value;
	        break;
	    case 'params-WidgetBoxShadow':
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

