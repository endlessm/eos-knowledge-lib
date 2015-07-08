// Copyright 2014 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Lang = imports.lang;

const CardA = imports.app.modules.cardA;

/**
 * Class: ArticleCard
 *
 * This card represents an article or a chunk of text.
 * It could be a Wikipedia article, for example.
 *
 * Extends:
 *   <Card>
 */
const ArticleCard = new Lang.Class({
    Name: 'ArticleCard',
    GTypeName: 'EknArticleCard',
    Extends: CardA.CardA,

    Template: 'resource:///com/endlessm/knowledge/widgets/articleCard.ui',
    Children: [ 'title-label', 'synopsis-label' ],

    _init: function (props) {
        this.parent(props);
    },
});
