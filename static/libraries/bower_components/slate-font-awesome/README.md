# slate-font-awesome [![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/JeffLeFoll/slate-font-awesome)
Wrapping of *[Font Awesome](http://fontawesome.io)* as [Polymer](https://www.polymer-project.org) web componentto be used as [shared style](https://www.polymer-project.org/2.0/docs/devguide/style-shadow-dom#style-modules) in full ShadowDOM mode (i.e. inside `<dom-module>` tags).


### Using *slate-font-awesome* modules

Using  polymer [shared styles](https://www.polymer-project.org/2.0/docs/devguide/style-shadow-dom#style-modules) modules is a two-step process:  
1) you need to use a `<link>` tag to import the module,  
2) add a `<style>` tag to include the styles in the correct place.

## Installation

Add the dependency to the `bower.json` of your application:

```
   "dependencies": {
     [...]
     "slate-font-awesome": "slate-font-awesome#4.7.0"
   }
``` 

And then recover them via `bower install`.

## Usage

Usually you will simply want to import `slate-font-awesome.html` (wrap around `font-awesome.css`) or `slate-font-awesome-min.html`
(wrap around `font-awesome.min.css`).

Supposing you're using bower to manage your components:
 
```
<link rel="import" href="../../bower_components/slate-font-awesome/slate-font-awesome.html">
``` 
In your element's template you add the include for the *slate-font-awesome* module:

```html
<style include="slate-font-awesome"></style>
```

For Chrome only (at least up to 59), if you want to use *slate-font-awesome* in sub-component, you may need to add also the *slate-font-awesome* module in your index.html `<custom-style>` tag: 
```html
    <custom-style>
        <style include="slate-font-awesome">
            ...
        </style>
  </custom-style>
```

If you build you application with Polymer-cli build task you may also need to edit the *polymer.json* and add the following extra-dependencies:
```
    "bower_components/slate-font-awesome/fonts/*.*"
```

## Demo !

[https://jefflefoll.github.io/slate-font-awesome](https://jefflefoll.github.io/slate-font-awesome)
 
```html
<link rel="import" href="../../bower_components/slate-font-awesome/slate-font-awesome.html">

<dom-module id="slate-font-awesome-example">
    <template>
        <style include="slate-font-awesome"></style>
		
        <i class="fa fa-camera-retro lg"></i> fa-lg <br>
        <i class="fa fa-camera-retro fa-2x"></i> fa-2x <br>
        <i class="fa fa-camera-retro fa-3x"></i> fa-3x <br>
        <i class="fa fa-fighter-jet fa-spin fa-3x fa-fw"></i> Top Gun Style :) <br>
        <span class="fa-stack fa-lg">
         <i class="fa fa-camera fa-stack-1x"></i>
         <i class="fa fa-ban fa-stack-2x" style="color: red;"></i>
        </span> fa-ban on fa-camera
    </template>

    <script>
        class SlateFontAwesomeExample extends Polymer.Element {
            static get is() { return 'slate-font-awesome-example'; }
        }
        window.customElements.define(SlateFontAwesomeExample.is, SlateFontAwesomeExample);
    </script>
</dom-module>
``` 

## Generating the elements

Using NodeJS and the `slate-font-awesome-generator.js` to transform Font Awesome CSS files into polymer elements.

You need to do a `npm install` to recover the rependencies and then `node  tools/slate-font-awesome-generator.js` to execute the script.

```
$ node tools/slate-font-awesome-generator.js
```

After executing it, a series of HTML files is generated in the folder, each one corresponding to a Font Awesome CSS file:  
slate-font-awesome.html, slate-font-awesome-min.html

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## Note on semver versioning

I'm aligning the versions of this element with Font Awesome version, in order to make easier to choose the right version

## Credits

This work is inspired by the one of @LostInBrittany with [granite-bootstrap](https://github.com/LostInBrittany/granite-bootstrap).

## License

[Apache 2.0](http://www.apache.org/licenses/LICENSE-2.0)
