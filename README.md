MSwipeSlider
==============

Minimalist, responsive, touch enabled slider developed with performance in mind (size/responsiveness/battery).

*Features:*
- small _(<2kb gzip)_
- responsive _(also handels reflows/resizes)_
- touch and mouse faux-touch
- GPU exelerated _(via CSS transforms)_
- AMD/CommonJS/jQueryPlugin support

Tested in Chrome, FF, IE8+, Opera, Android Chrome and iOS

MSwipeSlider depends on jQuery and has a soft dependency on Modernizr for feature detection that can be overwritten through `supportsCsstransitions` and `supportsCsstransforms`


Demo
----
http://lab.michaelmrowetz.com/mswipeslider


Using MSwipeSlider
------------------
Initializing MSwipeSlider with settings (all optional):

```JavaScript
$(".mSwipe").mSwipeSlider({
    onFinishedSetup : function(mSwipeSlider, el){
        console.log("ready captain", mSwipeSlider, el);
    }, // callback executed when MSwipeSlider is initiallized
    duration : 250, // animation duration for slide movement in ms (1000ms = 1sec)
    pagingTouchLength : 200, // px length needed to move slide
    supportsCsstransitions : true, // overwrite Modernizr default
    supportsCsstransforms : true // overwrite Modernizr default
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