// Copyright 2014 Endless Mobile, Inc.

const Lang = imports.lang;

const CardA = imports.app.cardA;

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
    Extends: CardA.CardA,

    _init: function (props) {
        this.parent(props);
    }
});
