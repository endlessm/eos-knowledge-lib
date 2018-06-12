// Copyright 2016 Endless Mobile, Inc.

const GObject = imports.gi.GObject;

const Knowledge = imports.framework.knowledge;
const ReadingHistoryModel = imports.framework.readingHistoryModel;

var MockReadingHistoryModel = new Knowledge.Class({
    Name: 'MockReadingHistoryModel',
    Extends: GObject.Object,

    Signals: {
        'changed': {},
    },

    _init: function (props={}) {
        this.parent(props);
        this._read_articles = new Set();
    },

    mark_article_read: function (article_id) {
        this.emit('changed');
        this._read_articles.add(article_id);
    },

    is_read_article: function (article_id) {
        return this._read_articles.has(article_id);
    },

    get_read_articles: function () {
        return this._read_articles;
    },
});

// Creates a new MockReadingHistoryModel and sets it up as the singleton. Use
// in a beforeEach to have a new history model each test iteration.
function mock_default() {
    let reading_history = new MockReadingHistoryModel();
    spyOn(ReadingHistoryModel, 'get_default').and.callFake(() => reading_history);
    return reading_history;
};
