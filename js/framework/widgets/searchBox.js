/* exported SearchBox, MAX_RESULTS */

const {Endless, Gdk, GObject, Gtk, Pango} = imports.gi;
const Gettext = imports.gettext;

const Config = imports.framework.config;
const Utils = imports.framework.utils;

const _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

const BOX_WIDTH_CHARS = 25;

/**
 * MAX_RESULTS:
 * Number of results that the autocomplete popover can display at most.
 * This is for the benefit of users of this code, so they can limit the results
 * that they request.
 */
var MAX_RESULTS = 4;

const _AutocompleteItem = GObject.registerClass({
    CssName: 'cell',
}, class _AutocompleteItem extends Gtk.EventBox {
    _init(props={}, title='', id) {
        props.visible = true;
        this._grid = new Gtk.Grid({visible: true});
        this._label = new Gtk.Label({
            ellipsize: Pango.EllipsizeMode.END,
            hexpand: true,
            halign: Gtk.Align.START,
            visible: true,
            xalign: 0,
        });
        super._init(props);

        this.title = title;
        this.id = id;

        const icon = new Gtk.Image({
            halign: Gtk.Align.END,
            icon_name: 'go-next-symbolic',
            icon_size: Gtk.IconSize.BUTTON,
            visible: true,
        });
        this._grid.attach(this._label, 0, 0, 1, 1);
        this._grid.attach(icon, 1, 0, 1, 1);
        this.add(this._grid);
        Utils.set_hand_cursor_on_widget(this);
    }

    get title() { return this._label.label; }
    set title(value) { this._label.label = value; }
});

const _AutocompleteListbox = GObject.registerClass(class _AutocompleteListbox extends Gtk.ListBox {
    _init(search_box, props={}) {
        Object.assign(props, {
            selection_mode: Gtk.SelectionMode.NONE,
            visible: true,
        });
        super._init(props);

        this._search_box = search_box;
        this._show_see_more = false;

        this.set_filter_func(this._list_filter.bind(this));

        this._items = Array(MAX_RESULTS).fill().map(() => new _AutocompleteItem());
        this.see_more = new _AutocompleteItem({}, _("See more results"));
        this._items.forEach(item => this.add(item));
        this.add(this.see_more);
    }

    _list_filter(row) {
        const item = row.get_child();
        if (item.title === '')
            return false;
        if (item === this.see_more)
            return this._show_see_more;
        return true;
    }

    set_menu_items(items) {
        this._show_see_more = (items.length > MAX_RESULTS);

        items.slice(0, MAX_RESULTS).forEach(({title, id}, ix) => {
            this._items[ix].title = title.trim();
            this._items[ix].id = id;
        });
        for (let ix = items.length; ix < MAX_RESULTS; ix++)
            this._items[ix].title = this._items[ix].id = '';
        this.invalidate_filter();
    }

    // List box should be exactly as wide as the search box
    vfunc_get_preferred_width() {
        return this._search_box.get_preferred_width();
    }

    vfunc_get_preferred_width_for_height(height) {
        void height;
        return this._search_box.get_preferred_width();
    }
});

/**
 * Class: SearchBox
 *
 * This is a search box with autocompletion functionality.
 * The primary icon is a magnifying glass and the cursor turns into a hand when
 * hovering over the icon.
 *
 * NOTE: Due to a limitation in GTK, the cursor change will not work if the
 * search box's alignment is set to Gtk.Align.FILL in either direction.
 *
 */
var SearchBox = GObject.registerClass({
    GTypeName: 'EknSearchBox',
    Signals: {
        /**
         * Event: menu-item-selected
         *
         * This event is triggered when an item is selected from the autocomplete menu.
         */
        'menu-item-selected': {
            param_types: [GObject.TYPE_STRING]
        },
        /**
         * Signal: more-activated
         * Emitted when the "See more results" item is activated.
         */
        'more-activated': {},
        /**
         * Event: text-changed
         *
         * This event is triggered when the text in the search entry is changed by the user.
         */
        'text-changed': {
            param_types: [GObject.TYPE_STRING]
        }
    },
}, class SearchBox extends Gtk.Entry {
    _init(props={}) {
        if (['width_chars', 'width-chars', 'widthChars'].every(name =>
            typeof props[name] === 'undefined')) {
            props.width_chars = BOX_WIDTH_CHARS;
        }
        props.primary_icon_name = 'edit-find-symbolic';
        super._init(props);

        this._popover = new Gtk.Popover({
            constrain_to: Gtk.PopoverConstraint.NONE,
            modal: false,
            position: Gtk.PositionType.BOTTOM,
            relative_to: this,
        });

        this._popover.get_style_context().add_class('autocomplete');
        this._check_if_in_titlebar();

        this._listbox = new _AutocompleteListbox(this);
        this._popover.add(this._listbox);

        this.connect('icon-press', () => this.emit('activate'));
        this.connect('changed', () => {
            if (!this._entry_changed_by_widget) {
                // If there is entry text, need to add the 'go' icon and allow
                // the icons to prelight
                if (this.text) {
                    this.secondary_icon_name = 'go-next-symbolic';
                    this.get_style_context().add_class('text-entered');
                } else {
                    this.secondary_icon_name = null;
                    this.get_style_context().remove_class('text-entered');
                }
                this.emit('text-changed', this.text);
            }
            this._entry_changed_by_widget = false;
        });
        this.connect('enter-notify-event', this._on_motion.bind(this));
        this.connect('motion-notify-event', this._on_motion.bind(this));
        this.connect('leave-notify-event', this._on_leave.bind(this));
        this.connect('style-updated', this._check_if_in_titlebar.bind(this));
        this.connect('focus-out-event', () => this._popover.hide());

        this._listbox.connect('row-activated', (box, row) => {
            this._popover.hide();
            const item = row.get_child();
            if (item === box.see_more)
                this.emit('more-activated');
            else
                this.emit('menu-item-selected', item.id);
        });
    }

    _check_if_in_titlebar() {
        if (this.get_style_context().has_class('in-titlebar'))
            this._popover.get_style_context().add_class('in-titlebar');
        else
            this._popover.get_style_context().remove_class('in-titlebar');
    }

    _on_motion(widget, event) {
        // Workaround for https://gitlab.gnome.org/GNOME/gtk/issues/196
        this.get_style_context().add_class('fake-hover');

        // Don't change the mouse cursor if clicking on the icon will not do
        // anything because there's no text entered
        if (!this.text)
            return Gdk.EVENT_PROPAGATE;

        const [has_coords, x, y] = event.get_root_coords();
        if (!has_coords)
            return Gdk.EVENT_PROPAGATE;

        let top = this.get_toplevel();
        if (!top.is_toplevel())
            return Gdk.EVENT_PROPAGATE;
        const [realized, entry_x, entry_y] = top.translate_coordinates(this, x, y);
        if (!realized)
            return Gdk.EVENT_PROPAGATE;

        const on_icon = this.get_icon_at_pos(entry_x, entry_y);
        const has_secondary = this.secondary_icon_name !== null;

        if (on_icon === 0 || (has_secondary && on_icon === 1)) {
            if (this._has_hand_cursor)
                return Gdk.EVENT_PROPAGATE;
            let cursor = Gdk.Cursor.new_from_name(this.get_display(), 'pointer');
            this.window.set_cursor(cursor);
            this._has_hand_cursor = true;
        } else {
            this._remove_hand_cursor();
        }
        return Gdk.EVENT_PROPAGATE;
    }

    _remove_hand_cursor() {
        if (!this._has_hand_cursor)
            return;
        this.window.set_cursor(null);
        this._has_hand_cursor = false;
    }

    _on_leave(widget) {
        // Workaround for https://gitlab.gnome.org/GNOME/gtk/issues/196
        this.get_style_context().remove_class('fake-hover');
        this._remove_hand_cursor();
        return Gdk.EVENT_PROPAGATE;
    }

    /* Set the entry text without triggering the text-changed signal.
    */
    set_text_programmatically(text) {
        if (this.text === text)
            return;
        this._entry_changed_by_widget = true;
        this.text = text;
        this.set_position(-1);
    }

    /* Set the menu items by providing an array of item objects:
        [
            {
                'title': 'Frango',
                'id': 'http://www.myfrango.com'
            }
        ]

        'title' must be a string but 'id' can be any type and is used to
        identify the data that was selected.
    */
    set_menu_items(items) {
        if (items.length === 0) {
            this._popover.popdown();
            return;
        }

        this._listbox.set_menu_items(items);
        this._popover.popup();

        this._entry_changed_by_widget = true;
        this.emit('changed');
    }
});
