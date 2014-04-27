MSwipeSlider
==============

Minimalist, responsive, touch enabled slider developed with performance in mind (size/responsiveness/battery).

Features
- small <2kb gzip
- responsive (also handels reflows/resizes)
- touch and mouse faux-touch pagination
- GPU exelerated (via css transforms)

Tested in Chrome, FF, IE8+, Opera, Android Chrome and iOS


Demo
----
http://lab.michaelmrowetz.com/mswipeslider


Using MSwipeSlider
------------------
Initializing MSwipeSlider with settings (all optional):

```JavaScript
$(".mSwipe").mSwipeSlider({
	onFinishedSetup : function(mSwipeSlider, el){console.log("ready captain", mSwipeSlider, el);}, //callback called when MSwipeSlider is initiallized
	duration : 250, // animation duration for slide movement in ms (1000ms = 1sec)
	pagingTouchLength : 200, // px length needed to move slide
	supportsCsstransitions : true,
	supportsCsstransforms : true
});
```

_The demo includes [jquery-requestAnimationFrame](https://github.com/gnarf/jquery-requestAnimationFrame) as a requestAnimationFrame fill, and [Modernizr](http://modernizr.com/) for feature detection but it works without them._


How to run this repo via Grunt
-------------------------
To work on the slider leveraging a static file server and automatic reload or to uglify the file.

- Install grunt
 ```
 npm install -g grunt-cli
 ```
- cd into directory and 
 ```
 grunt
 ```