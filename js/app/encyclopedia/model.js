const GObject = imports.gi.GObject;
const Lang = imports.lang;

const EncyclopediaModel = new Lang.Class({

    Name: 'EncyclopediaModel',
    Extends: GObject.Object,
    Properties: {
        'article-history': GObject.ParamSpec.string('article-history',
            'Article History',
            'A stack of articles that the user has visited',
            GObject.ParamFlags.READABLE,
            '')
    },

    _init: function(params) {
        this.parent(params);
    }
});
