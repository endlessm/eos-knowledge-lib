// Copyright 2015 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Card = imports.app.interfaces.card;
const MarginButton = imports.app.widgets.marginButton;
const Module = imports.app.interfaces.module;
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
    InternalChildren: [ 'thumbnail-frame', 'title-label' ],

    _init: function (props={}) {
        this.parent(props);

        this.set_title_label_from_model(this._title_label);
        this.set_thumbnail_frame_from_model(this._thumbnail_frame);

        Utils.set_hand_cursor_on_widget(this);
    },

    _MINIMAL_SIZE: 100,
    vfunc_get_preferred_width: function () {
        let [min, nat] = this.parent();
        return [this._MINIMAL_SIZE, Math.max(this._MINIMAL_SIZE, nat)];
    },

    vfunc_get_preferred_height: function () {
        let [min, nat] = this.parent();
        return [this._MINIMAL_SIZE, Math.max(this._MINIMAL_SIZE, nat)];
    },
});
