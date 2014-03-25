/**
 * jQuery.wa72Slider
 *
 * A content slider plugin for jQuery for mobile and desktop browsers,
 * supports touch swipe using jquery.hammer.js
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

            // Touch Swipe support: Needs jquery.hammer.js
            if (typeof $.fn.hammer == 'function') {
                //if (window.console) window.console.log("Hammer detected");
                function handleHammer(ev) {
                    //if (window.console) window.console.log(ev);
                    // disable browser scrolling
                    ev.gesture.preventDefault();
                    if (slider.sliding) return;
                    if (slider.autoplay) clearInterval(slider.autoplay);
                    if (settings.csstrans) {
                        slider.content.css({
                            "transitionTimingFunction": settings.easingSwipe
                        });
                    }
                    var duration = Math.min(settings.duration * 2, ev.gesture.deltaTime / Math.abs(ev.gesture.deltaX) * slider.width);
                    switch(ev.type) {
                        case 'dragright':
                        case 'dragleft':
                            slider._move((slider._pos(slider.current)) - ev.gesture.deltaX, 0);
                            break;

                        case 'swipeleft':
                            slider.next(duration);
                            ev.gesture.stopDetect();
                            break;

                        case 'swiperight':
                            slider.prev(duration);
                            ev.gesture.stopDetect();
                            break;

                        case 'release':
                            // more than 50% moved, navigate
                            if(Math.abs(ev.gesture.deltaX) > slider.width/2) {
                                if(ev.gesture.direction == 'right') {
                                    slider.prev(duration);
                                } else {
                                    slider.next(duration);
                                }
                            }
                            else {
                                duration = Math.min(settings.duration, settings.duration * Math.abs(ev.gesture.deltaX) / slider.width);
                                slider._move(slider._pos(slider.current), duration);
                            }
                            break;
                    }
                }
                slider.content.hammer({'drag_lock_to_axis': true});
                slider.content.on('release dragleft dragright swipeleft swiperight', handleHammer);
                $.data(this, dataname, slider);
            }
        });
    };
}));
