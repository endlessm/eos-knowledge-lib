// Copyright 2014 Endless Mobile, Inc.

const Lang = imports.lang;

const CardA = imports.cardA;

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

    _init: function (props) {
        this.parent(props);
    }
});
