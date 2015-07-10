// Copyright 2014 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Card = imports.app.interfaces.card;
const MarginButton = imports.app.marginButton;
const Module = imports.app.interfaces.module;
const Utils = imports.app.utils;

/**
 * Class: CardA
 *
 * A card implementation with sizing and styling specific to template A
 */
const CardA = new Lang.Class({
    Name: 'CardA',
    GTypeName: 'EknCardA',
    Extends: MarginButton.MarginButton,
    Implements: [ Module.Module, Card.Card ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'model': GObject.ParamSpec.override('model', Card.Card),
        'page-number': GObject.ParamSpec.override('page-number', Card.Card),
        'title-capitalization': GObject.ParamSpec.override('title-capitalization',
            Card.Card),
    },

    Template: 'resource:///com/endlessm/knowledge/widgets/cardA.ui',
    Children: [ 'thumbnail-frame', 'title-label', 'synopsis-label', 'pdf-icon', 'pdf-label' ],

    _init: function (props={}) {
        // TODO: we do want all cards to be the same size, but we may want to
        // make this size scale with resolution down the road
        props.width_request = 197;  // 183px width + 2 * 7px margin
        props.height_request = 223;  // 209px height + 2 * 7px margin
        this.parent(props);
        this.populate_from_model();

        if (!this.thumbnail_frame.visible) {
            this.title_label.xalign = 0;
            this.title_label.vexpand = false;

            let is_pdf = (this.model.content_type === 'application/pdf');
            this.pdf_icon.visible = is_pdf;
            this.pdf_label.visible = is_pdf;
            this.synopsis_label.visible = this.synopsis_label.visible && !is_pdf;
        }

        Utils.set_hand_cursor_on_widget(this);
    },
});
