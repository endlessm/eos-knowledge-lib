// Copyright 2014 Endless Mobile, Inc.
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Soup = imports.gi.Soup;

const ContentObjectModel = imports.search.contentObjectModel;
const TreeNode = imports.search.treeNode;

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
         * Source of the HTML. Right now can be wikipedia, wikihow, wikisource
         * or wikibooks.
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
         * Property: published
         * The date this article was published. It treats dates
         * according to the ISO8601 standard.
         */
        'published': GObject.ParamSpec.string('published', 'Publication Date', 'Publication Date of the article',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, ''),

        /**
         * Property: is-server-templated
         * Whether the article is "server-templated". Server-templated articles
         * are articles which don't require additional client-side, source-specific
         * templating.
         */
        'is-server-templated': GObject.ParamSpec.boolean('is-server-templated',
            'Is Server Templated', 'Is Server Templated',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            false),
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
            /**
             * Property: outgoing-links
             * A list of the outbound links present in this article.
             */
            'outgoing_links': {
                value: props.outgoing_links ? props.outgoing_links.slice(0) : [],
                writable: false,
            },
        });
        delete props.authors;
        delete props.outgoing_links;

        this.parent(props, json_ld);
    },

    _article_props_from_json_ld: function (props, json_ld) {
        // Marshal properties specific to ArticleObjectModel
        if (json_ld.hasOwnProperty('authors'))
            props.authors = json_ld.authors;

        if (json_ld.hasOwnProperty('outgoingLinks'))
            props.outgoing_links = json_ld.outgoingLinks;

        if (json_ld.hasOwnProperty('wordCount'))
            props.word_count = parseInt(json_ld.wordCount);

        if (json_ld.hasOwnProperty('tableOfContents'))
            props.table_of_contents = TreeNode.tree_model_from_tree_node(json_ld);

        if (json_ld.hasOwnProperty('source'))
            props.source = json_ld.source;

        if (json_ld.hasOwnProperty('sourceName'))
            props.source_name = json_ld.sourceName;

        if (json_ld.hasOwnProperty('published'))
            props.published = json_ld.published;

        if (json_ld.hasOwnProperty('isServerTemplated'))
            props.is_server_templated = json_ld.isServerTemplated;
    },
});
