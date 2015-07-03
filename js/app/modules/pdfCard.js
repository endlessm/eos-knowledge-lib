// Copyright 2014 Endless Mobile, Inc.

const Lang = imports.lang;

const CardA = imports.app.modules.cardA;

/**
 * Class: PdfCard
 *
 * This card represents an article and shows a PDF icon.
 *
 * Extends:
 *   <CardA>
 */
const PdfCard = new Lang.Class({
    Name: 'PdfCard',
    GTypeName: 'EknPdfCard',
    Extends: CardA.CardA,

    Template: 'resource:///com/endlessm/knowledge/widgets/pdfCard.ui',
    Children: [ 'title-label' ],

    _init: function (props) {
        this.parent(props);
    },
});
