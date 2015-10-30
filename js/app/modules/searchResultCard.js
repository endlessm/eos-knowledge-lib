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
        'page-number': GObject.ParamSpec.override('page-number', Card.Card),
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
        // this.set_size_request(Card.MinSize.E, Card.MinSize.A);

        Utils.set_hand_cursor_on_widget(this);
    },

    vfunc_size_allocate: function (alloc) {
        this.parent(alloc);

        let text_width = this._get_text_width(alloc.width);
        print("card width " + alloc.width )
        print("text width " + text_width )
        let image_width = text_width / 5;
        print("image width " + image_width )
        let image_alloc = new Cairo.RectangleInt({
            x: alloc.x,
            y: alloc.y,
            width: image_width,
            height: image_width,
        });
        this._thumbnail_frame.size_allocate(image_alloc);
        let text_alloc = new Cairo.RectangleInt({
            x: alloc.x + image_width,
            y: alloc.y,
            width: text_width,
            height: image_width,
        });
        this._content_frame.size_allocate(text_alloc);
        this.update_card_sizing_classes(alloc.height, alloc.width);
    },

    _get_text_width: function (width) {
        if (width <= Card.MaxSize.E) {
            return 490;
        } else if (width <= Card.MaxSize.F) {
            return 680;
        } else {
            return 780; // I made this number up
        }
    }
});
