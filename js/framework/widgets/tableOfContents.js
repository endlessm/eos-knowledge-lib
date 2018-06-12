// Copyright 2014 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Pango = imports.gi.Pango;

const Knowledge = imports.framework.knowledge;
const Utils = imports.framework.utils;

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
var TableOfContents = new Knowledge.Class({
    Name: 'TableOfContents',
    Extends: Endless.CustomContainer,
    Properties: {
        /**
         * Property: section_list
         *
         * An array of strings defining the section titles to display in the
         * table on contents. Each section entry in the table of contents will
         * display a title as specified here along with an sequential index,
         * starting at 1.
         *
         * Note: because gjs does not support list properties for gobjects,
         * this is not a gobject property right now. This must be set via
         * assignment and not during object construction. The notify signal
         * will not function on this property.
         *
         * > toc.section_list = ['apple', 'orange', 'banana'];
         */
        /**
         * Property: selected-section
         *
         * The zero based index of the section which should be is currently
         * selected. This selected widget will always be visible in
         * the table of contents if not all sections can be displayed, and
         * will have the selected style class on it.
         *
         * The selected-section is read-only and will animate to follow the
         * target-section property.
         *
         * Changing section-list will reset this to 0.
         */
        'selected-section': GObject.ParamSpec.int('selected-section', 'Selected Section',
            'The index of the currently selected section.',
            GObject.ParamFlags.READABLE,
            0, GLib.MAXINT32, 0),
        /**
         * Property: target-section
         *
         * The zero based index of the section that the table of contents
         * should select. selected-section will animate to this property
         * after transition-duration milliseconds have passed.
         *
         * Changing section-list will reset this to 0.
         */
        'target-section': GObject.ParamSpec.int('target-section', 'Target Section',
            'The index of the target section to select.',
            GObject.ParamFlags.READWRITE,
            0, GLib.MAXINT32, 0),
        /**
         * Property: transition-duration
         *
         * The duration of the animation of selected-section to target-section.
         */
        'transition-duration': GObject.ParamSpec.uint('transition-duration', 'Transition Duration',
            'The duration of the animation of the overlays to visible/invisible',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            0, GLib.MAXUINT32, 1000),
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
    _ARROW_SIZE: 18,
    // TODO: replace with our actual svgs for the up and down icon when we get
    // those from design
    _UP_ARROW_ICON: 'go-up-symbolic',
    _DOWN_ARROW_ICON: 'go-down-symbolic',


    _init: function (params) {
        this._selected_section = 0;
        this._target_section = 0;
        this._transition_duration = 0;
        this._timer_id = 0;
        this._section_list = [];
        this._section_buttons = [];
        this._collapsed = false;

        this._up_arrow = this._create_arrow_button_from_icon(this._UP_ARROW_ICON);
        this._up_arrow.connect('clicked', Lang.bind(this, function () {
            this.emit('up-clicked');
        }));
        Utils.set_hand_cursor_on_widget(this._up_arrow);
        this._up_arrow_align = new Gtk.Alignment();
        this._up_arrow_align.add(this._up_arrow);
        this._up_arrow_align.show_all();

        this._down_arrow = this._create_arrow_button_from_icon(this._DOWN_ARROW_ICON);
        this._down_arrow.connect('clicked', Lang.bind(this, function () {
            this.emit('down-clicked');
        }));
        Utils.set_hand_cursor_on_widget(this._down_arrow);
        this._down_arrow_align = new Gtk.Alignment();
        this._down_arrow_align.add(this._down_arrow);
        this._down_arrow_align.show_all();

        // We need the index labels and up and down arrows to be centered in a
        // column on the right. This gets tricky as they can't all be in the
        // same container, the index label needs to be in the section button
        // to have the section button background and mouse events. So this
        // size group is applied to the up and down buttons and index labels
        // to make sure they have the same size.
        this._right_column_size_group = new Gtk.SizeGroup({
            mode: Gtk.SizeGroupMode.HORIZONTAL
        });
        this._right_column_size_group.add_widget(this._up_arrow_align);
        this._right_column_size_group.add_widget(this._down_arrow_align);
        this.parent(params);

        this.add(this._up_arrow_align);
        this.add(this._down_arrow_align);
    },

    set section_list (v) {
        if (this._section_list === v) return;
        this._section_list = v;
        this._build_sections();
        this._set_selected_section(0);
        this.target_section = 0;
    },

    get section_list () {
        if (this._section_list)
            return this._section_list;
        return [];
    },

    set target_section (v) {
        v = Math.max(Math.min(v, this._section_list.length - 1), 0);
        if (this._target_section === v) return;
        this._target_section = v;
        this.notify('target-section');
        if (this._timer_id > 0) {
            Mainloop.source_remove(this._timer_id);
            this._timer_id = 0;
        }
        if (this._transition_duration <= 0) {
            this._set_selected_section(this._target_section);
        } else if (this._target_section !== this._selected_section) {
            let update_duration = this._transition_duration / Math.abs(this._target_section - this._selected_section);
            this._timer_id = Mainloop.timeout_add(update_duration, this._update_selected_callback.bind(this));
        }
    },

    get target_section () {
        if (typeof this._target_section !== 'undefined')
            return this._target_section;
        return 0;
    },

    set transition_duration (v) {
        if (this._transition_duration === v)
            return;
        this._transition_duration = v;
        this.notify('transition-duration');
    },

    get transition_duration () {
        return this._transition_duration;
    },

    get selected_section () {
        if (typeof this._selected_section !== 'undefined')
            return this._selected_section;
        return 0;
    },

    set collapsed (v) {
        if (this._collapsed === v)
            return;
        this._collapsed = v;
        let klass = Utils.get_modifier_style_class(TableOfContents, 'collapsed');
        if (this._collapsed) {
            this.get_style_context().add_class(klass);
        } else {
            this.get_style_context().remove_class(klass);
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
        this._alloc_end(this._up_arrow_align, alloc);
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
        this._alloc_end(this._down_arrow_align, alloc);
    },

    // Helper for size allocate, allocs the widget at the end horizontally of
    // the passed in allocation.
    _alloc_end: function (widget, alloc) {
        let initial_width = alloc.width;
        let initial_x = alloc.x;
        let widget_width = widget.get_preferred_width()[1];
        alloc.x += initial_width - widget_width;
        alloc.width = widget_width;
        widget.size_allocate(alloc);
        alloc.x = initial_x;
        alloc.width = initial_width;
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

    _create_arrow_button_from_icon: function (icon_name) {
        let image = new Gtk.Image({
            icon_name: icon_name,
            pixel_size: this._ARROW_SIZE
        });
        let arrow = new Gtk.Button({
            image: image,
            halign: Gtk.Align.CENTER
        });
        let klass = Utils.get_element_style_class(TableOfContents, 'arrow');
        arrow.get_style_context().add_class(klass);
        return arrow;
    },

    _build_sections: function () {
        for (let section_button of this._section_buttons) {
            this._right_column_size_group.remove_widget(section_button.index_label);
            this.remove(section_button);
        }
        this._section_buttons = [];
        for (let section of this._section_list) {
            let section_button = new SectionButton(section, this._section_buttons.length, {
                can_focus: false,
            });
            section_button.connect('clicked', Lang.bind(this, this._section_button_clicked));
            Utils.set_hand_cursor_on_widget(section_button);
            section_button.show_all();
            this._right_column_size_group.add_widget(section_button.index_label);
            this.add(section_button);

            this._section_buttons.push(section_button);
        }
        this._collapse_sections();
    },

    _update_selected_callback: function () {
        if (this._selected_section === this._target_section) {
            this._timer_id = 0;
            // finish callback
            return false;
        } else if (this._selected_section < this._target_section) {
            this._set_selected_section(this._selected_section + 1);
        } else {
            this._set_selected_section(this._selected_section - 1);
        }
        // repeat callback
        return true;
    },

    _set_selected_section: function (index) {
        this._selected_section = index;
        for (let section_button of this._section_buttons) {
            if (this._selected_section === section_button.index) {
                section_button.set_state_flags(Gtk.StateFlags.SELECTED, false);
            } else {
                section_button.unset_state_flags(Gtk.StateFlags.SELECTED);
            }
        }
        // Update the arrow sensitivity. If we are at the top of the list the
        // up arrow should be insensitive. If we are at the bottom of the list
        // the down arrow should be. Both should be insensitive if nothing is selected
        this._up_arrow.set_sensitive(this._selected_section > 0);
        this._down_arrow.set_sensitive(this._selected_section < this._section_list.length - 1);
        this.notify('selected-section');
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

const SectionButton = new Knowledge.Class({
    Name: 'SectionButton',
    Extends: Gtk.Button,

    _MIN_CHARS: 20,

    _init: function (section_title, section_index, params) {
        this.parent(params);
        let entry_class = Utils.get_element_style_class(TableOfContents, 'entry');
        this.get_style_context().add_class(entry_class);
        this.index = section_index;

        this.title_label = new Gtk.Label({
            label: section_title,
            ellipsize: Pango.EllipsizeMode.END,
            width_chars: this._MIN_CHARS, // Demand some characters before ellipsis
            xalign: 0,
            no_show_all: true
        });

        let title_class = Utils.get_element_style_class(TableOfContents, 'entryTitle');
        this.title_label.get_style_context().add_class(title_class);
        this._title_bold = new Gtk.Label({
            label: "<b>" + GLib.markup_escape_text(section_title, -1) + "</b>",
            use_markup: true,
            ellipsize: Pango.EllipsizeMode.END,
            width_chars: this._MIN_CHARS, // Demand some characters before ellipsis
        });
        // A hacky way to keep the section buttons from growing when they
        // become bold in the hover state. Add a bold version of the label in
        // a size group. Title bold isn't added to the widget tree, so we ref
        // it by adding it to this
        let size_group = new Gtk.SizeGroup();
        size_group.add_widget(this.title_label);
        size_group.add_widget(this._title_bold);

        this.index_label = new Gtk.Label({
            label: (section_index + 1).toString()
        });
        let index_class = Utils.get_element_style_class(TableOfContents, 'entryIndex');
        this.index_label.get_style_context().add_class(index_class);

        let box = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL
        });
        box.pack_start(this.title_label, false, false, 0);
        box.pack_end(this.index_label, false, false, 0);
        this.add(box);
    },

    set_collapsed: function (collapsed) {
        this.title_label.set_visible(!collapsed);
    }
});
