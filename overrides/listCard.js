// Copyright 2014 Endless Mobile, Inc.

const _Lang = imports.lang;

const _Card = imports.card;

/**
 * Class: ListCard
 *
 * This card represents a list, category, or collection of other cards.
 *
 * Extends:
 *   <Card>
 */
const ListCard = new _Lang.Class({
    Name: 'ListCard',
    GTypeName: 'EknListCard',
    Extends: _Card.Card,

    _init: function (props) {
        this.parent(props);
    }
});
