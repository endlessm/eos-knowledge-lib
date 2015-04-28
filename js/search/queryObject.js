// Copyright 2015 Endless Mobile, Inc.
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Lang = imports.lang;
const Soup = imports.gi.Soup;

const Blacklist = imports.blacklist;
const Utils = imports.searchUtils;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

// Xapian prefixes used to query data
const _XAPIAN_PREFIX_EXACT_TITLE = 'exact_title:';
const _XAPIAN_PREFIX_ID = 'id:';
const _XAPIAN_PREFIX_TAG = 'tag:';
const _XAPIAN_PREFIX_TITLE = 'title:';

// Xapian QueryParser operators
// docs: http://xapian.org/docs/queryparser.html
const _XAPIAN_OPERATORS = ['AND', 'OR', 'NOT', 'XOR', 'NEAR', 'ADJ'];
const _XAPIAN_OP_AND = ' AND ';
const _XAPIAN_OP_OR = ' OR ';
const _XAPIAN_OP_NEAR = ' NEAR ';
const _XAPIAN_OP_NOT = 'NOT ';
const _XAPIAN_SYNTAX_CHARACTERS = ['(', ')', '+', '-', '\'', '"'];

// The value numbers where certain info is stored in our Xapian documents
const _XAPIAN_SOURCE_URL_VALUE_NO = 0;
const _XAPIAN_RANK_VALUE_NO = 1;
const _XAPIAN_ARTICLE_NUMBER_VALUE_NO = 2;

const _DEFAULT_CUTOFF = 10;
const _MATCH_SYNOPSIS_CUTOFF = 20;

// Matches any contiguous whitespace
const _WHITESPACE_REGEX = /\s+/;
// Matches any delimiter which indicates a separate Xapian term
const _TERM_DELIMITER_REGEX = /[\s\-]+/;

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

    _sanitized_query: function () {
        // Remove excess white space
        let query = this.query.split(_WHITESPACE_REGEX).join(' ').trim();

        // RegExp to match xapian operators or special characters
        let regexString = _XAPIAN_OPERATORS.concat(_XAPIAN_SYNTAX_CHARACTERS.map((chr) => {
            return '\\' + chr;
        })).join('|');
        let regex = new RegExp(regexString, 'g');

        // If we find a xapian operator term, lower case it.
        // If we find a xapian syntax character, remove it.
        // Anything else can stay as is.
        return query.replace(regex, (match) => {
            if (_XAPIAN_OPERATORS.indexOf(match) !== -1) {
                return match.toLowerCase();
            } else if (_XAPIAN_SYNTAX_CHARACTERS.indexOf(match) !== -1) {
                return '';
            } else {
                return match; // Fallback case
            }
        }).trim();
    },

    _query_clause: function () {
        let sanitized_query = this._sanitized_query();
        let terms = sanitized_query.split(_TERM_DELIMITER_REGEX);
        let exact_title_clause = _XAPIAN_PREFIX_EXACT_TITLE + terms.map(Utils.capitalize).join('_');

        if (sanitized_query.length === 0)
            return '';

        // Don't add wildcard here, wildcard searches with a single character cause
        // performance problems.
        if (sanitized_query.length === 1)
            return exact_title_clause;

        let maybe_add_wildcard = this.type === QueryObjectType.INCREMENTAL ?
            (term) => Utils.parenthesize(term + _XAPIAN_OP_OR + term + '*') :
            (term) => term;
        let add_title_prefix = (term) => _XAPIAN_PREFIX_TITLE + term;

        let clauses = [];

        clauses.push(maybe_add_wildcard(exact_title_clause));

        let title_clause = terms.map(add_title_prefix).map(maybe_add_wildcard).join(_XAPIAN_OP_AND);
        clauses.push(title_clause);

        if (this.match === QueryObjectMatch.TITLE_SYNOPSIS) {
            let body_clause = terms.map(maybe_add_wildcard).join(_XAPIAN_OP_AND);
            clauses.push(body_clause);
        }

        return clauses.map(Utils.parenthesize).join(_XAPIAN_OP_OR);
    },

    _tags_clause: function () {
        // Tag lists should be joined as a series of individual tag queries
        // joined by ORs, so an article that has any of the tags will match
        // e.g. [foo,bar,baz] => 'K:foo OR K:bar OR K:baz'
        let prefixed_tags = this.tags.map(Utils.quote).map((tag) => {
            return _XAPIAN_PREFIX_TAG + tag;
        });
        return prefixed_tags.join(_XAPIAN_OP_OR);
    },

    _blacklist_clause: function () {
        let explicit_tags = Blacklist.blacklist[this.domain] || [];
        let prefixed_tags = explicit_tags.map(Utils.quote).map((tag) => {
            return _XAPIAN_OP_NOT + _XAPIAN_PREFIX_TAG + tag;
        });
        return prefixed_tags.join(_XAPIAN_OP_AND);
    },

    _ids_clause: function () {
        let id_clauses = this.ids.map((id) => {
            if (GLib.uri_parse_scheme(id) !== 'ekn')
                throw new Error('EKN ID has unexpected uri scheme ' + id);

            let path = id.slice('ekn://'.length).split('/');
            if (path.length !== 2)
                throw new Error('EKN ID has unexpected structure ' + id);

            // EKN domain is the last part of the app ID (without the reverse domain name)
            let id_domain = path[0];
            if (this.domain !== id_domain)
                throw new Error('EKN ID has domain ' + id_domain + ', but QueryObject has domain ' + this.domain);

            // EKN ID is a 16-hexdigit hash
            let hash = path[1];
            if (hash.search(/^[A-Za-z0-9]{16}$/) === -1)
                throw new Error('EKN ID has malformed hash ' + id);

            return _XAPIAN_PREFIX_ID + hash;
        });
        return id_clauses.join(_XAPIAN_OP_OR);
    },

    get_query_parser_string: function () {
        let clauses = [];
        clauses.push(this._query_clause());
        clauses.push(this._tags_clause());
        clauses.push(this._blacklist_clause());
        clauses.push(this._ids_clause());
        return clauses.filter((c) => c).map(Utils.parenthesize).join(_XAPIAN_OP_AND);
    },

    get_cutoff: function () {
        // We need a stricter cutoff when matching against all indexed terms
        if (this.match === QueryObjectMatch.TITLE_SYNOPSIS)
            return _MATCH_SYNOPSIS_CUTOFF;
        return _DEFAULT_CUTOFF;
    },

    get_sort_value: function () {
        switch (this.sort) {
            case QueryObjectSort.RANK:
                return _XAPIAN_RANK_VALUE_NO;
            case QueryObjectSort.ARTICLE_NUMBER:
                return _XAPIAN_ARTICLE_NUMBER_VALUE_NO;
            default:
                return undefined;
        }
    },

    get_collapse_value: function () {
        return _XAPIAN_SOURCE_URL_VALUE_NO;
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
