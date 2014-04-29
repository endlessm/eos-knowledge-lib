// Copyright 2014 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const GObject = imports.gi.GObject;
const Lang = imports.lang;
const Pango = imports.gi.Pango;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

/**
 * Class: TableOfContents
 *
 * A widget which displays a table of contents for article content. The table
 * of contents is displayed as a vertical list of clickable section titles
 * with numeric indices. Also contains an up arrow and down arrow above and
 * below the list, the exact function of which is left up to the user of this
 * class.
 *
 * To set the sections titles use the <section-list> property. Each string in
 * the section list will become a clickable label with the
 * EKN_STYLE_CLASS_TOC_ENTRY style property. One of these section entries can
 * be considered selected and will have the selected style property. This
 * entry is controlled with the <selected-section> property.
 *
 * This widget will size down vertically, but will always show at least three
 * section entries if three are present. The <selected-section> will always be
 * among the visible section entries.
 */
const TableOfContents = new Lang.Class({
    Name: 'TableOfContents',
    GTypeName: 'EknTableOfContents',
    Extends: Endless.CustomContainer,
    Properties: {
        /**
         * Property: section-list
         *
         * An array of strings defining the section titles to display in the
         * table on contents. Each section entry in the table of contents will
         * display a title as specified here along with an sequential index,
         * starting at 1.
         * > toc.section_list = ['apple', 'orange', 'banana'];
         */
        'section-list': GObject.ParamSpec.object('section-list', 'Section List',
            'TODO',
            GObject.ParamFlags.READWRITE, GObject.Object),
        /**
         * Property: selected-section
         *
         * The zero based index of the section which should be currently
         * considered selected. This selected widget will always be visible in
         * the table of contents if not all sections can be displayed, and
         * will have the selected style class on it.
         *
         * A selected-section of -1 indicates that no section is selected. The
         * selected-section must always be less than the <section-list> length.
         */
        'selected-section': GObject.ParamSpec.int('selected-section', 'Selected Section',
            'TODO',
            GObject.ParamFlags.READWRITE,
            -1, GLib.MAXINT32, -1),
        /**
         * Property: collapsed
         *
         * True if table of contents should display in a collapsed state. In a
         * collapsed state the table of contents will show only the numbered
         * indices of section and there arrow buttons, but not the titles of
         * the sections themselves. The widget will need much less horizontal
         * space.
         *
         * Defaults to false.
         */
        'collapsed': GObject.ParamSpec.boolean('collapsed', 'Collapsed',
            'True if table of contents should display in a collapsed state.',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            false),
    },
    Signals: {
        /**
         * Event: section-clicked
         *
         * Signal generated when user clicks on a section. Passes the index of
         * the section clicked.
         * > toc.connect('section-clicked', function (widget, index) { print(index); });
         */
        'section-clicked': { param_types: [ GObject.TYPE_INT ] },
        /**
         * Event: up-clicked
         *
         * Signal generated when user clicks on the up button.
         */
        'up-clicked': {},
        /**
         * Event: down-clicked
         *
         * Signal generated when user clicks on the down button.
         */
        'down-clicked': {}
    },

    _MIN_ROWS: 3,
    _ARROW_SIZE: 32,

    _init: function (params) {
        this._selected_section = -1;
        this._section_list = [];
        this._section_buttons = [];
        this._collapsed = false;
        this.parent(params);
        this.get_style_context().add_class(EosKnowledge.STYLE_CLASS_TOC);
        this.get_style_context().add_class(Gtk.STYLE_CLASS_VIEW);

        let up_image = new Gtk.Image({
            icon_name: 'go-up',
            pixel_size: this._ARROW_SIZE
        });
        this._up_arrow = new Gtk.Button({
            image: up_image,
            halign: Gtk.Align.END
        });
        this._up_arrow.connect('clicked', Lang.bind(this, function () {
            this.emit('up-clicked');
        }));
        this._up_arrow.show_all();
        this.add(this._up_arrow);

        let down_image = new Gtk.Image({
            icon_name: 'go-down',
            pixel_size: this._ARROW_SIZE
        });
        this._down_arrow = new Gtk.Button({
            image: down_image,
            halign: Gtk.Align.END
        });
        this._down_arrow.connect('clicked', Lang.bind(this, function () {
            this.emit('down-clicked');
        }));
        this._down_arrow.show_all();
        this.add(this._down_arrow);
    },

    set section_list (v) {
        if (this._section_list === v) return;
        this._section_list = v;
        if (this._selected_section >= this._section_list.length) {
            this._selected_section = Math.min(this._selected_section, this._section_list.length - 1);
        }
        this._build_sections();
        this.notify('selected-section');
        this.notify('section-list');
    },

    get section_list () {
        if (this._section_list)
            return this._section_list;
        return [];
    },

    set selected_section (v) {
        v = Math.min(v, this._section_list.length - 1);
        v = Math.max(v, -1);
        if (this._selected_section === v) return;
        this._selected_section = v;
        this._set_selected_flags();
        this.notify('selected-section');
    },

    get selected_section () {
        if (this._selected_section)
            return this._selected_section;
        return -1;
    },

    set collapsed (v) {
        if (this._collapsed === v)
            return;
        this._collapsed = v;
        if (this._collapsed) {
            this.get_style_context().add_class(EosKnowledge.STYLE_CLASS_COLLAPSED);
        } else {
            this.get_style_context().remove_class(EosKnowledge.STYLE_CLASS_COLLAPSED);
        }
        this._collapse_sections();
        this.notify('collapsed');
    },

    get collapsed () {
        return this._collapsed;
    },

    vfunc_size_allocate: function (alloc) {
        this.parent(alloc);
        // calculate available space for section buttons
        let arrow_height = this._get_arrow_height();
        let section_height = this._get_section_height();
        let num_sections = this._section_buttons.length;
        let max_sections = Math.floor((alloc.height - 2 * arrow_height) / section_height);
        let start_index = 0;
        if (max_sections < num_sections && this._selected_section > -1) {
            start_index = this._selected_section - Math.ceil(max_sections / 2) + 1;
            start_index = Math.max(0, start_index);
            start_index = Math.min(num_sections - max_sections, start_index);
        }
        let end_index = start_index + max_sections;
        // allocate the children top to bottom
        alloc.height = arrow_height;
        this._up_arrow.size_allocate(alloc);
        alloc.y += arrow_height;
        alloc.height = section_height;
        for (let section_index = 0; section_index < num_sections; section_index++) {
            let section_button = this._section_buttons[section_index];
            if (section_index >= start_index && section_index < end_index) {
                section_button.set_child_visible(true);
                section_button.size_allocate(alloc);
                alloc.y += section_height;
            } else {
                section_button.set_child_visible(false);
            }
        }
        alloc.height = arrow_height;
        this._down_arrow.size_allocate(alloc);
    },

    vfunc_get_preferred_width: function () {
        let min = 0, nat = 0;
        for (let child of this.get_children()) {
            let [child_min, child_nat] = child.get_preferred_width();
            min = Math.max(min, child_min);
            nat = Math.max(nat, child_nat);
        }
        return [min, nat];
    },

    vfunc_get_preferred_height: function () {
        let arrow_height = this._get_arrow_height();
        let section_height = this._get_section_height();
        let num_sections = this._section_buttons.length;
        return [2 * arrow_height + Math.min(num_sections, this._MIN_ROWS) * section_height,
                2 * arrow_height + num_sections * section_height];
    },

    _build_sections: function () {
        for (let section_button of this._section_buttons) {
            this.remove(section_button);
        }
        this._section_buttons = [];
        for (let section of this._section_list) {
            let section_button = new SectionButton(section, this._section_buttons.length);
            section_button.connect('clicked', Lang.bind(this, this._section_button_clicked));
            section_button.show_all();
            this.add(section_button);

            this._section_buttons.push(section_button);
        }
        this._set_selected_flags();
        this._collapse_sections();
    },

    _set_selected_flags: function () {
        for (let section_button of this._section_buttons) {
            if (this._selected_section === section_button.index) {
                section_button.set_state_flags(Gtk.StateFlags.SELECTED, false);
            } else {
                section_button.unset_state_flags(Gtk.StateFlags.SELECTED);
            }
        }
    },

    _collapse_sections: function () {
        for (let section_button of this._section_buttons) {
            section_button.set_collapsed(this._collapsed);
        }
    },

    _section_button_clicked: function (button) {
        this.emit('section-clicked', button.index);
    },

    _get_arrow_height: function () {
        return Math.max(this._up_arrow.get_preferred_height()[1],
                        this._down_arrow.get_preferred_height()[1]);
    },

    _get_section_height: function () {
        let section_height = 0;
        for (let section_button of this._section_buttons) {
            section_height = Math.max(section_height, section_button.get_preferred_height()[1]);
        }
        return section_height;
    }
});

const SectionButton = new Lang.Class({
    Name: 'SectionButton',
    GTypeName: 'EknSectionButton',
    Extends: Gtk.Button,

    _MIN_CHARS: 20,

    _init: function (section_title, section_index, params) {
        this.parent(params);
        this.get_style_context().add_class(EosKnowledge.STYLE_CLASS_TOC_ENTRY);
        this.index = section_index;

        this._title = new Gtk.Label({
            label: section_title,
            ellipsize: Pango.EllipsizeMode.END,
            width_chars: this._MIN_CHARS, // Demand some characters before ellipsis
            xalign: 0,
            no_show_all: true
        });
        this._title.get_style_context().add_class(EosKnowledge.STYLE_CLASS_TITLE);
        let number = new Gtk.Label({
            label: (section_index + 1).toString()
        });
        number.get_style_context().add_class(EosKnowledge.STYLE_CLASS_INDEX);

        let box = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL
        });
        box.pack_start(this._title, false, false, 0);
        box.pack_end(number, false, false, 0);
        this.add(box);
    },

    set_collapsed: function (collapsed) {
        this._title.set_visible(!collapsed);
    }
});
