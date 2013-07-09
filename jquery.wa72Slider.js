;
(function ($) {
    $.fn.wa72Slider = function (options) {

        var settings = $.extend({
            "duration": 2000,
            "csstransforms3d": Modernizr.csstransitions && Modernizr.csstransforms3d,
            "debug": true,
            "slideselector": "div",
            "loop": true,
            "autoplay": 5000,
            "showNavButtons": true,
            "easingClick": "cubic-bezier(.19, 0, .42, 1)",
            "easingSwipe": "cubic-bezier(.25, .46, .45, .94)"
        }, options);

        return this.each(function () {

            var slideshow = $(this),
                slides = slideshow.find(settings.slideselector),
                noSlides = slides.length,
                currentSlide = 0,
                swidth = slideshow.width(),
                sheight = slideshow.height(),
                slider_content = $("<div>"),
                sliding = false,
                autoplay = null;
            slideshow.css({
                'position': 'relative',
                'overflow': 'hidden'
            });

            function _makeSlide(content) {
                var s = $("<div>");
                s.width(swidth).height(sheight)
                    .css({'float': 'left', 'position': 'relative'})
                    .html(content);
                return s;
            }
            for(var i=0;i<noSlides;i++) {
               _makeSlide(slides[i]).appendTo(slider_content);
            }
            if (settings.loop) {
                slider_content.prepend(_makeSlide(slides.last().clone()));
                slider_content.append(_makeSlide(slides.first().clone()));
            }
            slideshow.empty().append(slider_content);
            slider_content.css({
                position: 'relative',
                top: 0,
                left: 0,
                width: ((noSlides + (settings.loop ? 2 : 0)) * swidth) + 'px',
                height: '100%'
            });

            // use translate3d if available
            if (settings.csstransforms3d) {
                slider_content.css({
                    "transitionProperty": "transform",
                    "transitionDuration": settings.duration + "ms",
                    "transitionTimingFunction": settings.easingClick,
                    "transform": "translate3d(0,0,0)"
                });
                //slider_content.find('img').css("transform", "translate3d(0,0,0)");
            }
            if (settings.loop) move(pos(0));

            if (settings.autoplay > 0) {
                autoplay = setInterval(nextImage, settings.autoplay);
            }

            // callback function before sliding
            function beforeSlide() {
                slideshow.trigger('beforeSlide');
                sliding = true;
            }

            // callback function after sliding
            function afterSlide() {
                if (settings.loop && (currentSlide == -1 || currentSlide == noSlides)) {
                    currentSlide = ((currentSlide == -1) ? (noSlides - 1) : 0);
                    if (settings.debug && window.console) window.console.log('Looping, current slide: ' + currentSlide);
                    move(pos(currentSlide));
                }
                sliding = false;
                slideshow.trigger('afterSlide');
            }

            function pos(no) {
                if (settings.loop) {
                    no = no + 1;
                }
                return no * swidth;
            }

            function move(pos) {
                if (settings.csstransforms3d) {
                    slider_content.css({
                        transitionDuration: '0s',
                        transform: "translate(" + (-pos) + "px,0)"
                    });
                } else {
                    slider_content.css('left', -pos + 'px');
                }
            }

            function previousImage(duration) {
                if (sliding) return;
                duration = duration ? duration : settings.duration;
                currentSlide = Math.max(currentSlide - 1, (settings.loop ? -1 : 0));
                if (settings.debug && window.console) window.console.log('Current slide: ' + currentSlide);
                beforeSlide();
                scrollImages(pos(currentSlide), duration, afterSlide);
            }

            function nextImage(duration) {
                if (sliding) return;
                duration = duration ? duration : settings.duration;
                currentSlide = Math.min(currentSlide + 1, (settings.loop ? noSlides : noSlides - 1));
                if (settings.debug && window.console) window.console.log('Current slide: ' + currentSlide);
                beforeSlide();
                scrollImages(pos(currentSlide), duration, afterSlide);
            }

            function scrollImages(distance, duration, callback) {
                //var value = (distance < 0 ? "" : "-") + Math.abs(distance).toString();
                var value = -distance;
                if (settings.csstransforms3d) {
                    if (settings.debug && window.console) window.console.log('Animate using csstransform: translate3d');
                    slider_content.css("transitionDuration", duration + "ms");
                    if (typeof callback == 'function') slider_content.one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', callback);
                    slider_content.css("transform", "translate(" + value + "px,0) translateZ(0)");
                } else {
                    if (settings.debug && window.console) window.console.log('Animate using jQuery');
                    slider_content.animate({'left': value + "px"}, duration, callback);
                }
            }

            // Touch Swipe support: Needs jquery.touchSwipe.js
            if (typeof $.fn.swipe == 'function') {
                slideshow.on('click', 'a', function(e){e.preventDefault()});
                function swipeStatus(event, phase, direction, distance, duration) {
                    if (sliding) return;
                    if (phase == "move" && (direction == "left" || direction == "right")) {
                        duration = 0;

                        if (direction == "left")
                            scrollImages((pos(currentSlide)) + distance, duration);

                        else if (direction == "right")
                            scrollImages((pos(currentSlide)) - distance, duration);

                    }

                    else if (phase == "end" && distance >= 100) {
                        if (autoplay) clearInterval(autoplay);
                        if (settings.csstransforms3d) {
                            slider_content.css({
                                "transitionTimingFunction": settings.easingSwipe
                            });
                        }
                        duration = Math.min(settings.duration * 2, duration / distance * swidth);
                        if (direction == "right")
                            previousImage(duration);
                        else if (direction == "left")
                            nextImage(duration);
                    } else {
                        duration = Math.min(settings.duration, settings.duration * distance / swidth * 2);
                        scrollImages(pos(currentSlide), duration);
                    }
                }
                var swipeOptions =
                {
                    triggerOnTouchEnd: true,
                    swipeStatus: swipeStatus,
                    allowPageScroll: "vertical",
                    threshold: 50,
                    cancelTreshold: 15,
                    excludedElements: '',
                    tap: function(event, target) {
                        var a = $(target).parents('a');
                        if (a.length == 1) {
                            window.location.href = a.attr("href");
                        }
                    }
                };
                slider_content.swipe(swipeOptions);
            }

            // add navigation buttons
            if (settings.showNavButtons) {
                var pb = $('<div>');
                pb.css({
                    position: 'absolute',
                    left: 0,
                    display: 'none'
                }).addClass('wa72slider_prevbutton');
                var nb = $('<div>');
                nb.css({
                    position: 'absolute',
                    right: 0,
                    display: 'none'
                }).addClass('wa72slider_nextbutton');
                slideshow.append(pb).append(nb);
                function showNavButtons() {
                    if (settings.loop || currentSlide > 0) pb.show();
                    if (settings.loop || currentSlide < (noSlides - 1)) nb.show();
                }
                function hideNavButtons() {
                    pb.hide();
                    nb.hide();
                }
                showNavButtons();
                slideshow.on('beforeSlide', hideNavButtons).on('afterSlide', showNavButtons);
                pb.click(function() {
                    if (autoplay) clearInterval(autoplay);
                    if (settings.csstransforms3d) {
                        slider_content.css({
                            "transitionTimingFunction": settings.easingClick
                        });
                    }
                    previousImage(settings.duration); });
                nb.click(function() {
                    if (autoplay) clearInterval(autoplay);
                    if (settings.csstransforms3d) {
                        slider_content.css({
                            "transitionTimingFunction": settings.easingClick
                        });
                    }
                    nextImage(settings.duration);
                });
            }
        });
    }
})(jQuery);
