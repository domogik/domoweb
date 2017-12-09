# \<sc-fitted-text\> [![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/SupportClass/sc-fitted-text) [![Build Status](https://travis-ci.org/SupportClass/sc-fitted-text.svg?branch=master)](https://travis-ci.org/SupportClass/sc-fitted-text) [![Coverage Status](https://coveralls.io/repos/github/SupportClass/sc-fitted-text/badge.svg?branch=master)](https://coveralls.io/github/SupportClass/sc-fitted-text?branch=master) ![Polymer 2 only](https://img.shields.io/badge/Polymer%202-only-blue.svg)

A Polymer 2 element for horizontally squishing text to stay within a max width.

## Motivation
Broadcast graphics often need to ensure that text will fit within a given space. There are existing libraries out there that can reduce the font size of an element to fit a given space, but this behavior isn't always what is wanted. Sometimes, the design calls for horizontally squishing (scaling) the text, rather than reducing the font size. This element enables that.

## Installation
```bash
bower install --save SupportClass/sc-fitted-text
```

## Example
```html
<sc-fitted-text text="Hello world!" max-width="100" align="center"></sc-fitted-text>
```

See the [Demo](https://www.webcomponents.org/element/SupportClass/sc-fitted-text/demo/demo/index.html) page for an interactive example.
