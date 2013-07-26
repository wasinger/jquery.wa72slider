/**
 * wa72Slider
 *
 * A basic swipe slider object.
 * This object handles sliding of content elements within an element acting as 'frame'.
 * All actions need to be triggered by calling exported functions like prev() or next()
 * because this slider object does not bind to input (touch, mouse) events by itself.
 *
 * Copyright 2013 Christoph Singer, Web-Agentur 72
 *
 * License: MIT
 *
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else {
        root.wa72Slider = factory(jQuery);
    }
} (this, function ($) {
    var dataname = 'wa72slider';

    function Slider(frame, slides, settings){
        var instance = $.data(frame, dataname);
        if (instance && instance instanceof Slider) {
            return instance;
        }
        if (!(this instanceof Slider)) {
            return new Slider(frame, slides, settings);
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
    Slider.prototype = {
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
            this._move(this._pos(this.current), duration, function(){Slider.prototype._afterSwitch.call(s);});
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
                this.autoplay = window.setInterval(function(){Slider.prototype.next.call(s);}, this.settings.autoplay);
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
            var slider = this,
                pb = $('<div style="position:absolute;display:none;" class="wa72slider_navbutton">'),
                nb = pb.clone();
            pb.addClass('wa72slider_prevbutton').css('left', 0);
            nb.addClass('wa72slider_nextbutton').css('right', 0);
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
            // hide nav buttons while sliding
            this.frame.on('beforeSwitch', hideNavButtons).on('afterSwitch', showNavButtons);

            var preChange = function() {
                if (slider.autoplay) clearInterval(slider.autoplay);
                if (slider.settings.csstrans) {
                    slider.content.css({
                        "transitionTimingFunction": slider.settings.easingClick
                    });
                }
            };
            pb.click(function() {
                preChange();
                slider.prev();
            });
            nb.click(function() {
                preChange();
                slider.next();
            });
        }
    };
    return Slider;
}));
