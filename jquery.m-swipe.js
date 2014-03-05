/*Slider plugin*/
(function($, Modernizr){
	"use strict";

	$.fn.mSwipe = function( options ) {
		
		var settings = $.extend({
			onTransitionStart : function() {},
			onTransitionEnd : function() {},
			onFinishedSetup : function() {},
			duration : 500,
			supportsCsstransitions : !!(Modernizr||{}).csstransitions
		}, options );

		return this.each(function(i, el) {
			var self = this,
				$this = $(el),
				$slideSled = $this.children(".mSwipe-sled"),
				$slides = $slideSled.children("li"),
				$next = $this.find(".mSwipe-next"),
				$prev = $this.find(".mSwipe-prev");

			//temp debug
			window._this = $this;
			window._next = $next;
			window._prev = $prev;

			var activeSlide = 0,
				totalSlides = $slides.length-1;

			self.initDimensions = function(){
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


			var throttleAndCleanup = function throttle(fn, cleanUpFn) {
				var last, deferTimer, deferCleanupTimer;

				var resetCleanup = function(){
					clearTimeout(deferTimer);
					deferCleanupTimer = setTimeout(function(){
						cleanUpFn.apply(self);
					}, 50);
				};

				return function () {
					var now = +new Date, args = arguments;
					if (last && now < last + 50) {
						clearTimeout(deferTimer);
						clearTimeout(deferCleanupTimer);
						deferTimer = setTimeout(function () {
							last = now;
							$slideSled.addClass("noTrans");
							fn.apply(self, args);
							resetCleanup();
						}, 50);
					} else {
						last = now;
						$slideSled.addClass("noTrans");
						fn.apply(self, args);
						resetCleanup();
					}
				};
			};


			var bindEvents = function(){
				$this.on("click.mSwipe", ".mSwipe-next", methods.next);
				$this.on("click.mSwipe", ".mSwipe-prev", methods.prev);

				$(window).on("resize.mSwipe", throttleAndCleanup(self.initDimensions, function(){
					$slideSled.removeClass("noTrans");
				}));
			};


			var moveSlides = function(leftPosition){
				console.log(settings.supportsCsstransitions, leftPosition);
				if(settings.supportsCsstransitions){
					$slideSled.css({"left" : leftPosition + "px"})
				}else{
					$slideSled.animate({"left" : leftPosition + "px"}, {
						duration : settings.duration,
						queue : false,
						start : settings.onTransitionStart,
						always : settings.onTransitionStart
					});
				}
			};


			var updateButtonState = function(){
				$this.toggleClass("firstSlide", (activeSlide == 0));
				$prev.prop("disabled", (activeSlide == 0));

				$this.toggleClass("lastSlide", (activeSlide == totalSlides));
				$next.prop("disabled", (activeSlide == totalSlides));
			};


			
			var methods = {
				"prev" : function(){
					console.log("prev",activeSlide);
					if(activeSlide > 0){
						moveSlides(-$this.width() * (activeSlide-1));
						activeSlide--;
						updateButtonState();
					}
				},
				"next" : function(){
					console.log("next",activeSlide);
					if(activeSlide < totalSlides){
						moveSlides(-$this.width() * (activeSlide+1));
						activeSlide++;
						updateButtonState();
					}
				}
			};


			self.initDimensions();
			updateButtonState();
			bindEvents();
		});

	}

})(jQuery, window.Modernizr);