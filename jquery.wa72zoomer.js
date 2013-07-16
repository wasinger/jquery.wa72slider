(function ($) {
    var dataname = 'wa72zoomer';

    function Zoomer(e, o) {
        var instance = $.data(e, dataname);
        if (instance && instance instanceof Zoomer) {
            return instance;
        }
        if (!(this instanceof Zoomer)) {
            return new Zoomer(e, o);
        }
        this.elem = e;
        this.options = $.extend( {}, Zoomer.settings, o );
        $.data(e, dataname, this);
        return this;
    }

    Zoomer.settings = {};

    Zoomer.prototype = {
        zoom: function(s, o) {
            // TODO: to be implemented
        },
        pan: function(x, y, o) {
            // TODO: to be implemented
        },
        reset: function() {
            // TODO: to be implemented
        }
    };

    $.fn.wa72zoomer = function( options ) {
        var instance, args, m, ret;
        if ( typeof options === 'string' ) {
            ret = [];
            args = Array.prototype.slice.call( arguments, 1 );
            this.each(function() {
                instance = $.data(this, dataname);
                if ( !instance ) {
                    ret.push( undefined );
                // Ignore methods beginning with '_'
                } else if (options.charAt(0) !== '_' &&
                    typeof (m = instance[ options ]) === 'function' &&
                    (m = m.apply( instance, args )) !== undefined) {
                    ret.push( m );
                }
            });
            return ret.length ?
                (ret.length === 1 ? ret[0] : ret) :
                this;
        }
        return this.each(function() { new Zoomer( this, options ); });
    };
})(jQuery);
