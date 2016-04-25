// Copyright 2016 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;

const Card = imports.app.interfaces.card;
const Module = imports.app.interfaces.module;
const StyleClasses = imports.app.styleClasses;
const Utils = imports.app.utils;

/**
 * Class: AllTypeCard
 *
 * Card for displaying a snippet of an article in the News App
 *
 * This widget can display a snippet of an article using labels
 * for the title, the synopsis and the context which is a tag,
 * if it is available.
 *
 * Style classes:
 *   card, all-type-card - on the widget itself
 *   title - on the title label
 *   card-synopsis - on the synopsis label
 *   card-context - on the context label
 */
const AllTypeCard = new Module.Class({
    Name: 'AllTypeCard',
    GTypeName: 'EknAllTypeCard',
    CssName: 'EknAllTypeCard',
    Extends: Gtk.Button,
    Implements: [ Module.Module, Card.Card ],

    Properties: {
        'highlighted': GObject.ParamSpec.boolean('highlighted',
            'Highlighted Mode',
            'Whether this card is displayed as a highlighted card',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            false),
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/allTypeCard.ui',
    InternalChildren: ['title-label', 'synopsis-label', 'context-label'],

    _init: function (props={}) {
        this.parent(props);

        this.set_label_or_hide(this._title_label, this.model.title);
        this.set_label_or_hide(this._synopsis_label, this.model.synopsis);

        this._context = this.get_parent_set_titles()[0];
        if (this._context) {
            this.set_label_or_hide(this._context_label, this._context);
        }

        if (this.highlighted) {
            this.get_style_context().add_class(StyleClasses.HIGHLIGHTED);
        }

        Utils.set_hand_cursor_on_widget(this);

        this._idle_id = 0;
        this.connect_after('size-allocate', () => {
            if (this._idle_id) {
                return;
            }
            this._idle_id = GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE,
                this._update_labels_and_css.bind(this));
        });
    },

    _update_labels_and_css: function () {
        let card_alloc = this.get_allocation();
        let width = card_alloc.width;
        let height = card_alloc.height;

        this.update_card_sizing_classes(height, width);
        this._update_title(height, width);
        this._update_synopsis(height, width);
        this._context_label.visible = (this._context && height >= Card.MinSize.B);

        this._idle_id = 0;
        return GLib.SOURCE_REMOVE;
    },

    _update_title: function (height, width) {
        let lines = 2;
        let valign = Gtk.Align.END;

        if (width <= Card.MaxSize.B && height <= Card.MaxSize.A) {
            lines = 2;
        } else if (width <= Card.MaxSize.C && height <= Card.MaxSize.D) {
            lines = 3;
        } else if (width <= Card.MaxSize.D && height <= Card.MaxSize.C) {
            lines = 2;
        } else if (width <= Card.MaxSize.D && height <= Card.MaxSize.D) {
            lines = 3;
        }

        if (height <= Card.MaxSize.B) {
            valign = Gtk.Align.CENTER;
        }

        this._title_label.lines = lines;
        this._title_label.valign = valign;
    },

    _update_synopsis: function (height, width) {
        this._synopsis_label.visible = (height >= Card.MinSize.C);
        if (!this._synopsis_label.visible) {
            return;
        }

        let lines = 5;

        if (width <= Card.MaxSize.E && height <= Card.MaxSize.C) {
            lines = 3;
        } else if (width <= Card.MaxSize.F && height <= Card.MaxSize.D) {
            lines = 4;
        }

        this._synopsis_label.lines = lines;
    },
});
