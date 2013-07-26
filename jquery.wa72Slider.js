/**
 * jQuery wa72Slider
 *
 * A swipe slider plugin for jQuery for mobile and desktop browsers,
 * supports touch swipe using jquery.touchSwipe.js (https://github.com/mattbryson/TouchSwipe-Jquery-Plugin)
 *
 * Copyright 2013 Christoph Singer, Web-Agentur 72
 *
 * License: MIT
 *
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery', 'wa72Slider'], factory);
    } else {
        factory(jQuery, root.wa72Slider);
    }
} (this, function ($, Slider) {
    $.fn.wa72Slider = function (options) {

        var settings = $.extend({
            "duration": 2000,
            "csstrans": Modernizr.csstransitions && Modernizr.csstransforms3d,
            "debug": true,
            "slideselector": "div, img",
            "loop": true,
            "autoplay": 5000,
            "showNavButtons": true,
            "easingClick": "cubic-bezier(.19, 0, .42, 1)",
            "easingSwipe": "cubic-bezier(.25, .46, .45, .94)",
            "panZoomImages": true
        }, options);

        return this.each(function () {

            var slideframe = $(this),
                slides = slideframe.children(settings.slideselector),
                slider = new Slider(this, slides, settings);

            // Touch Swipe support: Needs jquery.touchSwipe.js
            if (typeof $.fn.swipe == 'function') {
                slideframe.on('click', 'a', function(e){e.preventDefault()});
                var matrix, scale;
                var swipeStatus = function(event, phase, direction, distance, duration) {
                    if (slider.sliding) return;

                    var $target = $(event.target);
                    if (settings.panZoomImages && typeof $.fn.wa72zoomer == 'function' && $target.hasClass('wa72slide_image')) {
                        // panning of zoomed image
                        if (phase == 'start') {
                            matrix = $target.wa72zoomer('getMatrix');
                            scale = +matrix[0];
                            return;
                        } else if (phase == 'move' || phase == 'end' && scale > 1) {
                            var x = +matrix[4] + (direction == "left" ? -distance : (direction == "right" ? +distance : 0));
                            var y = +matrix[5] + (direction == "up" ? -distance : (direction == "down" ? +distance : 0));
                            //window.console.log('pan: ' + x + ";" + y);
                            $target.wa72zoomer('pan',  x,  y, {'relative': false, 'animate': false});
                            if ($target.wa72zoomer('getMatrix')[4] != matrix[4]) {
                                return;
                            }
                        }
                    }
                    if (phase == "move" && (direction == "left" || direction == "right")) {
                        duration = 0;
                        if (direction == "left")
                            slider._move((slider._pos(slider.current)) + distance, duration);
                        else if (direction == "right")
                            slider._move((slider._pos(slider.current)) - distance, duration);
                    }

                    else if (phase == "end" && distance >= 50) {
                        if (slider.autoplay) clearInterval(slider.autoplay);
                        if (settings.csstrans) {
                            slider.content.css({
                                "transitionTimingFunction": settings.easingSwipe
                            });
                        }
                        duration = Math.min(settings.duration * 2, duration / distance * slider.width);
                        if (direction == "right")
                            slider.prev(duration);
                        else if (direction == "left")
                            slider.next(duration);
                    } else {
                        duration = Math.min(settings.duration, settings.duration * distance / slider.width * 2);
                        slider._move(slider._pos(slider.current), duration);
                    }
                };
                slider.content.swipe({
                    triggerOnTouchEnd: true,
                    swipeStatus: swipeStatus,
                    allowPageScroll: 'none',
                    threshold: 50,
                    cancelTreshold: 15,
                    excludedElements: '',
                    tap: function(event, target) {
                        var a = $(target).parents('a');
                        if (a.length == 1) {
                            window.location.href = a.attr("href");
                        }
                    },
                    doubleTap: function(event, target) {
                        var $target = $(target);
                        if (settings.panZoomImages && typeof $.fn.wa72zoomer == 'function' && $target.hasClass('wa72slide_image')) {
                            $target.wa72zoomer('toggleZoom');
                        }
                    }

                });
                if (settings.panZoomImages && typeof $.fn.wa72zoomer == 'function') {
                    slideframe.on('afterSwitch', function() {
                        slider.content.find('img.wa72slide_image').wa72zoomer('reset');
                        var $cs = slider.getCurrentSlide().find('img.wa72slide_image');
                        if ($cs.length) {
                            var i = new Image;
                            i.src = $cs.attr('src');
                            i.onload = function(){
                                // allow maxScale up to the pixel dimensions of the original image
                                var maxScale = Math.max(i.width / $cs.width(), i.height / $cs.height());
                                $cs.wa72zoomer({
                                    'minScale': 1,
                                    'maxScale': maxScale
                                });
                                $cs.swipe({
                                    pinchIn: function(event, direction, distance, duration, fingerCount, pinchZoom)
                                    {
                                        $cs.wa72zoomer('zoom', pinchZoom);
                                    },
                                    pinchOut: function(event, direction, distance, duration, fingerCount, pinchZoom)
                                    {
                                        $cs.wa72zoomer('zoom', pinchZoom);
                                    },
                                    fingers: 2
                                });
                                if (typeof $.fn.mousewheel == 'function') {
                                    $cs.mousewheel(function(event, delta, deltaX, deltaY) {
                                        if (deltaY > 0) {
                                            $cs.wa72zoomer('zoom', false,
                                                {'middle': {pageX: event.pageX, pageY: event.pageY}});
                                        } else {
                                            $cs.wa72zoomer('zoom', true,
                                                {'middle': {pageX: event.pageX, pageY: event.pageY}});
                                        }
                                    });
                                }
                            };
                        }
                    });
                }
            }
        });
    }
}));
