function sectionUpdated(e) {
	var details = e.detail;
	/* Remove current widgets */
	while (layout.firstChild) {
  		layout.removeChild(layout.firstChild);
	}
	/* Update page style */
	var ss = document.getElementById('sectionstyle');
	var bodyStyle = ss.sheet.cssRules[0];
	if ('SectionBackground' in section.params) {
		bodyStyle.style.backgroundImage="url('/backgrounds/" + section.params['SectionBackground'] + "')";
	} else {
		bodyStyle.style.backgroundImage=section.params['SectionBackgroundImage'];
	}
	var widgetStyle = ss.sheet.cssRules[1];
	widgetStyle.style.color=section.params['WidgetTextColor'];
	widgetStyle.style.backgroundColor=section.params['WidgetBackgroundColor'];
	widgetStyle.style.borderColor=section.params['WidgetBorderColor'];
	widgetStyle.style.borderRadius=section.params['WidgetBorderRadius'];
	widgetStyle.style.boxShadow=section.params['WidgetBoxShadow'];

	for (var i = 0; i < details.widgets.length; i++) {
		widget = details.widgets[i];
		insertWidgetLink(widget.id, widget.set_id, widget.set_ref);
	}
	for (var i = 0; i < details.instances.length; i++) {
		instance = details.instances[i];
		insertWidgetInstance(instance.id, instance.widget);
		if (instance.widget.default_style == 'true') {
			insertWidgetStyle(instance);
		}
	}
}

function instanceAdded(topic, json) {
	if (section.sectionid == json.section_id) {
		insertWidgetLink(json.widget_id, json.widget.set_id, json.widget.set_ref);
		insertWidgetInstance(json.id, json.widget);
	}
}

function instanceRemoved(topic, json) {
	if (section.sectionid == json.section_id) {
		var widget = document.getElementById('instance-' + json.id);
		widget.remove();
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
	if (layout.getAttribute('edit') != null) {
		instance.setAttribute('edit', '');
	}
	layout.appendChild(instance);
}

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


function menuitemSelected(e) {
	switch(e.detail.id) {
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

	ajax.setAttribute('handleAs', 'text');
	ajax.addEventListener("polymer-response",
		function(e) {
			var response = e.detail.response;
			if (response == "{success:true}") {
				modalOverlay.classList.remove('on');
				modalOverlay.innerHTML = '';
			} else {
				modalOverlay.innerHTML = response;
				var saveConfig = modalOverlay.querySelector('#saveConfig');
				var cancelConfig = modalOverlay.querySelector('#cancelConfig');
				var formConfig = modalOverlay.querySelector('#formConfig');
			    var section = document.getElementById('currentsection');

				saveConfig.addEventListener("click",
					function(e) {
						ajax.setAttribute('body', serialize(formConfig));
						ajax.setAttribute('method', 'POST');
						ajax.setAttribute('params', '{"action":"section", "id":"' + section.sectionid + '"}');
						ajax.go();
						e.preventDefault();
						e.stopPropagation();
						return false;
					});
				cancelConfig.addEventListener("click",
					function(e) {
						modalOverlay.classList.remove('on');
						modalOverlay.innerHTML = '';
						e.preventDefault();
						e.stopPropagation();
						return false;
					});

				// Preview widget
				var inputs = modalOverlay.querySelectorAll('#widgetstyle input');
				inputs = Array.prototype.slice.call(inputs);
				inputs.forEach(function(element) {
					element.addEventListener('change', onWidgetStyleChange);
				});

				// Background selector
				$("#SectionBackground").imagepicker();

				// Upload button
				var uploader = new qq.FileUploader({
                    element: document.getElementById('file-uploader-background'),
                    action: '/upload',
                    onComplete: function(id, fileName, responseJSON){
                    	$("#SectionBackground").append("<option data-img-src='/backgrounds/thumbnails/" + fileName + "' value='" + fileName + "'>" + fileName + "</option>");
                    	$("#SectionBackground").imagepicker();
                    },
                });           

				modalOverlay.classList.add('on');
			}
		});
	ajax.setAttribute('method', 'GET');
	ajax.setAttribute('params', '{"action":"section", "id":"' + section.getAttribute('sectionid') + '"}');
	ajax.go();
}

function widgetsEditHandler() {
	layout.setAttribute('edit', '');
	for (var i = 0; i < layout.children.length; i++) {
		layout.children[i].setAttribute('edit', '');
	}
}

function widgetsFinishHandler() {
	layout.removeAttribute('edit');
	for (var i = 0; i < layout.children.length; i++) {
		layout.children[i].removeAttribute('edit');
	}
}

function addWidgetHandler() {
	selector = document.createElement('dmw-widgets-selector');
	modalOverlay.appendChild(selector);
	modalOverlay.classList.add('on');
}

function addSectionHandler() {
	ajax.setAttribute('handleAs', 'text');
	ajax.addEventListener("polymer-response",
		function(e) {
			var response = e.detail.response;
			if (response == "{success:true}") {
				modalOverlay.classList.remove('on');
				modalOverlay.innerHTML = '';
			} else {
				modalOverlay.innerHTML = response;
				var saveConfig = modalOverlay.querySelector('#saveConfig');
				var cancelConfig = modalOverlay.querySelector('#cancelConfig');
				var form = modalOverlay.querySelector('#formAddSection');
			    var section = document.getElementById('currentsection');

				saveConfig.addEventListener("click",
					function(e) {
						ajax.setAttribute('body', serialize(form));
						ajax.setAttribute('method', 'POST');
						ajax.setAttribute('params', '{"action":"addsection", "id":"' + section.sectionid + '"}');
						ajax.go();
						e.preventDefault();
						e.stopPropagation();
						return false;
					});
				cancelConfig.addEventListener("click",
					function(e) {
						modalOverlay.classList.remove('on');
						modalOverlay.innerHTML = '';
						e.preventDefault();
						e.stopPropagation();
						return false;
					});
				modalOverlay.classList.add('on');
			}
		});
	ajax.setAttribute('method', 'GET');
	ajax.setAttribute('params', '{"action":"addsection", "id":"' + section.getAttribute('sectionid') + '"}');
	ajax.go();
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

