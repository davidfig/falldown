# falldown
A vanilla javascript drop-down box replacement with no required external stylesheet.

Features include single or multiple drop-down box. Fully control styling using classes or intialization options in javascript. Create the drop-down box using only javascript or only markup. Events system to capture when the box changes. 

## Simple Example
```js
const FallDown = require('falldown');

const falldown = new FallDown({
    parent: document.body,
    label: 'Choose a color:',
    options: [
        'black',
        'blue',
        'green',
        'purple',
        'yellow'
    ],
    addCSS: true,
    selected: 'black'
});
console.log(falldown.value);
```

## Live Example
[https://davidfig.github.io/falldown/](https://davidfig.github.io/falldown/)

## API Documentation
[https://davidfig.github.io/falldown/jsdoc/](https://davidfig.github.io/falldown/jsdoc/)

## Installation
```
npm i falldown
```

## Other Libraries
If you liked dropdown, please try my other open source libraries:
* [pixi-scrollbox](https://github.com/davidfig/pixi-scrollbox) - pixi.js scrollbox: a masked box that can scroll vertically or horizontally with scrollbars (uses pixi-viewport)
* [pixi-ease](https://github.com/davidfig/pixi-ease) - pixi.js animation library using easing functions
* [intersects](https://github.com/davidfig/intersects) - a simple collection of 2d collision/intersects functions. Supports points, circles, lines, axis-aligned boxes, and polygons

## license  
MIT License  
(c) 2019 [YOPEY YOPEY LLC](https://yopeyopey.com/) by [David Figatner](https://twitter.com/yopey_yopey/)
