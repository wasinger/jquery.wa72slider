/**
 * jQuery.wa72Slider
 *
 * A content slider plugin for jQuery for mobile and desktop browsers,
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
    var dataname = 'wa72slider';

    $.fn.wa72Slider = function( options ) {
        var si, args, m, r;
        if (typeof options === 'string') {
            r = [];
            args = Array.prototype.slice.call(arguments, 1);
            this.each(function() {
                si = $.data(this, dataname);
                if (!si) {
                    r.push( undefined );
                } else if (options.charAt(0) !== '_' // Ignore methods beginning with '_'
                    && typeof (m = si[options]) === 'function'
                    && (m = m.apply(si, args)) !== undefined) {
                    r.push(m);
                }
            });
            return r.length ? (r.length === 1 ? r[0] : r) : this;
        }
        var settings = $.extend({
            "duration": 2000,
            "csstrans": Modernizr.csstransitions && Modernizr.csstransforms3d,
            "debug": true,
            "slideselector": "div, img",
            "loop": true,
            "autoplay": 5000,
            "showNavButtons": true,
            "easingClick": "cubic-bezier(.19, 0, .42, 1)",
            "easingSwipe": "cubic-bezier(.25, .46, .45, .94)"
        }, options);

        settings.easing = settings.easingClick;

        return this.each(function () {
            var slider = $.data(this, dataname);
            if (slider && slider instanceof Slider) {
                return slider;
            }
            var slideframe = $(this),
                slides = slideframe.children(settings.slideselector);
            slider = new Slider(this, slides, settings);

            // Touch Swipe support: Needs jquery.touchSwipe.js
            if (typeof $.fn.swipe == 'function') {
                slideframe.on('click', 'a', function(e){e.preventDefault()});
                var swipeStatus = function(event, phase, direction, distance, duration) {
                    if (slider.sliding) return;
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
                    allowPageScroll: 'vertical',
                    threshold: 75,
                    cancelTreshold: 15,
                    excludedElements: '',
                    tap: function(event, target) {
                        var a = $(target).parents('a');
                        if (a.length == 1) {
                            window.location.href = a.attr("href");
                        }
                    }
                });
                // save the slider instance on the element
                $.data(this, dataname, slider);
            }
        });
    };
}));
