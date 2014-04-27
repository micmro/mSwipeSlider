/**
* MSwipeSlider widget
* created by Michael Mrowetz
**/

(function($, Modernizr){
	"use strict";

	var MSwipeSlider = function(element, options) {

		var self = this,
			$this = $(element),
			$slideSled = $this.children(".mSwipe-sled"),
			$slides = $slideSled.children("li"),
			$next = $this.find(".mSwipe-next"),
			$prev = $this.find(".mSwipe-prev"),
			settings = $.extend({
				onFinishedSetup : function() {},
				duration : 250, //in ms (1000ms = 1sec)
				pagingThreshhold : 100, //in px
				supportsCsstransitions : !!(Modernizr||{}).csstransitions, //use Modernizer if available, but make it overwritable
				supportsCsstransforms : !!(Modernizr||{}).csstransforms //use Modernizer if available, but make it overwritable
			}, options ),
			activeSlide = 0,
			totalSlides = $slides.length-1,
			outerWidth;


		/*
		TODO: Check:
		http://www.webaxe.org/carousels-and-aria-tabs/
		http://accessibility.athena-ict.com/aria/examples/carousel.shtml
		http://www.audiusa.com/
		
		References:
		http://www.paulirish.com/2012/why-moving-elements-with-translate-is-better-than-posabs-topleft/
		*/
		$slideSled
			.attr({"aria-live": "polite"
			})
			.toggleClass("no-transition-support", !settings.supportsCsstransforms)
			.css("transition-duration", settings.duration + "ms");

		//helpers
		var util = {
			throttle : function(fn, throttleFrequency) {
				var last, deferTimer, now, args;
				throttleFrequency || (throttleFrequency = 50);

				return function() {
					now = +new Date;
					args = arguments;

					if (last && now < last + throttleFrequency) {
						clearTimeout(deferTimer);
						deferTimer = setTimeout(function () {
							last = now;
							fn.apply(self, args);
						}, throttleFrequency - (now - last));
					} else {
						last = now;
						fn.apply(self, args);
					}
				};
			},
			easing : function(t){
				return t*(2-t); 
			},
			transformOrLeftCssAttrite : function(leftPosition){
				if(settings.supportsCsstransforms){
					return {"transform" : "translate("+leftPosition + "px, 0px)"};
				}else{
					return {"left" : leftPosition + "px"};
				}
			}
		};


		var maxHeight;
		var initDimensions = function(){
			$slideSled.addClass("disable-transition");

			outerWidth = $this.outerWidth();

			//reset height and height (for resize) - moved this out of maxHeight calculation to avoid triggering "Layout" and "Recalulate Style" for each node 
			$slides.css({
				width: outerWidth,
				height: "auto"
			});
			//get highest element height
			maxHeight = Math.max.apply(null, $slides.map(function(){
				return $(this).outerHeight();
			}).get());

			$this.height(maxHeight);
			$slides.css("height", maxHeight);

			$slideSled.css($.extend({
					width: outerWidth * (totalSlides+1) + "px",
					height: maxHeight
				}, util.transformOrLeftCssAttrite(-outerWidth * activeSlide))
			);

			//check if init initDimensions changed scrollbar
			// nice side effect is that it will force layout so the "disable-transition" class is set after the transformOrLeftCssAttrite, else it will animate
			if(outerWidth != $this.outerWidth()){
				initDimensions();
			}else{
				$slideSled.removeClass("disable-transition");
			}
		};


		var moveSlides = function(leftPosition, doNotAnimate){		
			if(settings.supportsCsstransitions || doNotAnimate){
				$slideSled.css(util.transformOrLeftCssAttrite(leftPosition));
			}else{
				$slideSled.animate(util.transformOrLeftCssAttrite(leftPosition), {
					duration : settings.duration,
					queue : false
				});
			}
		};


		var updateButtonState = function(){
			$this.toggleClass("firstSlide", (activeSlide == 0));
			$prev.prop("disabled", (activeSlide == 0));
			$this.toggleClass("lastSlide", (activeSlide == totalSlides));
			$next.prop("disabled", (activeSlide == totalSlides));

			//set ARIA roles and tab settings
			$slideSled
				.children("li[aria-hidden!=true]").attr("aria-hidden", "true")
				.find(":enabled[tabindex!=-1], a").attr("tabindex", "-1");
			$slideSled
				.children("li").eq(activeSlide).attr({"aria-hidden" : false})
				.find("[tabindex=-1]").removeAttr("tabindex");
		};


		//public: move to previous slide
		self.prev = function(){
			if(activeSlide > 0){
				activeSlide--;
				moveSlides(-outerWidth * activeSlide);
				updateButtonState();
			}
			//make method chainable 
			return element;
		};


		//public: move to next slide
		self.next = function(){
			if(activeSlide < totalSlides){
				activeSlide++;
				moveSlides(-outerWidth * activeSlide);
				updateButtonState();
			}
			//make method chainable 
			return element;
		};


		//public: reset center to current slide
		self.reset = function(){
			moveSlides(-outerWidth * activeSlide);
			//make method chainable 
			return element;
		};


		//public: method to refresh the slider
		self.slideCountChanged = function(){
			$slides = $slideSled.children("li");
			totalSlides = $slides.length-1;
			initDimensions();
			return element;
		};


		var pointSource;
		//beginning of touch - setup of vars for touchmove 
		var onTouchStart = function(event){

			$this.useTouch = !!event.originalEvent.touches;
			pointSource = ($this.useTouch) ? event.originalEvent.touches[0] : event.originalEvent;
			$this.pointerStartX = pointSource.pageX;
			$this.pointerStartY = pointSource.pageY;
			$this.pointerStartWidth = $this.width();
			$this.pointerStartTotalWidth = $this.pointerStartWidth * totalSlides;

			$this.pointerMoveActive = true;
			$this.pointerLeft = 0;

			$slideSled.addClass("disable-transition");

			//bind pointer events
			$(document.body).on("touchmove.pointeractive.mSwipe mousemove.pointeractive.mSwipe", onTouchMove);
			$(document.body).on("touchend.pointeractive.mSwipe touchcancel.pointeractive.mSwipe mouseup.pointeractive.mSwipe mouseleave.pointeractive.mSwipe", onTouchEnd);

		};


		//slide repositioning based on finger - turns out it performs better without throtteling
		var xPos, yScrollDifference;
		var onTouchMove = function(event){
		//var onTouchMove = util.throttle(function onTouchMove(event){
			//safeguard
			if($this.useTouch && !event.originalEvent.touches){
				return
			}
			event.preventDefault();
			event.stopPropagation();

			if($this.pointerMoveActive){
				pointSource = (event.originalEvent.touches) ? event.originalEvent.touches[0] : event.originalEvent;
				//maintain vertical scroll functionality
				yScrollDifference = pointSource.pageY - $this.pointerStartY;

				if(Math.abs(yScrollDifference) > 1){
					scrollTo($(document).scrollLeft(), $(document).scrollTop() - yScrollDifference);
				}
				
				$this.pointerLeft = (-$this.pointerStartWidth * activeSlide) - ($this.pointerStartX - pointSource.pageX);
				if($this.pointerLeft > 0){
					//left end
					xPos = $this.pointerLeft/$this.pointerStartWidth;
					moveSlides(util.easing(xPos > 1 ? 1 : xPos) * ($this.pointerStartWidth / 8), true);

				}else if(totalSlides == activeSlide && $this.pointerStartTotalWidth < Math.abs($this.pointerLeft)){
					//right end
					xPos = ($this.pointerLeft + $this.pointerStartTotalWidth) / -$this.pointerStartWidth
					moveSlides(-(util.easing(xPos > 1 ? 1 : xPos) * $this.pointerStartWidth/8)-$this.pointerStartTotalWidth, true);

				}else{
					//normal
					moveSlides($this.pointerLeft, true);
				}
			}
		};
		//}, 16);


		//end of touch - decide wether or not to change slide
		var onTouchEnd = function(event){
			if(!$this.pointerMoveActive){
				return;
			}
			//reset active related values 
			$(document.body).off(".pointeractive");
			$this.pointerMoveActive = false;
			$slideSled.removeClass("disable-transition");
			
			//decide if slide move is needed
			var touchLeft = $slideSled.position().left;
			var slideLeft = -$this.pointerStartWidth * activeSlide;
			if(touchLeft < slideLeft && touchLeft < (slideLeft - settings.pagingThreshhold) && activeSlide < totalSlides){
				self.next();
			}else if(touchLeft > slideLeft && touchLeft > (slideLeft + settings.pagingThreshhold) && activeSlide > 0) {
				self.prev();
			}else{
				self.reset();
			}
		};


		//handle window resize
		var onResize = util.throttle(function(){
			initDimensions();
		}, 16);


		//init event bindings
		var bindEvents = function(){
			//basic previous/next bindings
			$this.on("click.mSwipe", ".mSwipe-next", self.next);
			$this.on("click.mSwipe", ".mSwipe-prev", self.prev);

			//pointer event bindings
			$this.on("touchstart.mSwipe mousedown.mSwipe", ".mSwipe-sled > li", onTouchStart);

			//change size of widget
			$(window).on("resize.mSwipe", onResize);
		};


		self.destroy = function(){
			$this.off(".mSwipe")
			$(window).off("resize.mSwipe", onResize);
			$this.removeData("mSwipeSlider");
		};


		//initialize widget on "document ready" (or immediatly if called later)
		$(function(){
			initDimensions();
			updateButtonState();
			bindEvents();
			settings.onFinishedSetup.apply($this, [self, $this.get(0)]);
		});
	};


	//make mSwipeSlider available as jQuery plugin
	$.fn.mSwipeSlider = function(methodOrOptions) {
		return this.map(function(i, el){
			var element = $(el);
			var mSwipeSliderInstance = element.data("mSwipeSlider");

			// Return early if this element already has a plugin instance
			if (!mSwipeSliderInstance) {
				// Instanciate and store MSwipeSlider object in this element's data
				element.data("mSwipeSlider", new MSwipeSlider(this, methodOrOptions));
			}else if(mSwipeSliderInstance[methodOrOptions]){
				return mSwipeSliderInstance[methodOrOptions].apply( this, Array.prototype.slice.call( arguments, 1 ));			
			}
			return el;
		});
	};

})(jQuery, window.Modernizr);