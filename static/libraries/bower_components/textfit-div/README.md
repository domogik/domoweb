[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/Protoss78/textfit-div)

# textfit-div
A web component that uses <a href="https://github.com/STRML/textFit">STRML/textFit</a> to fit the text size to the available space. When the parent is resized, the text size is adjusted accordingly.
Important: Make sure that textfit-div is put into a container that has an actual size.

Example:
<!---
```
<custom-element-demo>
  <template>
    <script src="../webcomponentsjs/webcomponents-lite.js"></script>
    <link rel="import" href="textfit-div.html">
        <link rel="import" href="../iron-flex-layout/iron-flex-layout-classes.html">
        <link rel="import" href="../paper-card/paper-card.html">
        <link rel="import" href="../paper-styles/demo-pages.html">
        <custom-style>
            <style is="custom-style" include="iron-flex">
                .horizontal-section {
                    height: 400px;
                    min-width: 300px;
                    margin: 1em;
                    padding: 1em;
                }
    
                .fullHeight {
                    height: 90%;
                    width: 90%;
                }
    
                paper-card {
                    height: 450px;
                    width: calc(100% - 2em);
                    margin: 1em;
                }
    
                .styled {
                    --textfit-div: {
                        color: darkgreen;
                        text-align: center;
                        font-style: italic;
                        font-weight: bold;
                    };
                }
            </style>
        </custom-style>
    <next-code-block></next-code-block>
  </template>
</custom-element-demo>
```
-->
```html
<div class="layout horizontal flex wrap">
    <div class="horizontal-section layout horizontal flex">
        <textfit-div class="fullHeight flex" text="Hey!"></textfit-div>
    </div>
    <div class="horizontal-section layout horizontal flex">
        <textfit-div class="fullHeight flex styled" text="Styled text"></textfit-div>
    </div>
</div>
<paper-card>
    <textfit-div class="fullHeight flex"
                 text="A little bit more text to showcase an extreme sample with multi-line support enabled to demonstrate wrapping capabilities"
                 horizontal-center multi-line></textfit-div>
</paper-card>
```
