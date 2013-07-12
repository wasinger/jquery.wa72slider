/**
 * jQuery wa72Slider
 *
 * A slideshow plugin for jQuery for mobile and desktop browsers,
 * supports touch swipe using jquery.touchSwipe.js (https://github.com/mattbryson/TouchSwipe-Jquery-Plugin)
 *
 * Copyright 2013 Christoph Singer, Web-Agentur 72
 *
 * License: MIT
 *
 */
(function ($) {
    function Wa72Slider(frame, settings){
        this.frame = frame;
        this.frame.css({
            'position': 'relative',
            'overflow': 'hidden'
        });
        this.width = this.frame.width();
        this.height = this.frame.height();
        this.settings = settings;
        this.content = $('<div class="wa72slider_content">');
    }
    Wa72Slider.prototype = {
        'nos': 0,
        'slides': [],
        'current': 0,
        'sliding': false,

        'addSlide': function(content) {
            $('<div class="wa72slider_slide">').width(this.width)
                .css({'float': 'left', 'position': 'relative', 'height': '100%', 'overflow': 'hidden'})
                .html(content)
                .appendTo(this.content);
            this.nos++;
        },
        'show': function() {
            this.frame.empty().append(this.content);
            if (this.settings.loop) {
                var fc = this.content.children('div').first().clone();
                this.content.prepend(this.content.children('div').last().clone());
                this.content.append(fc);
            }
            this.content.css({
                'position': 'relative', 'top': 0, 'left': 0
            }).height(this.height).width((this.settings.loop ? this.nos + 2 : this.nos) * this.width);
            if (this.settings.csstrans) {
                this.content.css({
                    "transitionProperty": "transform",
                    "transitionDuration": this.settings.duration + "ms",
                    "transitionTimingFunction": this.settings.easingClick,
                    "transform": "translate3d(0,0,0)"
                });
                this.content.find('img').css("transform", "translate3d(0,0,0)");
            }
            this.current = 1;
            this._fastmove(this._pos(1));
            if (this.settings.autoplay > 0) {
                var s = this;
                this.autoplay = window.setInterval(function(){Wa72Slider.prototype.next.call(s);}, this.settings.autoplay);
            }
        },
        'goTo': function(n, duration) {
            if (this.sliding) return;
            duration = duration ? duration : this.settings.duration;
            this._beforeSwitch();
            if (n < 1) {
                this.current = (this.settings.loop ? 0 : 1);
            } else if (n > this.nos) {
                this.current = (this.settings.loop ? this.nos + 1 : this.nos);
            } else {
                this.current = n;
            }
            if (this.settings.debug && window.console) window.console.log('Current slide: ' + this.current);
            var s = this;
            this._move(this._pos(this.current), duration, function(){Wa72Slider.prototype._afterSwitch.call(s);});
        },
        'next': function(duration) {
            this.goTo(this.current + 1, duration);
        },
        'prev': function(duration) {
            this.goTo(this.current - 1, duration);
        },
        'on': function(event, callback) {
            return this.frame.on(event, callback);
        },

        '_pos': function(no) {
            if (!this.settings.loop) {
                no = Math.max(no - 1, 0);
            }
            return no * this.width;
        },
        '_move': function(pos, duration, callback) {
            if (this.settings.csstrans) {
                this.content.css('transitionDuration', duration + 'ms');
                if (typeof callback === 'function') {
                    this.content.one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', callback);
                }
                this.content.css('transform', 'translate(' + (-pos) + 'px,0) translateZ(0)');
            } else {
                this.content.animate({'left': (-pos) + 'px'}, duration, callback);
            }
        },
        '_fastmove': function(pos) {
            if (this.settings.csstrans) {
                this.content.css('transitionDuration', '0ms');
                this.content.css('transform', 'translate(' + (-pos) + 'px,0)');
            } else {
                this.content.css('left', (-pos) + 'px');
            }
        },
        // callback function before switching slides
        '_beforeSwitch': function() {
            this.frame.trigger('beforeSwitch');
            this.sliding = true;
        },

        // callback function after switching slides
        '_afterSwitch': function() {
            if (this.settings.loop && (this.current === 0 || this.current === this.nos + 1)) {
                this.current = ((this.current === 0) ? (this.nos) : 1);
                if (this.settings.debug && window.console) window.console.log('Looping, current slide: ' + this.current);
                this._fastmove(this._pos(this.current));
            }
            this.sliding = false;
            this.frame.trigger('afterSwitch');
        }
    };

    $.fn.wa72Slider = function (options) {

        var settings = $.extend({
            "duration": 2000,
            "csstrans": Modernizr.csstransitions && Modernizr.csstransforms3d,
            "debug": true,
            "slideselector": "div",
            "loop": true,
            "autoplay": 5000,
            "showNavButtons": true,
            "easingClick": "cubic-bezier(.19, 0, .42, 1)",
            "easingSwipe": "cubic-bezier(.25, .46, .45, .94)"
        }, options);

        return this.each(function () {

            var slideframe = $(this),
                slides = slideframe.find(settings.slideselector),
                noSlides = slides.length,
                slider = new Wa72Slider(slideframe, settings);

            for(var i=0;i<noSlides;i++) {
               slider.addSlide(slides[i]);
            }
            slider.show();

            // Touch Swipe support: Needs jquery.touchSwipe.js
            if (typeof $.fn.swipe == 'function') {
                slideframe.on('click', 'a', function(e){e.preventDefault()});
                var swipeStatus = function(event, phase, direction, distance, duration) {
                    if (slider.sliding) return;

                    var target = $(event.target);
                    if (target.hasClass('wa72slide_image')) {
                        // TODO: panning of zoomed image
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

                });
                // TODO: pan & zoom support
                /*$('img.wa72slide_image').swipe({
                    pinchIn: function(event, direction, distance, duration, fingerCount, pinchZoom)
                    {
                        $(event.target).css('transform', 'scale('+pinchZoom+','+pinchZoom+')');
                    },
                    pinchOut: function(event, direction, distance, duration, fingerCount, pinchZoom)
                    {
                        $(event.target).css('transform', 'scale('+pinchZoom+','+pinchZoom+')');
                    },
                    fingers: 2
                })*/
            }

            // Pan Zoom Support: Needs jquery.panzoom.js
            /*if (typeof $.fn.panzoom == 'function') {
                $('.wa72slide_image').panzoom({
                    'contain': 'invert'
                });
            }*/

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
                slideframe.append(pb).append(nb);
                var showNavButtons = function() {
                    if (settings.loop || slider.current > 1) pb.show();
                    if (settings.loop || slider.current < (noSlides)) nb.show();
                };
                var hideNavButtons = function() {
                    pb.hide();
                    nb.hide();
                };
                showNavButtons();
                slideframe.on('beforeSlide', hideNavButtons).on('afterSlide', showNavButtons);
                pb.click(function() {
                    if (slider.autoplay) clearInterval(slider.autoplay);
                    if (settings.csstrans) {
                        slider.content.css({
                            "transitionTimingFunction": settings.easingClick
                        });
                    }
                    slider.prev(settings.duration);
                });
                nb.click(function() {
                    if (slider.autoplay) clearInterval(slider.autoplay);
                    if (settings.csstrans) {
                        slider.content.css({
                            "transitionTimingFunction": settings.easingClick
                        });
                    }
                    slider.next(settings.duration);
                });
            }
        });
    }
})(jQuery);
