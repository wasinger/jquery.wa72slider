/**
 * jQuery wa72SwipeGallery
 *
 * A swipe photo gallery plugin for jQuery for mobile and desktop browsers,
 * supports touch swipe using jquery.touchSwipe.js (https://github.com/mattbryson/TouchSwipe-Jquery-Plugin)
 * and mouse wheel zooming using jquery.mousewheel.js (https://github.com/brandonaaron/jquery-mousewheel)
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
    $.fn.wa72SwipeGallery = function (options) {

        var settings = $.extend({
            "duration": 2000,
            "csstrans": Modernizr.csstransitions && Modernizr.csstransforms3d,
            "debug": true,
            "loop": true,
            "autoplay": false,
            "showNavButtons": true,
            "easingClick": "cubic-bezier(.19, 0, .42, 1)",
            "easingSwipe": "cubic-bezier(.25, .46, .45, .94)",
            "panZoomImages": true
        }, options);
        settings.easing = settings.easingClick;
        var slides = [],
            slideframe = $('<div id="wa72SwipeGalleryFrame" style="display:none;position:fixed;background-color:black;top:0;bottom:0;left:0;right:0;z-index:1000;width:100%;height:100%"></div>');
        slideframe.appendTo($('body'));

        this.each(function() {
            var $this = $(this), i = $(new Image);
            i.attr('src', $this.attr('href'));
            i.css({
                'max-height': '100%',
                'max-width': '100%'
            });
            slides.unshift(i);
            $this.on('click', function(e) {
                e.preventDefault();
                slideframe.show();
                return false;
            });
        });

        var slider = new Slider(slideframe, slides, settings);


        // Touch Swipe support: Needs jquery.touchSwipe.js
        if (typeof $.fn.swipe == 'function') {
            var matrix, scale;
            var swipeStatus = function(event, phase, direction, distance, duration) {
                if (slider.sliding) return;

                var $target = $(event.target);
                if (settings.panZoomImages && typeof $.fn.wa72zoomer == 'function') {
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

                else if (phase == "end" && distance >= 75) {
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
                threshold: 75,
                cancelTreshold: 15,
                doubleTap: function(event, target) {
                    var $target = $(target);
                    if (settings.panZoomImages && typeof $.fn.wa72zoomer == 'function') {
                        $target.wa72zoomer('toggleZoom');
                    }
                }

            });
            if (settings.panZoomImages && typeof $.fn.wa72zoomer == 'function') {
                slideframe.on('afterSwitch', function() {
                    slider.content.find('img').wa72zoomer('reset');
                    var $cs = slider.getCurrentSlide().find('img');
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
                            // mouse wheel zoom: needs jquery.mousewheel.js
                            if (typeof $.fn.mousewheel == 'function') {
                                $cs.mousewheel(function(event, delta, deltaX, deltaY) {
                                    event.preventDefault();
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
    }
}));
