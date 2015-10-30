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
        this.set_size_request(Card.MinSize.A, Card.MinSize.A);

        Utils.set_hand_cursor_on_widget(this);

        if (this.model instanceof SetObjectModel.SetObjectModel) {
            this._inner_content_grid.valign = Gtk.Align.CENTER;
            this._left_sleeve.visible = this._right_sleeve.visible = true;
            this._thumbnail_frame.margin = 10;
        }
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
        } else {
            let content_height = this._get_content_height(alloc.height);
            let content_alloc = new Cairo.RectangleInt({
                x: 0,
                y: alloc.height - content_height,
                width: alloc.width,
                height: content_height,
            });
            this._content_grid.size_allocate(content_alloc);
        }
        this.update_card_sizing_classes(alloc.height, alloc.width);
    },

    _get_content_height: function (height) {
        if (height <= Card.MaxSize.B) {
            return 90;
        } else if (height <= Card.MaxSize.C) {
            return 140;
        } else if (height <= Card.MaxSize.D) {
            return 190;
        } else {
            return 290;
        }
    }
});
