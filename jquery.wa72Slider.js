/**
 * jQuery wa72Slider
 *
 * A slideshow plugin for jQuery for mobile and desktop browsers,
 * supports touch swipe using jquery.touchSwipe.js (https://github.com/mattbryson/TouchSwipe-Jquery-Plugin)
 * and mouse wheel using jquery.mousewheel.js (https://github.com/brandonaaron/jquery-mousewheel)
 *
 * Copyright 2013 Christoph Singer, Web-Agentur 72
 *
 * License: MIT
 *
 */
(function ($) {
    var dataname = 'wa72slider';

    function Wa72Slider(frame, slides, settings){
        var instance = $.data(frame, dataname);
        if (instance && instance instanceof Wa72Slider) {
            return instance;
        }
        if (!(this instanceof Wa72Slider)) {
            return new Wa72Slider(frame, slides, settings);
        }
        this.frame = $(frame);
        this.frame.css({
            'position': 'relative',
            'overflow': 'hidden'
        });
        this.width = this.frame.width();
        this.height = this.frame.height();
        this.settings = settings;
        this.content = $('<div class="wa72slider_content">');
        for(var i=0;i<slides.length;i++) {
            this._addSlide(slides[i]);
        }
        this._show();
        // add navigation buttons
        if (settings.showNavButtons) {
            this._addNavigationButtons();
        }
        $.data(frame, dataname, this);
        return this;
    }
    Wa72Slider.prototype = {
        'nos': 0,
        'slides': [],
        'current': 0,
        'sliding': false,


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
        'getCurrentSlide': function() {
            return this.slides[this.current - 1];
        },
        'getPrevSlide': function() {
            return this.slides[this.current - 2];
        },
        'getNextSlide': function() {
            return this.slides[this.current];
        },

        "_addSlide": function(content) {
            var slide = $('<div class="wa72slider_slide">').width(this.width)
                .css({'float': 'left', 'position': 'relative', 'height': '100%', 'overflow': 'hidden'})
                .html(content)
                .appendTo(this.content);
            this.slides.unshift(slide);
            this.nos++;
        },
        "_show": function() {
            this.frame.empty().append(this.content);
            if (this.settings.loop) {
                var fc = this.content.children('div.wa72slider_slide').first().clone();
                this.content.prepend(this.content.children('div.wa72slider_slide').last().clone());
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
        },
        '_addNavigationButtons': function() {
            var slider = this;
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
            this.frame.append(pb).append(nb);
            var showNavButtons = function() {
                if (slider.settings.loop || slider.current > 1) pb.show();
                if (slider.settings.loop || slider.current < (slider.nos)) nb.show();
            };
            var hideNavButtons = function() {
                pb.hide();
                nb.hide();
            };
            showNavButtons();
            this.frame.on('beforeSwitch', hideNavButtons).on('afterSwitch', showNavButtons);

            pb.click(function() {
                if (slider.autoplay) clearInterval(slider.autoplay);
                if (slider.settings.csstrans) {
                    slider.content.css({
                        "transitionTimingFunction": slider.settings.easingClick
                    });
                }
                slider.prev(slider.settings.duration);
            });
            nb.click(function() {
                if (slider.autoplay) clearInterval(slider.autoplay);
                if (slider.settings.csstrans) {
                    slider.content.css({
                        "transitionTimingFunction": slider.settings.easingClick
                    });
                }
                slider.next(slider.settings.duration);
            });
        }
    };

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
                noSlides = slides.length,
                slider = new Wa72Slider(this, slides, settings);



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
})(jQuery);
