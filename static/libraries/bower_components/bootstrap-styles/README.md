# Bootstrap styles

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg?style=flat-square)](https://beta.webcomponents.org/element/AlbertoFdzM/bootstrap-styles)

Web Component made with Polymer for bootstrap shared styles

<!--
```
<custom-element-demo>
  <template>
    <link rel="import" href="bower_components/polymer/polymer.html">
    <link rel="import" href="bootstrap-styles.html">

    <dom-module id="demo-element">
      <template>
        <next-code-block></next-code-block>
      </template>
      <script>
        Polymer({
          is: 'demo-element'
        })
      </script>
    </dom-module>

    <demo-element></demo-element>
  </template>
</custom-element-demo>
```
-->
```html
    <style include="bootstrap-styles"></style>
    <style>:host { display: block; }</style>
    
    <div class="jumbotron">
      <h1>Hello, world!</h1>
      <p>This is a simple hero unit, a simple jumbotron-style component for calling extra attention to featured content or information.</p>
      <p><a class="btn btn-primary btn-lg" href="#" role="button">Learn more</a></p>
    </div>
```
