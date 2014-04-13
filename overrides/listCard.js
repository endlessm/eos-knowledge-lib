// Copyright 2014 Endless Mobile, Inc.

const Lang = imports.lang;

const Card = imports.card;

/**
 * Class: ListCard
 *
 * This card represents a list, category, or collection of other cards.
 *
 * Extends:
 *   <Card>
 */
const ListCard = new Lang.Class({
    Name: 'ListCard',
    GTypeName: 'EknListCard',
    Extends: Card.Card,

    _init: function (props) {
        this.parent(props);
    }
});
