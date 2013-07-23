/**
 * (c) 2013 Christoph Singer, Web-Agentur 72
 * Released under the MIT license
 *
 * many code lines directly taken from or at least heavily inspired by
 * jquery.panzoom.js, Copyright (c) 2013 timmy willison
 * Released under the MIT license
 * https://github.com/timmywil/jquery.panzoom
 */

(function ($) {
    var dataname = 'wa72zoomer';

    var floating = '(\\-?[\\d\\.e]+)';
    var commaSpace = '\\,?\\s*';
    var rmatrix = new RegExp(
        '^matrix\\(' +
            floating + commaSpace +
            floating + commaSpace +
            floating + commaSpace +
            floating + commaSpace +
            floating + commaSpace +
            floating + '\\)$'
    );

    function Zoomer(e, o) {
        var instance = $.data(e, dataname);
        if (instance && instance instanceof Zoomer) {
            return instance;
        }
        if (!(this instanceof Zoomer)) {
            return new Zoomer(e, o);
        }
        this.elem = e;
        var $elem = this.$elem = $(e);
        this.options = $.extend( {}, Zoomer.settings, o );

        this.$parent = $elem.parent();

        // This is SVG if the namespace is SVG
        // However, while <svg> elements are SVG, we want to treat those like other elements
        this.isSVG = /^http:[\w\.\/]+svg$/.test( e.namespaceURI ) && e.nodeName.toLowerCase() !== 'svg';

        this.panning = false;

        // Save the original transform value
        // Save the prefixed transform style key
        this._buildTransform();
        // Build the appropriately-prefixed transform style property name
        // De-camelcase
        this._transform = $.cssProps.transform.replace( /([A-Z])/g, '-$1' ).toLowerCase();
        // Build the transition value
        this._buildTransition();

        // Build containment if necessary
        this._buildContain();

        $.data(e, dataname, this);
        return this;
    }

    Zoomer.settings = {
        eventNamespace: '.wa72zoomer',
        transition: true,
        increment: 0.3,
        minScale: 0.4,
        maxScale: 5,
        duration: 200,
        easing: 'ease-in-out',
        contain: 'invert',
        startTransform: undefined
    };

    Zoomer.prototype = {
        /**
         * Zoom in/out the element using the scale properties of a transform matrix
         * @param {Number|Boolean} [scale] The scale to which to zoom or a boolean indicating to transition a zoom out
         * @param {Object} [opts]
         * @param {Boolean} [opts.noSetRange] Specify that the method should not set the $zoomRange value (as is the case when $zoomRange is calling zoom on change)
         * @param {Object} [opts.middle] Specify a middle point towards which to gravitate when zooming
         * @param {Boolean} [opts.animate] Whether to animate the zoom (defaults to true if scale is not a number, false otherwise)
         * @param {Boolean} [opts.silent] Silence the zoom event
         * @author timmy willison
         */
        zoom: function( scale, opts ) {
            var animate = false;
            var options = this.options;
            if ( options.disableZoom ) { return; }
            // Shuffle arguments
            if ( typeof scale === 'object' ) {
                opts = scale;
                scale = null;
            } else if ( !opts ) {
                opts = {};
            }
            var matrix = this.getMatrix();

            // Set the middle point
            var middle = opts.middle;
            if ( middle ) {
                matrix[4] = +matrix[4] + (middle.pageX === matrix[4] ? 0 : middle.pageX > matrix[4] ? 1 : -1);
                matrix[5] = +matrix[5] + (middle.pageY === matrix[5] ? 0 : middle.pageY > matrix[5] ? 1 : -1);
            }

            // Calculate zoom based on increment
            if ( typeof scale !== 'number' ) {
                scale = +matrix[0] + (options.increment * (scale ? -1 : 1));
                animate = true;
            }

            // Constrain scale
            if ( scale > options.maxScale ) {
                scale = options.maxScale;
            } else if ( scale < options.minScale ) {
                scale = options.minScale;
            }

            // Set the scale
            matrix[0] = matrix[3] = scale;
            this.setMatrix( matrix, {
                animate: typeof opts.animate === 'boolean' ? opts.animate : animate
            });

            // Trigger zoom event
            if ( !opts.silent ) {
                this._trigger( 'zoom', scale, opts );
            }
        },

        /**
         * Pan the element to the specified translation X and Y
         * Note: this is not the same as setting jQuery#offset() or jQuery#position()
         * @param {Number} x
         * @param {Number} y
         * @param {Object} [options] These options are passed along to setMatrix
         * @param {Array} [options.matrix] The matrix being manipulated (if already known so it doesn't have to be retrieved again)
         * @param {Boolean} [options.silent] Silence the pan event. Note that this will also silence the setMatrix change event.
         * @param {Boolean} [options.relative] Make the x and y values relative to the existing matrix
         * @author timmy willison
         */
        pan: function( x, y, options ) {
            if ( !options ) { options = {}; }
            var matrix = options.matrix;
            if ( !matrix ) {
                matrix = this.getMatrix();
            }
            // Cast existing matrix values to numbers
            if ( options.relative ) {
                matrix[4] = +matrix[4] + x;
                matrix[5] = +matrix[5] + y;
            } else {
                matrix[4] = x;
                matrix[5] = y;
            }
            this.setMatrix( matrix, options );
            if ( !options.silent ) {
                this._trigger( 'pan', x, y );
            }
        },
        /**
         * Return the element to it's original transform matrix
         * @param {Boolean} [animate] Whether to animate the reset (default: true)
         * @author timmy willison
         */
        reset: function( animate ) {
            // Reset the transform to its original value
            var matrix = this.setMatrix( this._origTransform, {
                animate: typeof animate !== 'boolean' || animate
            });
            this._trigger( 'reset', matrix );
        },
        /**
         * Only resets zoom level
         * @param {Boolean} [animate] Whether to animate the reset (default: true)
         * @author timmy willison
         */
        resetZoom: function( animate ) {
            this._resetParts( [ 0, 3 ], animate );
        },

        /**
         * Only reset panning
         * @param {Boolean} [animate] Whether to animate the reset (default: true)
         * @author timmy willison
         */
        resetPan: function( animate ) {
            this._resetParts( [ 4, 5 ], animate );
        },


        /**
         * Retrieving the transform is different for SVG (unless a style transform is already present)
         * @returns {String} Returns the current transform value of the element
         * @author timmy willison
         */
        getTransform: function() {
            var elem = this.elem;
            // Use style rather than computed
            // If currently transitioning, computed transform might be unchanged
            var transform = $.style( elem, 'transform' );

            // SVG falls back to the transform attribute
            if ( this.isSVG && !transform ) {
                transform = $.attr( elem, 'transform' );
            // Convert any transforms set by the user to matrix format
            // by setting to computed
            } else if ( transform !== 'none' && !rmatrix.test(transform) ) {
                transform = $.style( elem, 'transform', $.css(elem, 'transform') );
            }
            return transform || 'none';
        },
        /**
         * Retrieve the current transform matrix for $elem (or turn a transform into it's array values)
         * @param {String} [transform]
         * @returns {Array} Returns the current transform matrix split up into it's parts, or a default matrix
         * @author timmy willison
         */
        getMatrix: function( transform ) {
            var matrix = rmatrix.exec( transform || this.getTransform() );
            if ( matrix ) {
                matrix.shift();
            }
            return matrix || [ 1, 0, 0, 1, 0, 0 ];
        },
        /**
         * Checks whether the current zoom level of the element is greater than the initial zoom level
         * @returns {boolean}
         */
        isZoomedIn: function() {
            return +this.getMatrix()[0] > +this.getMatrix(this._origTransform)[0];
        },

        /**
         * toggle between initial scale and max zoom
         */
        toggleZoom: function() {
            if (this.isZoomedIn()) {
                this.resetZoom(true);
            }  else {
                this.zoom(this.options.maxScale, {'animate': true});
            }
        },

        /**
         * Given a matrix object, quickly set the current matrix of the element
         * @param {Array|String} matrix
         * @param {Object} [options]
         * @param {Boolean|String} [options.animate] Whether to animate the transform change, or 'skip' indicating that it is unnecessary to set
         * @param {Boolean} [options.contain] Override the global contain option
         * @param {Boolean} [options.silent] If true, the change event will not be triggered
         * @returns {Array} Returns the matrix that was set
         * @author timmy willison
         */
        setMatrix: function( matrix, options ) {
            if ( this.disabled ) { return; }
            if ( !options ) { options = {}; }
            // Convert to array
            if ( typeof matrix === 'string' ) {
                matrix = this.getMatrix( matrix );
            }
            var contain, isInvert, container, dims, margin;
            var scale = +matrix[0];

            // Apply containment
            if ( (contain = typeof options.contain !== 'undefined' ? options.contain : this.options.contain) ) {
                isInvert = contain === 'invert';
                container = this.container;
                dims = this.dimensions;
                margin = ((dims.width * scale) - container.width) / 2;
                matrix[4] = Math[ isInvert ? 'max' : 'min' ](
                    Math[ isInvert ? 'min' : 'max' ]( matrix[4], margin - dims.left ),
                    -margin - dims.left
                );
                margin = ((dims.height * scale) - container.height) / 2;
                matrix[5] = Math[ isInvert ? 'max' : 'min' ](
                    Math[ isInvert ? 'min' : 'max' ]( matrix[5], margin - dims.top ),
                    -margin - dims.top
                );
            }
            if ( options.animate !== 'skip' ) {
            // Set transition
                this.transition( !options.animate );
            }
            $[ this.isSVG ? 'attr' : 'style' ]( this.elem, 'transform', 'matrix(' + matrix.join(',') + ')' );
            if ( !options.silent ) {
                this._trigger( 'change', matrix );
            }
            return matrix;
        },
        /**
         * Apply the current transition to the element, if allowed
         * @param {Boolean} [off] Indicates that the transition should be turned off
         * @author timmy willison
         */
        transition: function( off ) {
            var transition = off || !this.options.transition ? 'none' : this._transition;
            $.style( this.elem, 'transition', transition );
        },
        /**
         * Builds the original transform value
         * @author timmy willison
         */
        _buildTransform: function() {
            // Save the original transform
            // Retrieving this also adds the correct prefixed style name
            // to jQuery's internal $.cssProps
            this._origTransform = this.options.startTransform || this.getTransform();
        },

        /**
         * Set transition property for later use when zooming
         * If SVG, create necessary animations elements for translations and scaling
         * @author timmy willison
         */
        _buildTransition: function() {
            var options = this.options;
            if ( this._transform ) {
                this._transition = this._transform + ' ' + options.duration + 'ms ' + options.easing;
            }
        },

        /**
         * Builds the restricing dimensions from the containment element
         * @author timmy willison
         */
        _buildContain: function() {
            // Reset container properties
            if ( this.options.contain ) {
                var $parent = this.$parent;
                this.container = {
                    width: $parent.width(),
                    height: $parent.height()
                };
                var elem = this.elem;
                var $elem = this.$elem;
                this.dimensions = this.isSVG ? {
                    left: elem.getAttribute('x') || 0,
                    top: elem.getAttribute('y') || 0,
                    width: elem.getAttribute('width') || $elem.width(),
                    height: elem.getAttribute('height') || $elem.height()
                } : {
                    left: $.css( elem, 'left', true ) || 0,
                    top: $.css( elem, 'top', true ) || 0,
                    width: $elem.width(),
                    height: $elem.height()
                };
            }
        },

        /**
         * Reset certain parts of the transform
         * @author timmy willison
         */
        _resetParts: function( indices, animate ) {
            var origMatrix = this.getMatrix( this._origTransform );
            var cur = this.getMatrix();
            var i = indices.length;
            while( i-- ) {
                cur[ indices[i] ] = origMatrix[ indices[i] ];
            }
            this.setMatrix(cur, {
                animate: typeof animate !== 'boolean' || animate
            });
        },

        /**
         * Trigger a zoomer event on our element
         * The event is passed the Zoomer instance
         * @param {String} name
         * @param {Mixed} arg1[, arg2, arg3, ...] Arguments to append to the trigger
         * @author timmy willison
         */
        _trigger: function ( name ) {
            this.$elem.triggerHandler( 'zoomer' + name, [this].concat(Array.prototype.slice.call( arguments, 1 )) );
        }
    };

    $.fn.wa72zoomer = function( options ) {
        var instance, args, m, r;
        if ( typeof options === 'string' ) {
            r = [];
            args = Array.prototype.slice.call( arguments, 1 );
            this.each(function() {
                instance = $.data(this, dataname);
                if ( !instance ) {
                    r.push( undefined );
                } else if (options.charAt(0) !== '_' // Ignore methods beginning with '_'
                    && typeof (m = instance[ options ]) === 'function'
                    && (m = m.apply( instance, args )) !== undefined) {
                    r.push( m );
                }
            });
            return r.length ? (r.length === 1 ? r[0] : r) : this;
        }
        return this.each(function() { new Zoomer( this, options ); });
    };
})(jQuery);
