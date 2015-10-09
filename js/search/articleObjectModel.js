// Copyright 2014 Endless Mobile, Inc.
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Soup = imports.gi.Soup;

const ContentObjectModel = imports.search.contentObjectModel;
const TreeNode = imports.search.treeNode;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

/**
 * Class: ArticleObjectModel
 * The model class for article objects. An article has the same properties as a
 * <ContentObjectModel>, plus a number of properties specific to articles.
 */
const ArticleObjectModel = new Lang.Class({
    Name: 'ArticleObjectModel',
    GTypeName: 'EknArticleObjectModel',
    Extends: ContentObjectModel.ContentObjectModel,
    Properties: {
        /**
         * Property: source
         *
         * Source of the HTML. Right now can be embedly, wikipedia, wikihow,
         * wikisource or wikibooks.
         */
        'source': GObject.ParamSpec.string('source', 'Source of the HTML',
            'Where the article html was retrieved from.',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            ''),

        /**
         * Property: source-name
         * Human-readable name of the source of this article
         *
         * A string containing the name of this article's source.
         * For example, "Wikipedia" or "Huffington Post" or "Cosimo's Blog".
         */
        'source-name': GObject.ParamSpec.string('source-name', 'Source name',
            'Human-readable name of the source of this article',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            ''),

        /**
         * Property: word-count
         * Integer indicating how many words are in the article
         */
        'word-count': GObject.ParamSpec.uint('word-count', 'Word Count',
            'Number of words contained in the article body',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
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

    _init: function (props={}, json_ld=null) {
        if (json_ld)
            this._article_props_from_json_ld(props, json_ld);

        // FIXME: When we have support for list GObject properties in gjs.
        Object.defineProperties(this, {
            /**
             * Property: authors
             * A list of authors of the article being read.
             */
            'authors': {
                value: props.authors ? props.authors.slice(0) : [],
                writable: false,
            },
        });
        delete props.authors;

        this.parent(props, json_ld);

        this._article_legacy_fixups();
    },

    _article_props_from_json_ld: function (props, json_ld) {
        // Marshal properties specific to ArticleObjectModel
        if (json_ld.hasOwnProperty('authors'))
            props.authors = json_ld.authors;

        if (json_ld.hasOwnProperty('wordCount'))
            props.word_count = parseInt(json_ld.wordCount);

        if (json_ld.hasOwnProperty('tableOfContents'))
            props.table_of_contents = TreeNode.tree_model_from_tree_node(json_ld);

        if (json_ld.hasOwnProperty('source'))
            props.source = json_ld.source;

        if (json_ld.hasOwnProperty('sourceName'))
            props.source_name = json_ld.sourceName;

        if (json_ld.hasOwnProperty('articleNumber')) {
            if (json_ld.articleNumber < 0)
                throw new Error('Article number must be a non-negative integer.');
            props.article_number = parseInt(json_ld.articleNumber);
        }

        if (json_ld.hasOwnProperty('published'))
            props.published = json_ld.published;
    },

    _article_legacy_fixups: function () {
        if (this.ekn_version === 1) {
            // This is a holdover from the node knowledge engine where we guess
            // the source of the html from the source_uri field, and if it comes
            // from pantheon, assume embedly.
            if (!this.source && this.source_uri) {
                let host = Soup.URI.new(this.source_uri).get_host();

                if (host === null) {
                    throw new Error('Null source URI hostname found for article ' +
                        'sourceURI: ' + this.source_uri);
                }

                if (/^.*.wikipedia\.org/.test(host)) {
                    this.source = 'wikipedia';
                } else if (/^.*\.wikisource\.org/.test(host)) {
                    this.source = 'wikisource';
                } else if (/^.*\.wikibooks\.org/.test(host)) {
                    this.source = 'wikibooks';
                } else if (/^.*wikihow\.com/.test(host)) {
                    this.source = 'wikihow';
                } else if ('eos-pantheon.herokuapp.com' === host || 'localhost' === host) {
                    this.source = 'embedly';
                } else if ('knowledge-build' === host) {
                    // This is where we used to host pdf apps pre 2.3, needed for
                    // compatibility with 2.2 era bundles
                    this.source = 'pdf';
                } else {
                    throw new Error('Unrecognized source uri host: ' + host);
                }
            }

            if (!this.original_uri && this.source_uri &&
                ['wikipedia', 'wikihow', 'wikisource', 'wikibooks'].indexOf(this.source) !== -1)
                this.original_uri = this.source_uri;

            if (!this.source_name) {
                if (this.source === 'wikipedia')
                    this.source_name = 'Wikipedia';
                else if (this.source === 'wikihow')
                    this.source_name = 'wikiHow';
                else if (this.source === 'wikisource')
                    this.source_name = 'Wikisource';
                else if (this.source === 'wikibooks')
                    this.source_name = 'Wikibooks';
            }

            // Remove invalid value of license property which exists in pre-2.3 DBs.
            // Replace with correct license.
            if (this.license === 'Creative Commons')
                delete this.license;
            if (!this.license) {
                if (['wikipedia', 'wikisource', 'wikibooks'].indexOf(this.source) !== -1)
                    this.license = 'CC-BY-SA 3.0';
                else if (this.source === 'wikihow')
                    this.license = 'Owner permission';
            }
        }
    },
});
