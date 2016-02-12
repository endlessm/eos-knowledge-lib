// Copyright 2015 Endless Mobile, Inc.

const Gdk = imports.gi.Gdk;
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
        'highlight-string': GObject.ParamSpec.override('highlight-string', Card.Card),
        'text-halign': GObject.ParamSpec.override('text-halign', Card.Card),
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/searchResultCard.ui',
    InternalChildren: [ 'thumbnail-frame', 'content-frame', 'title-label', 'synopsis-label'],

    _init: function (props={}) {
        this.parent(props);

        this.update_highlight_string();
        this.set_thumbnail_frame_from_model(this._thumbnail_frame);
        this.set_size_request(Card.MinSize.D, Card.MinSize.A);
        this._synopsis_label.visible = true;

        Utils.set_hand_cursor_on_widget(this);
    },

    // Card override
    update_highlight_string: function () {
        if (this._title_label)
            this.set_title_label_with_highlight(this._title_label);
        if (this._synopsis_label)
            this.set_label_with_highlight(this._synopsis_label, this.model.synopsis);
    },

    _TEXT_SIZE_RATIO: 0.64,
    _IMAGE_WIDTH_RATIO: 1.5,

    vfunc_size_allocate: function (alloc) {
        let text_width = alloc.width * this._TEXT_SIZE_RATIO;
        let image_width = alloc.height * this._IMAGE_WIDTH_RATIO;
        let total_width = text_width + image_width;
        let margin = alloc.width - total_width;

        let card_alloc = new Gdk.Rectangle({
            x: alloc.x + (margin / 2),
            y: alloc.y,
            width: total_width,
            height: alloc.height,
        });

        this.parent(card_alloc);

        let image_alloc = new Gdk.Rectangle({
            x: alloc.x + (margin / 2),
            y: alloc.y,
            width: image_width,
            height: alloc.height,
        });
        this._thumbnail_frame.size_allocate(image_alloc);

        let text_alloc = new Gdk.Rectangle({
            x: alloc.x + (margin / 2) + image_width,
            y: alloc.y,
            width: text_width,
            height: alloc.height,
        });
        this._content_frame.size_allocate(text_alloc);

        this.update_card_sizing_classes(total_width, alloc.width);
    },

    vfunc_draw: function (cr) {
        this.parent(cr);
        Utils.render_border_with_arrow(this, cr);
        cr.$dispose();  // workaround bug for not freeing cairo context
        return Gdk.EVENT_PROPAGATE;
    },
});
