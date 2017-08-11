// Copyright 2016 Endless Mobile, Inc.

const Card = imports.app.interfaces.card;
const Module = imports.app.interfaces.module;
const ContentGroupSuper = imports.app.modules.contentGroup.contentGroup;
const {View} = imports.app.interfaces.view;

/**
 * Class: ContentGroup
 *
 * A content group subclass that implements the card interface.
 *
 * This is used for selections of selections. For example if you have
 * a selection of sets, each of those sets may in turn contain subsets.
 * In that scenario each subset would be a Card.ContentGroup - that is,
 * it would be backed by a model, and yet would create it's own arrangement
 * and child cards as well.
 */
var ContentGroup = new Module.Class({
    Name: 'Card.ContentGroup',
    Extends: ContentGroupSuper.ContentGroup,
    Implements: [View, Card.Card],

    _init: function (props={}) {
        this.parent(props);

        this.get_selection().connect('models-changed', () => {
            this.visible = this.get_selection().get_models().length > 0;
        });
    },

    // By default GJS will prefer the Interface's make_ready implementation
    // over the superclasses. But we want the one from ContentGroup.ContentGroup
    make_ready: function () {
        this.parent();
    },
});
