// Copyright 2015 Endless Mobile, Inc.

const Cairo = imports.gi.cairo;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Card = imports.app.interfaces.card;
const MarginButton = imports.app.widgets.marginButton;
const Module = imports.app.interfaces.module;
const Utils = imports.app.utils;

/**
 * Class: SearchResultCard
 *
 * A thumbnail card for the new reader app
 */
const SearchResultCard = new Lang.Class({
    Name: 'SearchResultCard',
    GTypeName: 'EknSearchResultCard',
    Extends: MarginButton.MarginButton,
    Implements: [ Module.Module, Card.Card ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'model': GObject.ParamSpec.override('model', Card.Card),
        'title-capitalization': GObject.ParamSpec.override('title-capitalization',
            Card.Card),
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/searchResultCard.ui',
    InternalChildren: [ 'thumbnail-frame', 'content-frame', 'title-label', 'synopsis-label'],

    _init: function (props={}) {
        this.parent(props);

        this.set_title_label_from_model(this._title_label);
        this.set_thumbnail_frame_from_model(this._thumbnail_frame);
        this.set_label_or_hide(this._synopsis_label, this.model.synopsis);
        this.set_size_request(Card.MinSize.E, Card.MinSize.A);

        Utils.set_hand_cursor_on_widget(this);
    },

    _TEXT_SIZE_RATIO: 0.64,

    vfunc_size_allocate: function (alloc) {
        let text_width = alloc.width * this._TEXT_SIZE_RATIO;
        let image_width = alloc.height;
        let total_width = text_width + image_width;
        let margin = alloc.width - total_width;

        let card_alloc = new Cairo.RectangleInt({
            x: alloc.x + (margin / 2),
            y: alloc.y,
            width: total_width,
            height: alloc.height,
        });

        this.parent(card_alloc);

        let image_alloc = new Cairo.RectangleInt({
            x: alloc.x + (margin / 2),
            y: alloc.y,
            width: image_width,
            height: alloc.height,
        });
        this._thumbnail_frame.size_allocate(image_alloc);

        let text_alloc = new Cairo.RectangleInt({
            x: alloc.x + (margin / 2) + image_width,
            y: alloc.y,
            width: text_width,
            height: alloc.height,
        });
        this._content_frame.size_allocate(text_alloc);

        this.update_card_sizing_classes(total_width, alloc.width);
    },
});
