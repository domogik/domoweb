function sectionUpdated(e) {
	var ss = document.querySelector('#sectionstyle');
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
}
function instanceAdded(topic, json) {
	var link = document.head.querySelector("link#" + json.widget_id);
	if (!link) { // If widget pack not already loaded
		link = document.createElement('link');
		link.setAttribute('rel', "import");
		link.setAttribute('href', "/widget/" + json.widget.set_id + '/' + json.widget.set_ref + ".html")
		document.head.appendChild(link);
	}

	var tag = 'dmw-' + json.widget.set_id + '-' + json.widget.set_ref;
	var widget = document.createElement(tag);
	widget.id = "instance-" + json.id
	widget.classList.add("widget", "loading", "widgetw" + json.widget.width, "widgeth" + json.widget.height);
	if (json.widget.default_style) { // If we load the default style
		widget.classList.add("style-general");
		widget.setAttribute('default_style', true);
	}
	widget.setAttribute('instanceid', json.id);
	widget.setAttribute('tabindex', 0);
	if (layout.getAttribute('edit') != null) {
		widget.setAttribute('edit', '');
	}
	layout.appendChild(widget);
}
function instanceRemoved(topic, json) {
	var widget = document.querySelector('#instance-' + json.id);
	widget.remove();
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
			    var section = document.querySelector('.mainsection');

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
	selector.setAttribute('section', 1);
	modalOverlay.appendChild(selector);
	modalOverlay.classList.add('on');
}

function onWidgetStyleChange(e) {
	var widgetpreview = document.querySelector('#modal-overlay #widgetpreview');
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