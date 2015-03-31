// Copyright 2014 Endless Mobile, Inc.

/* global private_imports */

const Lang = imports.lang;

const CardA = private_imports.cardA;

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
