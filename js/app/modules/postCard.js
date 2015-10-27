// Copyright 2015 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Cairo = imports.gi.cairo;
const Card = imports.app.interfaces.card;
const MarginButton = imports.app.widgets.marginButton;
const Module = imports.app.interfaces.module;
const SetObjectModel = imports.search.setObjectModel;
const Utils = imports.app.utils;

/**
 * Class: PostCard
 * A postcard for the new reader app.
 */
const PostCard = new Lang.Class({
    Name: 'PostCard',
    GTypeName: 'EknPostCard',
    Extends: MarginButton.MarginButton,
    Implements: [ Module.Module, Card.Card ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'model': GObject.ParamSpec.override('model', Card.Card),
        'page-number': GObject.ParamSpec.override('page-number', Card.Card),
        'title-capitalization': GObject.ParamSpec.override('title-capitalization',
            Card.Card),
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/postCard.ui',
    InternalChildren: [ 'thumbnail-frame', 'title-label', 'content-grid', 'inner-content-grid', 'shadow-frame', 'left-sleeve', 'right-sleeve' ],

    _init: function (props={}) {
        this.parent(props);

        this.set_title_label_from_model(this._title_label);
        this.set_thumbnail_frame_from_model(this._thumbnail_frame);
        this.add_contextual_css_class();

        Utils.set_hand_cursor_on_widget(this);

        if (this.model instanceof SetObjectModel.SetObjectModel) {
            this._content_grid.valign = Gtk.Align.FILL;
            this._shadow_frame.vexpand = true;
            this._inner_content_grid.valign = Gtk.Align.CENTER;
            this._left_sleeve.visible = this._right_sleeve.visible = true;
            this._thumbnail_frame.margin = 10;
        }
    },

    vfunc_get_preferred_width: function () {
        let [min, nat] = this.parent();
        return [Card.MinSize.A, Math.max(Card.MinSize.A, nat)];
    },

    vfunc_get_request_mode: function () {
        return Gtk.SizeRequestMode.CONSTANT_SIZE;
    },

    vfunc_get_preferred_height: function () {
        let [min, nat] = this.parent();
        return [Card.MinSize.A, Math.max(Card.MinSize.A, nat)];
    },

    vfunc_size_allocate: function (alloc) {
        this.parent(alloc);
        if (this.model instanceof SetObjectModel.SetObjectModel) {
            let sleeve_height = alloc.height > Card.MaxSize.B ? 120 : 80;
            let sleeve_alloc = new Cairo.RectangleInt({
                x: 0,
                y: (alloc.height / 2) - (sleeve_height / 2),
                width: alloc.width,
                height: sleeve_height,
            });
            this._content_grid.size_allocate(sleeve_alloc);

            // Ensure that margin grows with card size so that we
            // always see the deck svg in the background
            this._thumbnail_frame.margin = alloc.width / 20;
        }
    },
});
