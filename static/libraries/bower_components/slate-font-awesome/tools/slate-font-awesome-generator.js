const fse = require('fs-extra');
const klaw = require('klaw')

const sourceFolder = "./bower_components/font-awesome";
const targetFolder = "."


klaw(sourceFolder + '/css').on('data', item => {
    if (item.stats.isFile() && item.path.endsWith('css')) {
        let splittedPath = item.path.split(/[\/\\]/);
        let filename = splittedPath[splittedPath.length - 1];

        fse.ensureDirSync(targetFolder);

        let data = fse.readFileSync(item.path, "utf8");
        data = data.replace(new RegExp('../fonts/', 'g'), './fonts/');

        let out = generateHeader(filename) + data + generateFooter();
        let finalFileName = filename.replace('.css', '.html').replace('.min', '-min');

        fse.writeFileSync(`${targetFolder}/slate-${finalFileName}`, out);
    }
});

fse.copy(sourceFolder + '/fonts', targetFolder + '/fonts', err => {
  if (err) return console.error(err)
});

function generateHeader(name) {
    let componentName = name.replace('.css', '').replace('.min', '-min');
    return `
<!--
@license Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
Copyright (c) 2017 Jean-François Le Foll "JeffLeFoll" for the Web Component encapsulation of Font Awesome CSS code
@demo demo/index.html
-->
<dom-module id="slate-${componentName}"><template><style>\n`;
}

function generateFooter() {
    return `\n</style></template></dom-module>`;
}
