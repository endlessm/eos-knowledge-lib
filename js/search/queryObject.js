// Copyright 2015 Endless Mobile, Inc.
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Lang = imports.lang;
const Soup = imports.gi.Soup;

const Utils = imports.searchUtils;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

/**
 * Enum: QueryObjectType
 *
 * INCREMENTAL - Queries will match partially typed words. For example a query
 *               for 'dragonba' will match the Dragonball article.
 * DELIMITED   - Queries will be assumed to be entire words.
 */
const QueryObjectType = Utils.define_enum(['INCREMENTAL', 'DELIMITED']);

/**
 * Enum: QueryObjectMatch
 *
 * TITLE_ONLY     - Only article titles will match against the query string.
 * TITLE_SYNOPSIS - Article titles and synopsis will match the query string.
 */
const QueryObjectMatch = Utils.define_enum(['TITLE_ONLY', 'TITLE_SYNOPSIS']);

/**
 * Enum: QueryObjectSort
 *
 * RELEVANCE      - Use xapian relevance ranking to sort articles. Exact title
 *                  matches will be weighted most heavily.
 * ARTICLE_NUMBER - Use the article number field to sort results.
 *                  Currently only reader app databases have article numbers.
 * RANK           - Uses the article page rank to sort results.
 */
const QueryObjectSort = Utils.define_enum(['RELEVANCE', 'ARTICLE_NUMBER', 'RANK']);

/**
 * Enum: QueryObjectOrder
 *
 * ASCENDING  - Return articles in ascending order.
 * DESCENDING - Return articles in descending order.
 */
const QueryObjectOrder = Utils.define_enum(['ASCENDING', 'DESCENDING']);

/**
 * Class: QueryObject
 *
 * The QueryObject class allows you to describe a query to a knowledge app
 * database for articles. Use this with <Engine.get_object_by_id> to retrieve
 * article from the database.
 *
 * This class has no functionality, but is just a bag of properties to tweak
 * the type of query being made. QueryObjects are immutable after creation,
 * which allows them to be used safely in a <HistoryItem>. All properties
 * must be passed in on construction.
 *
 * See <new_from_object> for a convenience constructor to create a new object
 * with a few tweaked values.
 */
const QueryObject = Lang.Class({
    Name: 'QueryObject',
    GTypeName: 'EknQueryObject',
    Extends: GObject.Object,

    Properties: {
        /**
         * Property: domain
         *
         * The ekn domain of the database to query to. If not set, the <Engine>
         * will fill this in with the <Engine.default-domain> property.
         */
        'domain': GObject.ParamSpec.string('domain', 'Domain',
            'Ekn domain of the knowledge database to query to',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, ''),
        /**
         * Property: query
         *
         * The actual query string that was entered by the user with all terms
         * that should be searched for.
         */
        'query': GObject.ParamSpec.string('query', 'Query string',
            'Query string with terms to search',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, ''),
        /**
         * Property: type
         *
         * The type of query to preform, see <QueryObjectType>.
         *
         * Defaults to <QueryObjectType.INCREMENTAL>.
         */
        'type': GObject.ParamSpec.uint('type', 'Type',
            'Type of query to preform',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            0, Object.keys(QueryObjectType).length, QueryObjectType.INCREMENTAL),
        /**
         * Property: match
         *
         * What to match against in the source documents, see <QueryObjectMatch>.
         *
         * Defaults to <QueryObjectMatch.TITLE_ONLY>.
         */
        'match': GObject.ParamSpec.uint('match', 'Match',
            'What to match against in the source documents',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            0, Object.keys(QueryObjectMatch).length, QueryObjectMatch.TITLE_ONLY),
        /**
         * Property: limit
         *
         * The maximum number of results to return.
         *
         * Defaults to 10.
         */
        'limit': GObject.ParamSpec.uint('limit', 'Limit',
            'The maximum number of results to find',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            0, GLib.MAXUINT32, 10),
        /**
         * Property: offset
         *
         * The number of results to skip, can be use with <limit> to paginate
         * results.
         *
         * Defaults to 0.
         */
        'offset': GObject.ParamSpec.uint('offset', 'Offset',
            'Number of results to skip',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            0, GLib.MAXUINT32, 0),
        /**
         * Property: sort
         *
         * What to sort results by, see <QueryObjectSort>.
         *
         * Defaults to <QueryObjectSort.RELEVANCE>.
         */
        'sort': GObject.ParamSpec.uint('sort', 'Sort',
            'What to sort-by against in the source documents',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            0, Object.keys(QueryObjectSort).length, QueryObjectSort.RELEVANCE),
        /**
         * Property: order
         *
         * Order of results, see <QueryObjectOrder>.
         *
         * Defaults to <QueryObjectOrder.ASCENDING>.
         */
        'order': GObject.ParamSpec.uint('order', 'Order',
            'What order to put results in',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            0, Object.keys(QueryObjectOrder).length, QueryObjectOrder.ASCENDING),
        /**
         * Property: tags
         *
         * A list of tags to restrict the search to. All articles returned will
         * match at least one of the tags.
         */
        /**
         * Property: ids
         *
         * A list of specific ekn ids to limit the search to. Can be used with
         * an empty query to retrieve the given set of ids.
         */
    },

    _init: function (props={}) {
        // FIXME: When we have support for list GObject properties in gjs.
        Object.defineProperties(this, {
            'tags': {
                value: props.tags ? props.tags.slice(0) : [],
                writable: false,
            },
            'ids': {
                value: props.ids ? props.ids.slice(0) : [],
                writable: false,
            },
        });
        delete props.tags;
        delete props.ids;

        this.parent(props);
    },
});

/**
 * Function: new_from_object
 *
 * Constructs a new query object using the *source* QueryObject as a default for
 * all property values. A optional set of property values can be passed in, as
 * with the default constructor.
 */
QueryObject.new_from_object = function (source, props={}) {
    let prop_names = Object.getOwnPropertyNames(source);
    prop_names = prop_names.filter((prop_name) => !prop_name.startsWith('_'));

    let all_props = {};
    for (let prop_names of prop_names) {
        all_props[prop_names] = props.hasOwnProperty(prop_names) ? props[prop_names] : source[prop_names];
    }
    return new QueryObject(all_props);
};
