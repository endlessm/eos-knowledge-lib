// Copyright 2014 Endless Mobile, Inc.
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Soup = imports.gi.Soup;

const ContentObjectModel = imports.contentObjectModel;
const TreeNode = imports.treeNode;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

/**
 * Class: ArticleObjectModel
 * The model class for article objects. An article has the same
 * properties as a <ContentObjectModel>, plus a <article-content-uri>,
 * <word-count>, and <table-of-contents>.
 */
const ArticleObjectModel = new Lang.Class({
    Name: 'ArticleObjectModel',
    GTypeName: 'EknArticleObjectModel',
    Extends: ContentObjectModel.ContentObjectModel,
    Properties: {
        /**
         * Property: html
         * Body HTML of the article.
         */
        'html': GObject.ParamSpec.string('html', 'Article HTML',
            'The HTML of the article, unstyled.',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            ''),
        /**
         * Property: html-source
         *
         * Source of the HTML. Right now can be embedly, wikipedia, wikihow,
         * wikisource or wikibooks.
         */
        'html-source': GObject.ParamSpec.string('html-source', 'Source of the HTML',
            'Where the article html was retrieved from.',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            ''),
        /**
         * Property: word-count
         * Integer indicating how many words are in the article
         */
        'word-count': GObject.ParamSpec.uint('word-count', 'Word Count',
            'Number of words contained in the article body',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            0, GLib.MAXUINT32, 0),

        /**
         * Property: table-of-contents
         * A GtkTreeStore representing the article's hierarchical
         * table of contents
         */
        'table-of-contents': GObject.ParamSpec.object('table-of-contents',
             'Table of Contents',
             'Tree representing the article\'s table of contents',
             GObject.ParamFlags.READWRITE,
             Gtk.TreeStore),

        /**
         * Property: issue-number
         * Integer indicating the issue number for the Reader application.
         * Defaults to 0, which means that this ArticleObject is not part of the
         * Reader application and hence it does not have an issue number.
         *
         * Since: 0.2
         */
        'issue-number': GObject.ParamSpec.uint('issue-number', 'Reader\'s Issue Number',
            'Issue Number for the Reader App',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            0, GLib.MAXUINT32, 0),

        /**
         * Property: article-number
         * Integer that indicates the order of the ArticleObject within the issue.
         * Defaults to 0, which means that this ArticleObject is not part of the
         * Reader application and hence it does not have an article number.
         *
         * Since: 0.2
         */
        'article-number': GObject.ParamSpec.uint('article-number', 'Reader\'s Article Number',
            'Article Number for the Reader App',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            0, GLib.MAXUINT32, 0),

        /**
         * Property: published
         * The date this article was published. It treats dates
         * according to the ISO8601 standard.
         */
        'published': GObject.ParamSpec.string('published', 'Publication Date', 'Publication Date of the article',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, ''),
    },

    _init: function (params) {
        this._authors = [];
        this.parent(params);
    },

    get word_count () {
        return this._word_count;
    },

    get table_of_contents () {
        return this._table_of_contents;
    },

    get issue_number() {
        return this._issue_number;
    },

    get article_number() {
        return this._article_number;
    },

    set word_count (v) {
        this._word_count = v;
    },

    set table_of_contents (v) {
        this._table_of_contents = v;
    },

    set issue_number(v) {
        this._issue_number = v;
    },

    set article_number(v) {
        this._article_number = v;
    },

    set published (v) {
        this._published = v;
    },

    get published () {
        return this._published;
    },

    set_authors: function (v) {
        this._authors = v;
    },

    get_authors: function () {
        return this._authors;
    },
});

/**
 * Constructor: new_from_json_ld
 * Creates an ArticleObjectModel from a Knowledge Engine ArticleObject
 * JSON-LD document
 */
ArticleObjectModel.new_from_json_ld = function (json_ld_data, media_path) {
    let props = ArticleObjectModel._props_from_json_ld(json_ld_data, media_path);
    let article_object_model = new ArticleObjectModel(props);
    ArticleObjectModel._setup_from_json_ld(article_object_model, json_ld_data, media_path);

    return article_object_model;
};

ArticleObjectModel._setup_from_json_ld = function (model, json_ld_data, media_path) {
    // Inherit setup from parent class
    let ParentClass = ArticleObjectModel.__super__;
    ParentClass._setup_from_json_ld(model, json_ld_data, media_path);
    if (json_ld_data.hasOwnProperty('authors')) {
        model.set_authors(json_ld_data.authors);
    }

};

ArticleObjectModel._props_from_json_ld = function (json_ld_data, media_path) {
    // Inherit properties marshalled from parent class
    let ParentClass = ArticleObjectModel.__super__;
    let props = ParentClass._props_from_json_ld(json_ld_data, media_path);

    if (json_ld_data.hasOwnProperty('articleBody'))
        props.html = json_ld_data.articleBody;

    // FIXME: see https://github.com/endlessm/eos-sdk/issues/2520
    // This is a holdover from knowledge engine where we guess the source of
    // the html from the source_uri field, and if it comes from pantheon, assume
    // embedly. This will probably need to stay as a patch for old databases,
    // but we should put this in our database in a consistent manner.
    if (props.source_uri) {
        let host = Soup.URI.new(props.source_uri).get_host();
        if (/^.*.wikipedia\.org/.test(host)) {
            props.html_source = 'wikipedia';
        } else if (/^.*\.wikisource\.org/.test(host)) {
            props.html_source = 'wikisource';
        } else if (/^.*\.wikibooks\.org/.test(host)) {
            props.html_source = 'wikibooks';
        } else if (/^.*wikihow\.com/.test(host)) {
            props.html_source = 'wikihow';
        } else if ('eos-pantheon.herokuapp.com' === host) {
            props.html_source = 'embedly';
        } else {
            throw new Error('Unrecognized source uri host: ' + host);
        }
    }

    // Marshal properties specific to ArticleObjectModel
    if (json_ld_data.hasOwnProperty('wordCount')) {
        props.word_count = parseInt(json_ld_data.wordCount);
    }

    if (json_ld_data.hasOwnProperty('tableOfContents')) {
        props.table_of_contents = TreeNode.tree_model_from_tree_node(json_ld_data);
    }

    if (json_ld_data.hasOwnProperty('issueNumber')) {
        if (json_ld_data.issueNumber < 0)
            throw new Error('Issue number must be a non-negative integer.');
        props.issue_number = parseInt(json_ld_data.issueNumber);
    }

    if (json_ld_data.hasOwnProperty('articleNumber')) {
        if (json_ld_data.articleNumber < 0)
            throw new Error('Article number must be a non-negative integer.');
        props.article_number = parseInt(json_ld_data.articleNumber);
    }

    if (json_ld_data.hasOwnProperty('published')) {
        props.published = json_ld_data.published;
    }

    return props;
};
