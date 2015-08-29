const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

const InfiniteScrolledWindow = new Lang.Class({
    Name: 'InfiniteScrolledWindow',
    GTypeName: 'EknInfiniteScrolledWindow',
    Extends: Gtk.ScrolledWindow,
    Properties: {
        /**
         * Property: bottom-buffer
         *
         * A integer value for the number of pixels of buffer the InfiniteScrolledWindow will still
         * consider the bottom of the the scroll window. i.e. If button-buffer is 30 this widget will
         * emit need-more-content when the user scrolls to 30 pixels before the
         * bottom.
         */
        'bottom-buffer': GObject.ParamSpec.int('bottom-buffer', 'Bottom Buffer',
            'The pixel size of the bottom buffer',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            0, GLib.MAXINT32, 0),
    },
    Signals: {
        /**
         * Event: need-more-content
         * This scrolled window needs more content to fill it up
         *
         * This is emitted either when there is not enough content to even
         * warrant a scroll bar, or if the user has scrolled to the bottom of
         * the available scroll window.
         */
        'need-more-content': {},
    },

    _MINIMAL_WIDTH: 200,

    _init: function(props) {
        this.parent(props);

        this.vadjustment.connect('value-changed', this._check_scroll.bind(this));
        this.vadjustment.connect('notify::page-size', this._check_scroll.bind(this));
        this.vadjustment.connect('notify::upper', this._check_scroll.bind(this));
        this.connect('size-allocate', this._check_scroll.bind(this));
    },

    /*
     * Checks to see if the scrolled window is scrollable - that is,
     * if it has enough content in it to warrant having a scrollbar.
     * If not, or if we are scrolled close enough to the bottom, then we need to
     * emit need-more-content.
     */
    _check_scroll: function () {
        let adjustment = this.vadjustment;
        let value = adjustment.value;
        let upper = adjustment.upper;
        let page_size = adjustment.page_size;
        if (page_size === upper || value >= (upper - page_size - this.bottom_buffer))
            this.emit('need-more-content');
    },

    vfunc_get_preferred_width: function () {
        if (this.preferred_width > -1)
            return [this._MINIMAL_WIDTH, this.preferred_width];
        return this.parent();
    },
});
