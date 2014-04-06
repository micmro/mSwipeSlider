/*Slider plugin*/
(function($, Modernizr){
	"use strict";

	var MSwipeSlider = function(element, options) {
	//$.fn.mSwipeSlider = function(options) {

		var self = this,
			$this = $(element),
			$slideSled = $this.children(".mSwipe-sled"),
			$slides = $slideSled.children("li"),
			$next = $this.find(".mSwipe-next"),
			$prev = $this.find(".mSwipe-prev"),
			settings = $.extend({
				onTransitionStart : function() {},
				onTransitionEnd : function() {},
				onFinishedSetup : function() {},
				duration : 350,
				pagingTouchLength : 50, //required length 1 == 100% | 0.25 == 25% of width
				supportsCsstransitions : !!(Modernizr||{}).csstransitions //use Modernizer if available, but make it overwritable
			}, options );


		/*
		http://www.webaxe.org/carousels-and-aria-tabs/
		http://accessibility.athena-ict.com/aria/examples/carousel.shtml

		*/
		$slideSled.attr("aria-live", "polite").css({
			"-webkit-transition-duration" : settings.duration + "ms",
			"-moz-transition-duration" : settings.duration + "ms",
			"transition-duration" : settings.duration + "ms"
		});

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
		};


		var moveSlides = function moveSlides(leftPosition, doNotAnimate){			
			if(settings.supportsCsstransitions || doNotAnimate){
				$slideSled.css({"left" : leftPosition + "px"});
			}else{
				$slideSled.animate({"left" : leftPosition + "px"}, {
					duration : settings.duration,
					queue : false,
					start : function(){
						
						settings.onTransitionStart();
					},
					always : settings.onTransitionEnd
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
			$slideSled.children("li").eq(activeSlide).attr({
				"aria-hidden" : false
			});
		};


		//public: move to previous slide
		self.prev = function prev(){
			if(activeSlide > 0){
				activeSlide--;
				moveSlides(-$this.width() * activeSlide);
				updateButtonState();
			}
			//make this chainable 
			return element;
		};


		//public: move to next slide
		self.next = function next(){
			if(activeSlide < totalSlides){
				activeSlide++;
				moveSlides(-$this.width() * activeSlide);
				updateButtonState();
			}
			//make this chainable 
			return element;
		};


		//public: reset center to current slide
		self.reset = function reset(){
			moveSlides(-$this.width() * activeSlide);
			//make this chainable 
			return element;
		};


		//public: method to refresh the slider
		self.slideCountChanged = function slideCountChanged(){
			$slides = $slideSled.children("li");
			totalSlides = $slides.length-1;
			initDimensions();
			return element;
		};


				//TEMP - DEBUG
		var trcHolder = $("#supportTrace");

		var trc = function(msg){
			console.log(msg);
			//trcHolder.append("<li>"+msg+"</li>");
		};
	

		//beginning of touch - setup of vars for touchmove
		var onTouchStart = function(event){
			event.preventDefault();
			$this.touchstartx =  event.originalEvent.touches[0].pageX;
			$this.touchstartWidth = $this.width();
			$this.touchstartTotalWidth = $this.touchstartWidth * totalSlides;

			$this.touchMoveActive = true;
			$this.touchLeft = 0;

			$slideSled.addClass("noTrans");
		};


		//throttles slide repositioning based on finger
		var xPos;
		//var onTouchMove = self.util.throttle(function(event){
		var onTouchMove = function(event){
			event.preventDefault();
			if($this.touchMoveActive){
				$this.touchLeft = (-$this.touchstartWidth * activeSlide) - ($this.touchstartx - event.originalEvent.touches[0].pageX);
				if($this.touchLeft > 0){
					//left end
					xPos = $this.touchLeft/$this.touchstartWidth;
					moveSlides(self.util.easing(xPos > 1 ? 1 : xPos) * ($this.touchstartWidth / 8), true);

				}else if(totalSlides == activeSlide && $this.touchstartTotalWidth < Math.abs($this.touchLeft)){
					//right end
					xPos = ($this.touchLeft + $this.touchstartTotalWidth) / -$this.touchstartWidth
					moveSlides(-(self.util.easing(xPos > 1 ? 1 : xPos) * $this.touchstartWidth/8)-$this.touchstartTotalWidth, true);

				}else{
					//normal
					moveSlides($this.touchLeft, true);
				}
			}else{
				trc("touch without touchMoveActive");
				onTouchStart(event);
			}
		};
		//}, function(){}, 16, 16);


		//end of touch - decide wether or not to change slide
		var onTouchEnd = function(event){
			event.preventDefault();
			$this.touchMoveActive = false;
			$slideSled.removeClass("noTrans");
			//
			if($slideSled.position().left < ((-$this.touchstartWidth * activeSlide) + settings.pagingTouchLength) && activeSlide < totalSlides){
				self.next();
			}else if($slideSled.position().left > ((-$this.touchstartWidth * activeSlide) - settings.pagingTouchLength) && activeSlide > 0) {
				self.prev();
			}else{
				self.reset();
			}
		};


		var onResize = self.util.throttle(function(){
			initDimensions();
		}, function(){
			$slideSled.removeClass("noTrans");
		}, 16);


		var bindEvents = function bindEvents(){
			//basic previous/next bindings
			$this.on("click.mSwipe", ".mSwipe-next", self.next);
			$this.on("click.mSwipe", ".mSwipe-prev", self.prev);

			//touch bindings
			$this.on("touchstart", ".mSwipe-sled > li", onTouchStart);
			$this.on("touchmove.mSwipe", ".mSwipe-sled > li", onTouchMove);
			$this.on("touchend.mSwipe touchcancel.mSwipe touchleave.mSwipe", ".mSwipe-sled > li", onTouchEnd);

			//change sizing of widget
			$(window).on("resize.mSwipe", onResize);
		};


		initDimensions();
		updateButtonState();
		bindEvents();
	};



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