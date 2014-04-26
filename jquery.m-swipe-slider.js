/**
* MSwipeSlider widget
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
				// onTransitionStart : function() {},
				// onTransitionEnd : function() {},
				onFinishedSetup : function() {},
				duration : 250, //in ms (1000ms = 1sec)
				pagingTouchLength : 100, //in px
				supportsCsstransitions : !!(Modernizr||{}).csstransitions, //use Modernizer if available, but make it overwritable
				supportsCsstransforms : !!(Modernizr||{}).csstransforms //use Modernizer if available, but make it overwritable
			}, options );


		/*
		TODO: Check:
		http://www.webaxe.org/carousels-and-aria-tabs/
		http://accessibility.athena-ict.com/aria/examples/carousel.shtml
		http://www.audiusa.com/
		
		References:
		http://www.paulirish.com/2012/why-moving-elements-with-translate-is-better-than-posabs-topleft/
		*/
		$slideSled
			.attr("aria-live", "polite")
			.toggleClass("no-transition-support", !settings.supportsCsstransforms)
			.css("transition-duration", settings.duration + "ms");

		//helpers
		self.util = {
			throttle : function throttle(fn, postFn, throttleFrequency, postFnDelay) {
				var last, deferTimer, deferCleanupTimer;
				throttleFrequency || (throttleFrequency = 50);
				postFnDelay || (postFnDelay = throttleFrequency);

				var resetCleanup = function(){
					if(typeof postFn == "function"){
						clearTimeout(deferTimer);
						deferCleanupTimer = setTimeout(function(){
							postFn.apply(self);
						}, postFnDelay);
					}
				};

				return function () {
					var now = +new Date, args = arguments;
					if (last && now < last + throttleFrequency) {
						clearTimeout(deferTimer);
						clearTimeout(deferCleanupTimer);
						deferTimer = setTimeout(function () {
							last = now;
							fn.apply(self, args);
							resetCleanup();
						}, throttleFrequency);
					} else {
						last = now;
						fn.apply(self, args);
						resetCleanup();
					}
				};
			},
			easing : function easing(t){
				return t*(2-t); 
			}
		};


		var activeSlide = 0,
			totalSlides = $slides.length-1;

		var initDimensions = function initDimensions(){
			$slideSled.addClass("disable-transition");
			//get highest element height
			var maxHeight = Math.max.apply(null, $slides.map(function (){
					return $(this).height();
				}).get()),
				outerWidth = $this.width();

			$this.height(maxHeight);
			$slides.css({
				width: outerWidth,
				height: maxHeight
			});
			$slideSled.css({
				width: outerWidth * (totalSlides+1) + "px",
				height: maxHeight,
				left : -outerWidth * activeSlide
			});
			$slideSled.removeClass("disable-transition");
		};


		var transformOrLeftCssAttrite = function(leftPosition){
			if(settings.supportsCsstransforms){
				return {"transform" : "translate("+leftPosition + "px, 0px)"};
			}else{
				return {"left" : leftPosition + "px"};
			}
		};


		var moveSlides = function moveSlides(leftPosition, doNotAnimate){		
			if(settings.supportsCsstransitions || doNotAnimate){
				$slideSled.css(transformOrLeftCssAttrite(leftPosition));
			}else{
				$slideSled.animate(transformOrLeftCssAttrite(leftPosition), {
					duration : settings.duration,
					queue : false,
					// start : function(){
					// 	settings.onTransitionStart();
					// },
					// always : settings.onTransitionEnd
				});
			}
		};


		var updateButtonState = function updateButtonState(){
			$this.toggleClass("firstSlide", (activeSlide == 0));
			$prev.prop("disabled", (activeSlide == 0));
			$this.toggleClass("lastSlide", (activeSlide == totalSlides));
			$next.prop("disabled", (activeSlide == totalSlides));

			//set ARIA roles
			$slideSled.children("li[aria-hidden!=true]").attr("aria-hidden", "true");
			$slideSled.children("li").eq(activeSlide).attr({"aria-hidden" : false});
		};


		//public: move to previous slide
		self.prev = function prev(){
			if(activeSlide > 0){
				activeSlide--;
				moveSlides(-$this.width() * activeSlide);
				updateButtonState();
			}
			//make method chainable 
			return element;
		};


		//public: move to next slide
		self.next = function next(){
			if(activeSlide < totalSlides){
				activeSlide++;
				moveSlides(-$this.width() * activeSlide);
				updateButtonState();
			}
			//make method chainable 
			return element;
		};


		//public: reset center to current slide
		self.reset = function reset(){
			moveSlides(-$this.width() * activeSlide);
			//make method chainable 
			return element;
		};


		//public: method to refresh the slider
		self.slideCountChanged = function slideCountChanged(){
			$slides = $slideSled.children("li");
			totalSlides = $slides.length-1;
			initDimensions();
			return element;
		};

		var pointSource;
		//beginning of touch - setup of vars for touchmove 
		var onTouchStart = function onTouchStart(event){
			$this.useTouch = !!event.originalEvent.touches;
			pointSource = ($this.useTouch) ? event.originalEvent.touches[0] : event.originalEvent;
			console.log(event.originalEvent);
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


		//throttles slide repositioning based on finger
		var xPos, yScrollDifference;
		var onTouchMove = function onTouchMove(event){
		//var onTouchMove = self.util.throttle(function onTouchMove(event){

			//safeguard
			if($this.useTouch && !event.originalEvent.touches){
				return
			}
			event.preventDefault();
			event.stopPropagation();

			pointSource = (event.originalEvent.touches) ? event.originalEvent.touches[0] : event.originalEvent;
			//maintain vertical scroll functionality
			yScrollDifference = pointSource.pageY - $this.pointerStartY;
			if(Math.abs(yScrollDifference) > 1){
				scrollTo(scrollX, scrollY - yScrollDifference);
			}
			
			if($this.pointerMoveActive){
				
				$this.pointerLeft = (-$this.pointerStartWidth * activeSlide) - ($this.pointerStartX - pointSource.pageX);
				if($this.pointerLeft > 0){
					//left end
					xPos = $this.pointerLeft/$this.pointerStartWidth;
					moveSlides(self.util.easing(xPos > 1 ? 1 : xPos) * ($this.pointerStartWidth / 8), true);

				}else if(totalSlides == activeSlide && $this.pointerStartTotalWidth < Math.abs($this.pointerLeft)){
					//right end
					xPos = ($this.pointerLeft + $this.pointerStartTotalWidth) / -$this.pointerStartWidth
					moveSlides(-(self.util.easing(xPos > 1 ? 1 : xPos) * $this.pointerStartWidth/8)-$this.pointerStartTotalWidth, true);

				}else{
					//normal
					moveSlides($this.pointerLeft, true);
				}
			}else{
				//init move
				onTouchStart(event);
			}
		};
		// }, function(){
		// }, 32, 16);


		//end of touch - decide wether or not to change slide
		var onTouchEnd = function onTouchEnd(event){
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
			if(touchLeft < slideLeft && touchLeft < (slideLeft + settings.pagingTouchLength) && activeSlide < totalSlides){
				self.next();
			}else if(touchLeft > slideLeft && touchLeft > (slideLeft - settings.pagingTouchLength) && activeSlide > 0) {
				self.prev();
			}else{
				self.reset();
			}
		};


		//handle window resize
		var onResize = self.util.throttle(function(){
			initDimensions();
		}, function(){
			$slideSled.removeClass("disable-transition");
		}, 16);


		//init event bindings
		var bindEvents = function bindEvents(){
			//basic previous/next bindings
			$this.on("click.mSwipe", ".mSwipe-next", self.next);
			$this.on("click.mSwipe", ".mSwipe-prev", self.prev);

			//pointer event bindings
			$this.on("touchstart.mSwipe mousedown.mSwipe", ".mSwipe-sled > li", onTouchStart);

			//change size of widget
			$(window).on("resize.mSwipe", onResize);
		};

		self.destroy = function(){
			$this.off(".mSwipe");
			$(window).off("resize.mSwipe", onResize);
		}


		//initialize widget on "document ready"
		$(function(){
			initDimensions();
			updateButtonState();
			bindEvents();
			settings.onFinishedSetup.apply(self, [self]);
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