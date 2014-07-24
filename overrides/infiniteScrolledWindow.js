const Gtk = imports.gi.Gtk;
const GObject = imports.gi.GObject;
const Lang = imports.lang;


const InfiniteScrolledWindow = new Lang.Class({
    Name: 'Card',
    GTypeName: 'EknInfiniteScrolledWindow',
    Extends: Gtk.ScrolledWindow,
    Properties: {
        /**
         * Property: need-more-content
         * A .
         */
        'need-more-content': GObject.ParamSpec.boolean('need-more-content', 'Need More Content',
            'Whether the scroll window needs more content either because it hit the bottom of the scroll or there is not scrollbar',
            GObject.ParamFlags.READABLE, false)

    },

    _init: function(props) {
        this._need_more_content = false;
        this.parent(props);

        this._allocate_signal_id = 0;
        this.vadjustment.connect('value-changed', this._on_scroll_value_changed.bind(this));
        this._allocate_signal_id = this.connect('size-allocate', this._check_scroll.bind(this));
    },

    _on_scroll_value_changed: function () {
        let adjustment = this.vadjustment;
        let value = adjustment.value;
        let upper = adjustment.upper;
        let page_size = adjustment.page_size;
        if (!(value < (upper - page_size))){
            this.set_need_more_content(true);
        } else {
            this.set_need_more_content(false);
        }
    },

    get need_more_content () {
        return this._need_more_content;
    },

    set_need_more_content: function (v) {
        if (this._need_more_content === v) return;
        this._need_more_content = v;
        this.notify('need-more-content');
    },

    _check_scroll: function () {
        let adjustment = this.vadjustment;
        let upper = adjustment.upper;
        let page_size = adjustment.page_size;

        if (page_size === upper) {
            this.set_need_more_content(true);
        } else {
            this.set_need_more_content(false);
        }

    }
});