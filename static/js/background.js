DMW.background = DMW.background || {};

DMW.background.setImage = function (image, position, repeat, size, opacity) {
	var ss = document.getElementById('sectionstyle');
	var body = ss.sheet.cssRules[1];
	body.style.backgroundAttachment = 'fixed';
	if (image == 'none') {
		body.style.backgroundImage = "none";
	} else {
		body.style.backgroundImage = "url('" + image + "')";
	}
	body.style.backgroundPosition = (position ? position : "0 0");
	body.style.backgroundRepeat = (repeat ? repeat : "no-repeat");
	body.style.backgroundSize = (size ? size : "cover");
	body.style.opacity = (opacity ? opacity : "1");
}

DMW.background.setCSS = function (css) {
	var body = document.querySelector('body');
	body.style.background = css;
}

/*            "l0Hue" : 35, "l0Saturation": 95, "l0Lightness": 55,
            "l1Hue" : 140, "l1Saturation": 90, "l1Lightness": 50,
            "l2Hue" : 225, "l2Saturation": 95, "l2Lightness": 50,
            "l3Hue" : 340, "l3Saturation": 100, "l3Lightness": 55*/

DMW.background.setGradient = function (l0hue, l0saturation, l0lightness, l1hue, l1saturation, l1lightness, l2hue, l2saturation, l2lightness, l3hue, l3saturation, l3lightness) {
	var generator = new ColorfulBackgroundGenerator();
	generator.addLayer(new ColorfulBackgroundLayer(315, l0hue, l0saturation, l0lightness, 100, 70));
	generator.addLayer(new ColorfulBackgroundLayer(225, l1hue, l1saturation, l1lightness, 10, 80));
	generator.addLayer(new ColorfulBackgroundLayer(135, l2hue, l2saturation, l2lightness, 10, 80))
	generator.addLayer(new ColorfulBackgroundLayer(45, l3hue, l3saturation, l3lightness, 0, 70));
	generator.assignStyleToElementId("body");
}