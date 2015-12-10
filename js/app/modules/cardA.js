// Copyright 2014 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Card = imports.app.interfaces.card;
const MarginButton = imports.app.widgets.marginButton;
const Module = imports.app.interfaces.module;
const SetObjectModel = imports.search.setObjectModel;
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
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'model': GObject.ParamSpec.override('model', Card.Card),
        'title-capitalization': GObject.ParamSpec.override('title-capitalization',
            Card.Card),
        'highlight-string': GObject.ParamSpec.override('highlight-string', Card.Card),
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/cardA.ui',
    InternalChildren: [ 'thumbnail-frame', 'title-label', 'synopsis-label',
        'pdf-icon', 'pdf-label' ],

    _init: function (props={}) {
        // TODO: we do want all cards to be the same size, but we may want to
        // make this size scale with resolution down the road
        props.width_request = 197;  // 183px width + 2 * 7px margin
        props.height_request = 223;  // 209px height + 2 * 7px margin
        this.parent(props);

        this.set_title_label_from_model(this._title_label);

        if (this.model instanceof SetObjectModel.SetObjectModel) {
            this.set_thumbnail_frame_from_model(this._thumbnail_frame);
        }

        if (!this._thumbnail_frame.visible) {
            this._title_label.xalign = 0;
            this._title_label.vexpand = false;

            let is_pdf = (this.model.content_type === 'application/pdf');
            this._pdf_icon.visible = is_pdf;
            this._pdf_label.visible = is_pdf;

            this.set_label_or_hide(this._synopsis_label, this.model.synopsis);
            this._synopsis_label.visible = false;//this._synopsis_label.visible && !is_pdf;
        }

        Utils.set_hand_cursor_on_widget(this);
    },

    // For entirely fixed-size cards

    vfunc_get_preferred_width: function () {
        let [min] = this.parent();
        return [min, min];
    },

    vfunc_get_preferred_height: function () {
        let [min] = this.parent();
        return [min, min];
    },
});
