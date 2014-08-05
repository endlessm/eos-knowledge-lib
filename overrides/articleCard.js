// Copyright 2014 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;
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
    },

    pack_widgets: function (title_label, synopsis_label, image_frame) {
        title_label.lines = 2;
        title_label.xalign = 0;
        synopsis_label.xalign = 0;
        synopsis_label.yalign = 0;
        let grid = new Gtk.Grid({
            orientation: Gtk.Orientation.VERTICAL
        });
        grid.add(title_label);
        grid.add(synopsis_label);
        this.add(grid);
    },
});
