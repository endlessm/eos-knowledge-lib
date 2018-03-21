const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Knowledge = imports.app.knowledge;

/**
 * Class: InfiniteScrolledWindow
 */
var InfiniteScrolledWindow = new Knowledge.Class({
    Name: 'InfiniteScrolledWindow',
    Extends: Gtk.ScrolledWindow,
    Properties: {
        /**
         * Property: bottom-buffer
         *
         * A integer value for the number of pixels of buffer the InfiniteScrolledWindow will still
         * consider the bottom of the scroll window. i.e. If button-buffer is 30 this widget will
         * emit need-more-content when the user scrolls to 30 pixels before the
         * bottom.
         */
        'bottom-buffer': GObject.ParamSpec.int('bottom-buffer', 'Bottom Buffer',
            'The pixel size of the bottom buffer',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            0, GLib.MAXINT32, 250),
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

    _init: function(props) {
        this.parent(props);

        // This internal property is used to moderate the emission of the
        // 'need-more-content' signal. It ensures that only one signal gets
        // emitted before content is added. This prevents multiple notifiers
        // all requesting new content at the same time and causing the scroll
        // window to take on too much content.
        // If this property is true, it means we have already requested more
        // content, so we should wait patiently until that content has arrived
        // before requesting more.
        // It is important to note that this property starts out with the value
        // 'true'. That is, the onus is on the parent module to kick off the
        // dance by adding a first set of content, after which the infinite
        // scroll view will request more as needed.
        this._requested_content = true;
        this.vadjustment.connect('value-changed', this._check_scroll.bind(this));
        this.vadjustment.connect('notify::page-size', this._check_scroll.bind(this));
        this.connect('size-allocate', this._check_scroll.bind(this));
    },

    new_content_added: function () {
        this._requested_content = false;
    },

    /*
     * Checks to see if the scrolled window is scrollable - that is,
     * if it has enough content in it to warrant having a scrollbar.
     * If not, or if we are scrolled close enough to the bottom, then we need to
     * emit need-more-content.
     */
    _check_scroll: function () {
        if (this._requested_content)
            return;
        let adjustment = this.vadjustment;
        let value = adjustment.value;
        let upper = adjustment.upper;
        let page_size = adjustment.page_size;

        if (page_size === upper || value >= (upper - page_size - this.bottom_buffer)) {
            this._requested_content = true;
            this.emit('need-more-content');
        }
    },
});
