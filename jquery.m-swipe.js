/*Slider plugin*/
(function($){
	"use strict";

	$.fn.mSwipe = function( options ) {
		
		var settings = $.extend({
			onTransitionStart : function() {},
			onTransitionEnd : function() {},
			onFinishedSetup : function() {},
			duration : 500
		}, options );

		return this.each(function(i, el) {
			var $this = $(el),
				$slideWrap = $this.children(".mSwipe-wrap"),
				$slides = $slideWrap.children("li"),
				$next = $this.closest(".mSwipe-next"),
				$prev = $this.closest(".mSwipe-prev");

			var currSlide = 1,
				totalSlides = $slides.length;

			var initDimensions = function(){
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
				$slideWrap.css({
					width: outerWidth * totalSlides + "px",
					height: maxHeight
				});
			};


			var bindEvents = function(){
				$this.on("mousedown", ".mSwipe-next", methods.next);
				$this.on("mousedown", ".mSwipe-prev", methods.prev);
			};

			var moveSlides = function(leftPosition){
				$slideWrap.animate({"left" : leftPosition + "px"}, {
					duration : settings.duration,
					queue : false,
					start : settings.onTransitionStart,
					always : settings.onTransitionStart
				});
			};

			var updateButtonState = function(){
				if(currSlide == 1){
					$prev.prop("disabled", true).addClass("disabled");
				}else if($prev.is(":disabled")){
					$prev.prop("disabled", false).removeClass("disabled");
				}
				if (currSlide >= totalSlides){
					$next.prop("disabled", true).addClass("disabled");
				}else if($next.is(":disabled")){
					$next.prop("disabled", false).removeClass("disabled");
				}
			};

			var methods = {
				"prev" : function(){
					console.log("prev", currSlide);
					if(currSlide >= 1){
						moveSlides(-$this.width() * (currSlide - 1));
						currSlide--;
						updateButtonState();
					}
				},
				"next" : function(){
					console.log("next", currSlide);
					if(currSlide < totalSlides){
						moveSlides(-$this.width() * (currSlide));
						currSlide++;
					}
				}
			};


			initDimensions();
			updateButtonState();
			bindEvents();
		});

	}

})(jQuery);