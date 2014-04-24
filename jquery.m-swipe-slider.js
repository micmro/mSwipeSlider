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
				onTransitionStart : function() {},
				onTransitionEnd : function() {},
				onFinishedSetup : function() {},
				duration : 350,
				pagingTouchLength : 100, //in px
				supportsCsstransitions : !!(Modernizr||{}).csstransitions, //use Modernizer if available, but make it overwritable
				supportsCsstransforms : !!(Modernizr||{}).csstransforms //use Modernizer if available, but make it overwritable
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
			$slideSled.addClass("noTrans");
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
			$slideSled.removeClass("noTrans");
		};

		var transformOrLeftCssAttrite = function(leftPosition){
			if(settings.supportsCsstransforms){
				//-ms-transform:translate(0px,0px); /* IE 9 */
				//-webkit-transform:translate(0px,0px);
				return {"transform" : "translate("+leftPosition + "px, 0px)"};
			}else{
				return {"left" : leftPosition + "px"};
			}
		};
		var moveSlides = function moveSlides(leftPosition, doNotAnimate){		
			if(settings.supportsCsstransitions || doNotAnimate){
				//$slideSled.css({"left" : leftPosition + "px"});
				$slideSled.css(transformOrLeftCssAttrite(leftPosition));
				//$slideSled[0].style.left = leftPosition + "px";

			}else{
				$slideSled.animate(transformOrLeftCssAttrite(leftPosition), {
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
			console.log("prev");
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
			console.log("next");
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
			console.log("reset");
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


		//beginning of touch - setup of vars for touchmove
		var onTouchStart = function onTouchStart(event){
			event.preventDefault();
			$this.touchstartx =  event.originalEvent.touches[0].pageX;
			$this.touchstartY =  event.originalEvent.touches[0].pageY;
			$this.touchstartWidth = $this.width();
			$this.touchstartTotalWidth = $this.touchstartWidth * totalSlides;

			$this.touchMoveActive = true;
			$this.touchLeft = 0;

			$slideSled.addClass("noTrans");
			console.log("onTouchStart");
		};


		//throttles slide repositioning based on finger
		var xPos;
		var yScrollDifference;
		var onTouchMove = self.util.throttle(function onTouchMove(event){
			event.preventDefault();
			event.stopPropagation();

			//maintain vertical scroll functionality
			yScrollDifference = event.originalEvent.touches[0].pageY - $this.touchstartY;
			if(Math.abs(yScrollDifference) > 1){
				scrollTo(scrollX, scrollY - yScrollDifference);
			}
			
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
					//console.log("onTouchMove NORMAL", $this.touchLeft, event.originalEvent.touches[0].pageX, $this.touchstartx);
					//normal
					moveSlides($this.touchLeft, true);
				}
			}else{
				console.log("UNSTARTED onTouchMove");
				onTouchStart(event);
			}
		}, function(){
			console.log("onTouchMove DELAY Callback");
		}, 64, 64);


		//end of touch - decide wether or not to change slide
		var onTouchEnd = function onTouchEnd(event){
			event.preventDefault();
			//event.stopPropagation();
			console.log("onTouchEnd", $slideSled.hasClass("noTrans"));
			
			$this.touchMoveActive = false;
			$slideSled.removeClass("noTrans");

			var touchLeft = $slideSled.position().left;
			var slideLeft = -$this.touchstartWidth * activeSlide;

			if(touchLeft < slideLeft  &&  touchLeft < (slideLeft + settings.pagingTouchLength) && activeSlide < totalSlides){
				self.next();
			}else if(touchLeft > slideLeft  &&  touchLeft > (slideLeft - settings.pagingTouchLength) && activeSlide > 0) {
				self.prev();
			}else{
				self.reset();
			}
		};


		//handle window resize
		var onResize = self.util.throttle(function(){
			initDimensions();
		}, function(){
			$slideSled.removeClass("noTrans");
		}, 16);


		//init event bindings
		var bindEvents = function bindEvents(){
			//basic previous/next bindings
			$this.on("click touch", ".mSwipe-next", self.next);
			$this.on("click.mSwipe", ".mSwipe-prev", self.prev);

			//touch bindings
			$this.on("touchstart.mSwipe", ".mSwipe-sled > li", onTouchStart);
			$this.on("touchmove.mSwipe", ".mSwipe-sled > li", onTouchMove);
			$this.on("touchend.mSwipe touchcancel.mSwipe touchleave.mSwipe", ".mSwipe-sled > li", onTouchEnd);

			//change sizing of widget
			$(window).on("resize.mSwipe", onResize);
		};


		//initialize widget
		initDimensions();
		updateButtonState();
		bindEvents();
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