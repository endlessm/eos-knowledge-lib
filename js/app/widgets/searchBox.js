const {Gdk, GObject, Gtk, Pango} = imports.gi;

const BOX_WIDTH_CHARS = 25;
const CELL_PADDING_X = 8;
const CELL_PADDING_Y = 6;

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
        super._init(props);

        this.primary_icon_name = 'edit-find-symbolic';

        this._auto_complete = new Gtk.EntryCompletion();

        this._list_store = new Gtk.ListStore();
        this._list_store.set_column_types([GObject.TYPE_STRING]);

        this._auto_complete.set_model(this._list_store);
        this._auto_complete.set_text_column(0);

        let cells = this._auto_complete.get_cells();
        cells[0].xpad = CELL_PADDING_X;
        cells[0].ypad = CELL_PADDING_Y;
        cells[0].ellipsize = Pango.EllipsizeMode.END;

        this._auto_complete.set_match_func(() => true);
        this.completion = this._auto_complete;

        this.connect('icon-press', () => this.emit('activate'));
        this.completion.connect('match-selected',
            this._on_match_selected.bind(this));
        this.connect('changed', () => {
            if (!this._entry_changed_by_widget) {
                // If there is entry text, need to add the 'go' icon
                this.secondary_icon_name = (this.text.length > 0)? 'go-next-symbolic' : null;
                this.emit('text-changed', this.text);
            }
            this._entry_changed_by_widget = false;
        });
        this.connect('enter-notify-event', this._on_motion.bind(this));
        this.connect('motion-notify-event', this._on_motion.bind(this));
        this.connect('leave-notify-event', this._on_leave.bind(this));
    }

    _on_motion(widget, event) {
        // Workaround for https://gitlab.gnome.org/GNOME/gtk/issues/196
        this.get_style_context().add_class('fake-hover');

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

    _on_match_selected(widget, model, iter) {
        let index = model.get_path(iter).get_indices()[0];
        this.emit('menu-item-selected', this._items[index]['id']);
        return Gdk.EVENT_STOP;
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
        this._items = items;
        let model = this._auto_complete.get_model();
        model.clear();
        for (let i = 0; i < this._items.length; i++) {
            model.set(model.append(), [0], [this._items[i]['title']]);
        }
        this._entry_changed_by_widget = true;
        this.emit('changed');
    }
});
