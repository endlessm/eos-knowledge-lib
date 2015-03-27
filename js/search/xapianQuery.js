// Xapian prefixes used to query data
const XAPIAN_PREFIX_EXACT_TITLE = 'exact_title:';
const XAPIAN_PREFIX_ID = 'id:';
const XAPIAN_PREFIX_TAG = 'tag:';
const XAPIAN_PREFIX_TITLE = 'title:';

// Xapian QueryParser operators
// docs: http://xapian.org/docs/queryparser.html
const XAPIAN_OP_AND = " AND ";
const XAPIAN_OP_OR = " OR ";
const XAPIAN_OP_NEAR = " NEAR ";
const XAPIAN_OP_NOT = "NOT ";

// The value numbers where certain info is stored in our Xapian documents
const XAPIAN_SOURCE_URL_VALUE_NO = 0;
const XAPIAN_RANK_VALUE_NO = 1;
const XAPIAN_ARTICLE_NUMBER_VALUE_NO = 2;

function parenthesize (clause) {
    return '(' + clause + ')';
}

function capitalize (word) {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function emptyQueries (query) {
    return query !== '()';
}

function quote (clause) {
    return '"' + clause + '"';
}

function addTitlePrefix (term) {
    return XAPIAN_PREFIX_TITLE + term;
}

function addWildcardClause (term) {
    return parenthesize(term + XAPIAN_OP_OR + term + '*');
}

// matches any contiguous whitespace
const WHITESPACE_REGEX = /\s+/;

// matches any delimiter which indicates a separate Xapian term
const TERM_DELIMITER_REGEX = /[\s\-]+/;

function sanitize (query) {
    // Remove excess white space
    query = query.split(WHITESPACE_REGEX).join(' ').trim();

    // Escape xapian special characters: http://xapian.org/docs/queryparser.html
    let xapianOperators = ['AND', 'OR', 'NOT', 'XOR', 'NEAR', 'ADJ'];
    let xapianSyntaxChars = ['(', ')', '+', '-', '\'', '"'];

    // RegExp to match xapian operators or special characters
    let regexString = xapianOperators.concat(xapianSyntaxChars.map(function (chr) {
        return '\\' + chr;
    })).join('|');
    let regex = new RegExp(regexString, 'g');

    // If we find a xapian operator term, lower case it.
    // If we find a xapian syntax character, remove it.
    // Anything else can stay as is.
    return query.replace(regex, function (match) {
        if (xapianOperators.indexOf(match) !== -1) {
            return match.toLowerCase();
        } else if (xapianSyntaxChars.indexOf(match) !== -1) {
            return '';
        } else {
            return match; // Fallback case
        }
    }).trim();
}

function exact_title_clause (terms) {
    return XAPIAN_PREFIX_EXACT_TITLE + terms.map(capitalize).join('_');
}

function xapian_join_clauses (clauses) {
    return clauses.map(parenthesize).join(XAPIAN_OP_AND);
}

function xapian_delimited_query_clause (query, match_all) {
    let sanitized_query = sanitize(query);
    let separateTerms = sanitized_query.split(TERM_DELIMITER_REGEX);

    if (sanitized_query.length === 1)
        return exact_title_clause(separateTerms);

    let clauses = [];

    let exactTitleClause = exact_title_clause(separateTerms);
    clauses.push(exactTitleClause);

    let titleClause = separateTerms.map(addTitlePrefix).join(XAPIAN_OP_AND);
    clauses.push(titleClause);

    if (match_all) {
        let bodyClause = separateTerms.join(XAPIAN_OP_AND);
        clauses.push(bodyClause);
    }

    return clauses.map(parenthesize).join(XAPIAN_OP_OR);
}

function xapian_incremental_query_clause (query, match_all) {
    let sanitized_query = sanitize(query);
    let separateTerms = sanitized_query.split(TERM_DELIMITER_REGEX);

    // Don't wildcard here, wildcard searches with a single character cause
    // performance problems.
    if (sanitized_query.length === 1)
        return exact_title_clause(separateTerms);

    let clauses = [];

    let exactTitleClause = addWildcardClause(exact_title_clause(separateTerms));
    clauses.push(exactTitleClause);

    let titleClause = separateTerms.map(addTitlePrefix).map(addWildcardClause).join(XAPIAN_OP_AND);
    clauses.push(titleClause);

    if (match_all) {
        let bodyClause = separateTerms.map(addWildcardClause).join(XAPIAN_OP_AND);
        clauses.push(bodyClause);
    }

    return clauses.map(parenthesize).join(XAPIAN_OP_OR);
}

// Tag lists should be joined as a series of
// individual tag queries joined by ORs, so an article that has
// any of the tags will match
// e.g. [foo,bar,baz] => "K:foo OR K:bar OR K:baz"
function xapian_tag_clause (tags) {
    let prefixedTagsArr = tags
        .map(quote)
        .map(function (tag) { return XAPIAN_PREFIX_TAG + tag; });

    return prefixedTagsArr.join(XAPIAN_OP_OR);
}

function xapian_not_tag_clause (tags) {
    let prefixedTagsArr = tags
        .map(quote)
        .map(function (tag) { return XAPIAN_OP_NOT + XAPIAN_PREFIX_TAG + tag; });

    return prefixedTagsArr.join(XAPIAN_OP_AND);
}

// Each id argument here is a full uri, e.g. ekn://animals/s0m3ha5h. We want
// just the hash portion.
function xapian_ids_clause (ids) {
    let id_clauses = ids.map((id) => {
        // Verify that ekn id is of the right form
        let ekn_matcher = /^ekn:\/\/(api\/)?[A-Z-]+\/[A-Z0-9]+$/i
        if (!ekn_matcher.test(id))
            throw new Error("Received invalid ekn uri " + id)

        return XAPIAN_PREFIX_ID + id.split('/').slice(-1)[0];
    });
    return id_clauses.join(XAPIAN_OP_OR);
}

function xapian_string_to_value_no(xapian_string) {
    switch (xapian_string) {
        case 'rank':
            return XAPIAN_RANK_VALUE_NO;
        case 'articleNumber':
            return XAPIAN_ARTICLE_NUMBER_VALUE_NO;
        default:
            return undefined;
    }
}
