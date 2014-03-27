/*Slider plugin*/
(function($, Modernizr){
	"use strict";

	$.fn.mSwipe = function( options ) {
		
		var settings = $.extend({
			onTransitionStart : function() {},
			onTransitionEnd : function() {},
			onFinishedSetup : function() {},
			duration : 500,
			supportsCsstransitions : !!(Modernizr||{}).csstransitions //use Modernizer if available, but make it overwritable
		}, options );

		return this.each(function(i, el) {
			var self = this,
				$this = $(el),
				$slideSled = $this.children(".mSwipe-sled"),
				$slides = $slideSled.children("li"),
				$next = $this.find(".mSwipe-next"),
				$prev = $this.find(".mSwipe-prev");


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

			self.initDimensions = function initDimensions(){
				console.log("initDimensions");

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

	


			var bindEvents = function bindEvents(){
				//basic previous/next bindings
				$this.on("click.mSwipe", ".mSwipe-next", methods.next);
				$this.on("click.mSwipe", ".mSwipe-prev", methods.prev);

				//beginning of touch - setup of vars for touchmove
				$this.on("touchstart", ".mSwipe-sled > li", function(event){
					$this.touchstartx =  event.originalEvent.touches[0].pageX;
					$this.touchstartWidth = $this.width();
					$this.touchstartTotalWidth = $this.touchstartWidth * totalSlides;

					$this.touchMoveActive = true;
					$this.touchLeft = 0;
					$slideSled.addClass("noTrans");
				});


				var xPos = 0;
				//deal with the touch move
				$this.on("touchmove.mSwipe", ".mSwipe-sled > li", self.util.throttle(function(event){
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
						}
					}, function(){}, 16, 16));

				//end of touch - decide wether or not to change slide
				$this.on("touchend.mSwipe", ".mSwipe-sled > li", function(event){
					$this.touchMoveActive = false;
					$slideSled.removeClass("noTrans");

					if($slideSled.position().left < (-$this.touchstartWidth * (activeSlide + 0.5)) && activeSlide < totalSlides){
						methods.next();
					}else if($slideSled.position().left > (-$this.touchstartWidth * (activeSlide - 0.5)) && activeSlide > 0) {
						methods.prev();
					}else{
						methods.reset();
					}
				});

				//change sizing of widget
				$(window).on("resize.mSwipe", self.util.throttle(function(){
					$slideSled.addClass("noTrans");
					self.initDimensions();
				}, function(){
					$slideSled.removeClass("noTrans");
				}, 16));
			};


			var moveSlides = function moveSlides(leftPosition, doNotAnimate){
				if(settings.supportsCsstransitions || doNotAnimate){
					$slideSled.css({"left" : leftPosition + "px"});
				}else{
					$slideSled.animate({"left" : leftPosition + "px"}, {
						duration : settings.duration,
						queue : false,
						start : settings.onTransitionStart,
						always : settings.onTransitionEnd
					});
				}
			};


			var updateButtonState = function updateButtonState(){
				$this.toggleClass("firstSlide", (activeSlide == 0));
				$prev.prop("disabled", (activeSlide == 0));

				$this.toggleClass("lastSlide", (activeSlide == totalSlides));
				$next.prop("disabled", (activeSlide == totalSlides));
			};


			
			var methods = {
				"prev" : function prev(){
					if(activeSlide > 0){
						moveSlides(-$this.width() * (activeSlide-1));
						activeSlide--;
						updateButtonState();
					}
				},
				"next" : function next(){
					if(activeSlide < totalSlides){
						moveSlides(-$this.width() * (activeSlide+1));
						activeSlide++;
						updateButtonState();
					}
				},
				"reset" : function prev(){
					moveSlides(-$this.width() * activeSlide);
				},
				"slideCountChanged" : function elementsChanged(){
					$slides = $slideSled.children("li");
					totalSlides = $slides.length-1;
					self.initDimensions();
				}
			};


			self.initDimensions();
			updateButtonState();
			bindEvents();
		});

	};


	//TODO: expose functions
	//  $.fn.mSwipe = function(methodOrOptions) {
	// 	if ( methods[methodOrOptions] ) {
	// 		return methods[ methodOrOptions ].apply( this, Array.prototype.slice.call( arguments, 1 ));
	// 	} else if ( typeof methodOrOptions === 'object' || ! methodOrOptions ) {
	// 		// Default to "init"
	// 		return methods.init.apply( this, arguments );
	// 	} else {
	// 		$.error( 'Method ' +  methodOrOptions + ' does not exist on jQuery.tooltip' );
	// 	}
	// };

})(jQuery, window.Modernizr);