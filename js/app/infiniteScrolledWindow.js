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
         * Property: preferred-width
         * Preferred natural width for widget
         *
         * Set to -1 to use normal size allocation behaviour.
         */
        'preferred-width': GObject.ParamSpec.int('preferred-width',
            'Preferred width', 'Preferred natural width for widget',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            -1, GLib.MAXINT32, -1),
        /**
         * Property: need-more-content
         * A property specifying if this scrolled window page needs more content to fill it up.
         * This is true either if there is not enough content to even warrant a scroll bar, or
         * if the user has scrolled to the bottom of the available scroll window. It should be
         * set to false whenever the content of the scroll window changes. This will ensure that
         * when size allocate is subsequently called, it realizes that it still needs more content
         * it will change this property from false to true, thus triggering a 'notify' event, which
         * is what we want.
         */
        'need-more-content': GObject.ParamSpec.boolean('need-more-content', 'Need More Content',
            'Whether the scroll window needs more content either because it hit the bottom of the scroll or there is not scrollbar',
            GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE, false),
        /**
         * Property: bottom-buffer
         *
         * A integer value for the number of pixels of buffer the InfiniteScrolledWindow will still
         * consider the bottom of the the scroll window. i.e. If button-buffer is 30 this widget will
         * set need more content to true when the user scrolls to 30 pixels before the bottom.
         */
        'bottom-buffer': GObject.ParamSpec.int('bottom-buffer', 'Bottom Buffer',
            'The pixel size of the bottom buffer',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, 0, GLib.MAXINT32, 0),
    },

    _MINIMAL_WIDTH: 200,

    _init: function(props) {
        this._need_more_content = false;
        this._buttom_buffer = 0;
        this.parent(props);

        this.vadjustment.connect('value-changed', this._on_scroll_value_changed.bind(this));
        this.vadjustment.connect('notify::page-size', this._on_scroll_value_changed.bind(this));
        this.vadjustment.connect('notify::upper', this._on_scroll_value_changed.bind(this));
        this.connect('size-allocate', this._check_scroll.bind(this));
    },

    _on_scroll_value_changed: function () {
        let adjustment = this.vadjustment;
        let value = adjustment.value;
        let upper = adjustment.upper;
        let page_size = adjustment.page_size;
        if (value >= (upper - page_size - this._bottom_buffer)) {
            this.need_more_content = true;
        } else {
            this.need_more_content = false;
        }
    },

    get need_more_content () {
        return this._need_more_content;
    },

    set need_more_content (v) {
        if (this._need_more_content === v)
            return;
        this._need_more_content = v;
        this.notify('need-more-content');
    },

    get bottom_buffer () {
        return this._bottom_buffer;
    },

    set bottom_buffer (v) {
        if (this._bottom_buffer === v)
            return;
        this._bottom_buffer = v;
        this.notify('bottom-buffer');
    },

    /*
     * Checks to see if the scrolled window is scrollable - that is,
     * if it has enough content in it to warrant having a scrollbar.
     * If not, then we need to set the need_more_content property to
     * be true.
     */
    _check_scroll: function () {
        let adjustment = this.vadjustment;
        let upper = adjustment.upper;
        let page_size = adjustment.page_size;

        if (page_size === upper) {
            this.need_more_content = true;
        } else {
            this.need_more_content = false;
        }
    },

    vfunc_get_preferred_width: function () {
        if (this.preferred_width > -1)
            return [this._MINIMAL_WIDTH, this.preferred_width];
        return this.parent();
    },
});
