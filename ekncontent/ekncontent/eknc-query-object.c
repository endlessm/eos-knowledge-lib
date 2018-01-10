/* Copyright 2016 Endless Mobile, Inc. */

#include "eknc-query-object.h"

#include "eknc-enums.h"
#include "eknc-utils-private.h"

#include <gobject/gvaluecollector.h>
#include <string.h>

#define MATCH_SYNOPSIS_CUTOFF 20
#define DEFAULT_CUTOFF 10
#define XAPIAN_SEQUENCE_NUMBER_VALUE_NO 0
#define XAPIAN_PUBLISHED_DATE_VALUE_NO 1
#define MAX_TERM_LENGTH 245

#define XAPIAN_PREFIX_EXACT_TITLE "exact_title:"
#define XAPIAN_PREFIX_ID "id:"
#define XAPIAN_PREFIX_TAG "tag:"
#define XAPIAN_PREFIX_TITLE "title:"

#define XAPIAN_OP_AND " AND "
#define XAPIAN_OP_OR " OR "
#define XAPIAN_OP_NEAR " NEAR "
#define XAPIAN_OP_NOT "NOT"

#define XAPIAN_SYNTAX_REGEX "\\(|\\)|\\+|\\-|\\'|\\\""
#define XAPIAN_TERM_REGEX "AND|OR|NOT|XOR|NEAR|ADJ"
#define XAPIAN_DELIMITER_REGEX "[\\s\\-;]+"

/**
 * SECTION:query-object
 * @title: Query Object
 * @short_description: Define a search query for content
 *
 * The QueryObject class allows you to describe a query to a knowledge app
 * database for articles. Use this with eknc_engine_get_object_by_id to retrieve
 * article from the database.
 *
 * This class has no functionality, but is just a bag of properties to tweak
 * the type of query being made. QueryObjects are immutable after creation,
 * which allows them to be used safely in a HistoryItem. All properties
 * must be passed in on construction.
 *
 * See query_object_new_from_object for a convenience constructor to create a
 * new object with a few tweaked values.
 */
struct _EkncQueryObject
{
  GObject parent_instance;

  gchar *app_id;
  gchar *search_terms;
  gchar *corrected_terms;
  gchar *stopword_free_terms;
  gchar *literal_query;
  EkncQueryObjectMode mode;
  EkncQueryObjectMatch match;
  EkncQueryObjectSort sort;
  EkncQueryObjectOrder order;
  guint limit;
  guint offset;
  char **tags_match_all;
  char **tags_match_any;
  char **ids;
  char **excluded_ids;
  char **excluded_tags;
};

G_DEFINE_TYPE (EkncQueryObject,
               eknc_query_object,
               G_TYPE_OBJECT)

enum {
  PROP_0,
  PROP_APP_ID,
  PROP_SEARCH_TERMS,
  PROP_STOPWORD_FREE_TERMS,
  PROP_LITERAL_QUERY,
  PROP_MODE,
  PROP_MATCH,
  PROP_SORT,
  PROP_ORDER,
  PROP_LIMIT,
  PROP_OFFSET,
  PROP_TAGS_MATCH_ALL,
  PROP_TAGS_MATCH_ANY,
  PROP_IDS,
  PROP_EXCLUDED_IDS,
  PROP_EXCLUDED_TAGS,
  PROP_CORRECTED_TERMS,
  NPROPS
};

static GParamSpec *eknc_query_object_props [NPROPS] = { NULL, };

static void
eknc_query_object_get_property (GObject    *object,
                                guint       prop_id,
                                GValue     *value,
                                GParamSpec *pspec)
{
  EkncQueryObject *self = EKNC_QUERY_OBJECT (object);

  switch (prop_id)
    {
    case PROP_APP_ID:
      g_value_set_string (value, self->app_id);
      break;

    case PROP_SEARCH_TERMS:
      g_value_set_string (value, self->search_terms);
      break;

    case PROP_CORRECTED_TERMS:
      g_value_set_string (value, self->corrected_terms);
      break;

    case PROP_STOPWORD_FREE_TERMS:
      g_value_set_string (value, self->stopword_free_terms);
      break;

    case PROP_LITERAL_QUERY:
      g_value_set_string (value, self->literal_query);
      break;

    case PROP_MODE:
      g_value_set_enum (value, self->mode);
      break;

    case PROP_MATCH:
      g_value_set_enum (value, self->match);
      break;

    case PROP_SORT:
      g_value_set_enum (value, self->sort);
      break;

    case PROP_ORDER:
      g_value_set_enum (value, self->order);
      break;

    case PROP_LIMIT:
      g_value_set_uint (value, self->limit);
      break;

    case PROP_OFFSET:
      g_value_set_uint (value, self->offset);
      break;

    case PROP_TAGS_MATCH_ALL:
      g_value_set_boxed (value, self->tags_match_all);
      break;

    case PROP_TAGS_MATCH_ANY:
      g_value_set_boxed (value, self->tags_match_any);
      break;

    case PROP_IDS:
      g_value_set_boxed (value, self->ids);
      break;

    case PROP_EXCLUDED_IDS:
      g_value_set_boxed (value, self->excluded_ids);
      break;

    case PROP_EXCLUDED_TAGS:
      g_value_set_boxed (value, self->excluded_tags);
      break;

    default:
      G_OBJECT_WARN_INVALID_PROPERTY_ID (object, prop_id, pspec);
    }
}

static void
eknc_query_object_set_property (GObject *object,
                                        guint prop_id,
                                        const GValue *value,
                                        GParamSpec *pspec)
{
  EkncQueryObject *self = EKNC_QUERY_OBJECT (object);

  switch (prop_id)
    {
    case PROP_APP_ID:
      g_clear_pointer (&self->app_id, g_free);
      self->app_id = g_value_dup_string (value);
      break;

    case PROP_SEARCH_TERMS:
      g_clear_pointer (&self->search_terms, g_free);
      self->search_terms = g_value_dup_string (value);
      break;

    case PROP_CORRECTED_TERMS:
      g_clear_pointer (&self->corrected_terms, g_free);
      self->corrected_terms = g_value_dup_string (value);
      break;

    case PROP_STOPWORD_FREE_TERMS:
      g_clear_pointer (&self->stopword_free_terms, g_free);
      self->stopword_free_terms = g_value_dup_string (value);
      break;

    case PROP_LITERAL_QUERY:
      g_clear_pointer (&self->literal_query, g_free);
      self->literal_query = g_value_dup_string (value);
      break;

    case PROP_MODE:
      self->mode = g_value_get_enum (value);
      break;

    case PROP_MATCH:
      self->match = g_value_get_enum (value);
      break;

    case PROP_SORT:
      self->sort = g_value_get_enum (value);
      break;

    case PROP_ORDER:
      self->order = g_value_get_enum (value);
      break;

    case PROP_LIMIT:
      self->limit = g_value_get_uint (value);
      break;

    case PROP_OFFSET:
      self->offset = g_value_get_uint (value);
      break;

    case PROP_TAGS_MATCH_ALL:
      g_clear_pointer (&self->tags_match_all, g_strfreev);
      self->tags_match_all = g_value_dup_boxed (value);
      break;

    case PROP_TAGS_MATCH_ANY:
      g_clear_pointer (&self->tags_match_any, g_strfreev);
      self->tags_match_any = g_value_dup_boxed (value);
      break;

    case PROP_IDS:
      g_clear_pointer (&self->ids, g_strfreev);
      self->ids = g_value_dup_boxed (value);
      break;

    case PROP_EXCLUDED_IDS:
      g_clear_pointer (&self->excluded_ids, g_strfreev);
      self->excluded_ids = g_value_dup_boxed (value);
      break;

    case PROP_EXCLUDED_TAGS:
      g_clear_pointer (&self->excluded_tags, g_strfreev);
      self->excluded_tags = g_value_dup_boxed (value);
      break;

    default:
      G_OBJECT_WARN_INVALID_PROPERTY_ID (object, prop_id, pspec);
    }
}

static void
eknc_query_object_finalize (GObject *object)
{
  EkncQueryObject *self = EKNC_QUERY_OBJECT (object);

  g_clear_pointer (&self->app_id, g_free);
  g_clear_pointer (&self->search_terms, g_free);
  g_clear_pointer (&self->corrected_terms, g_free);
  g_clear_pointer (&self->stopword_free_terms, g_free);
  g_clear_pointer (&self->literal_query, g_free);
  g_clear_pointer (&self->tags_match_all, g_strfreev);
  g_clear_pointer (&self->tags_match_any, g_strfreev);
  g_clear_pointer (&self->ids, g_strfreev);
  g_clear_pointer (&self->excluded_ids, g_strfreev);
  g_clear_pointer (&self->excluded_tags, g_strfreev);

  G_OBJECT_CLASS (eknc_query_object_parent_class)->finalize (object);
}

static void
eknc_query_object_class_init (EkncQueryObjectClass *klass)
{
  GObjectClass *object_class = G_OBJECT_CLASS (klass);

  object_class->get_property = eknc_query_object_get_property;
  object_class->set_property = eknc_query_object_set_property;
  object_class->finalize = eknc_query_object_finalize;

  /**
   * EkncQueryObject:app-id:
   *
   * The app ID of the database to query. If not set, the Engine
   * will fill this in with the Engine.default-app-id property.
   */
  eknc_query_object_props[PROP_APP_ID] =
    g_param_spec_string ("app-id", "App ID",
      "App ID of the database to query",
      "", G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);

  /**
   * EkncQueryObject:search-terms:
   *
   * The actual query string that was entered by the user with all terms
   * that should be searched for.
   */
  eknc_query_object_props[PROP_SEARCH_TERMS] =
    g_param_spec_string ("search-terms", "Search terms",
      "Query string with terms to search",
      "", G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);

  /**
   * EkncQueryObject:corrected-terms:
   *
   * A corrected version of the search-terms property (e.g. with typos corrected).
   */
  eknc_query_object_props[PROP_CORRECTED_TERMS] =
    g_param_spec_string ("corrected-terms", "Corrected terms",
      "A version of search-terms with typos, etc corrected",
      "", G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);

  /**
   * EkncQueryObject:stopword-free-terms:
   *
   * A corrected version of the search-terms property with stopword words removed.
   */
  eknc_query_object_props[PROP_STOPWORD_FREE_TERMS] =
    g_param_spec_string ("stopword-free-terms", "Stopword-free terms",
      "A version of search-terms without any stopwords",
      "", G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);

  /**
   * EkncQueryObject:literal-query:
   *
   * For testing. Override the generated query with a literal Xapian query string.
   */
  eknc_query_object_props[PROP_LITERAL_QUERY] =
    g_param_spec_string ("literal-query", "Xapian query",
      "Literal Xapian query",
      "", G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);

  /**
   * EkncQueryObject:mode:
   *
   * The mode of the query, see #EkncQueryObjectMode.
   */
  eknc_query_object_props[PROP_MODE] =
    g_param_spec_enum ("mode", "Mode", "Mode of the query",
      EKNC_TYPE_QUERY_OBJECT_MODE, EKNC_QUERY_OBJECT_MODE_INCREMENTAL,
      G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);

  /**
   * EkncQueryObject:match:
   *
   * What to match against in the source documents, see #EkncQueryObjectMatch.
   */
  eknc_query_object_props[PROP_MATCH] =
    g_param_spec_enum ("match", "Match", "What to match against in the source documents",
      EKNC_TYPE_QUERY_OBJECT_MATCH, EKNC_QUERY_OBJECT_MATCH_ONLY_TITLE,
      G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);

  /**
   * EkncQueryObject:sort:
   *
   * What to sort results by, see #EkncQueryObjectSort.
   */
  eknc_query_object_props[PROP_SORT] =
    g_param_spec_enum ("sort", "Sort", "What to sort-by against in the source documents",
      EKNC_TYPE_QUERY_OBJECT_SORT, EKNC_QUERY_OBJECT_SORT_RELEVANCE,
      G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);

  /**
   * EkncQueryObject:order:
   *
   * Order of results, see #EkncQueryObjectOrder.
   */
  eknc_query_object_props[PROP_ORDER] =
    g_param_spec_enum ("order", "Order", "What order to put results in",
      EKNC_TYPE_QUERY_OBJECT_ORDER, EKNC_QUERY_OBJECT_ORDER_ASCENDING,
      G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);

  /**
   * EkncQueryObject:limit:
   *
   * The maximum number of results to return.
   */
  eknc_query_object_props[PROP_LIMIT] =
    g_param_spec_uint ("limit", "Limit",
      "The maximum number of results to return",
      0, G_MAXUINT, 0, G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);

  /**
   * EkncQueryObject:offset:
   *
   * The number of results to skip, can be use with limit to paginate results.
   */
  eknc_query_object_props[PROP_OFFSET] =
    g_param_spec_uint ("offset", "Offset",
      "Number of results to skip",
      0, G_MAXUINT, 0, G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);

  /**
   * EkncQueryObject:tags-match-all:
   *
   * A list of tags to restrict the search to.
   */
  eknc_query_object_props[PROP_TAGS_MATCH_ALL] =
    g_param_spec_boxed ("tags-match-all", "Tags match all",
      "A list of tags to restrict the search to",
      G_TYPE_STRV,
      G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);

  /**
   * EkncQueryObject:tags-match-any:
   *
   * A list of tags to restrict the search to.
   */
  eknc_query_object_props[PROP_TAGS_MATCH_ANY] =
    g_param_spec_boxed ("tags-match-any", "Tags match any",
      "A list of tags to restrict the search to",
      G_TYPE_STRV,
      G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);

  /**
   * EkncQueryObject:ids:
   *
   * A list of specific ekn ids to limit the search to. Can be used with an
   * empty query to retrieve the given set of ids.
   */
  eknc_query_object_props[PROP_IDS] =
    g_param_spec_boxed ("ids", "Ids",
      "A list of model ids",
      G_TYPE_STRV,
      G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);

  /**
   * EkncQueryObject:excluded-ids:
   *
   * A list of specific ekn ids to exclude from the search.
   */
  eknc_query_object_props[PROP_EXCLUDED_IDS] =
    g_param_spec_boxed ("excluded-ids", "Excluded ids",
      "A list of specific ekn ids to exclude from the search",
      G_TYPE_STRV,
      G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);

  /**
   * EkncQueryObject:excluded-tags:
   *
   * A list of specific ekn tags to exclude from the search.
   */
  eknc_query_object_props[PROP_EXCLUDED_TAGS] =
    g_param_spec_boxed ("excluded-tags", "Excluded tags",
      "A list of specific ekn tags to exclude from the search",
      G_TYPE_STRV,
      G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);

  g_object_class_install_properties (object_class,
                                     NPROPS,
                                     eknc_query_object_props);
}

static void
eknc_query_object_init (EkncQueryObject *self)
{
}

// Returns a newly allocated string with the term parenthesized
static gchar *
parenthesize (const gchar *term)
{
  return g_strdup_printf ("(%s)", term);
}

// Limit term length we sent to xapian
static void
chomp_term (gchar *term)
{
  // Just dupe if the term is short
  if (strlen (term) <= MAX_TERM_LENGTH)
    return;
  // Find the first utf character before our cutoff
  gchar *end = g_utf8_prev_char (term + MAX_TERM_LENGTH + 1);
  *end = '\0';
}

// Sanitize and split terms from a user query
static gchar **
get_terms (const gchar *query)
{
  // Remove any xapian syntax characters, e.g. parenthesis
  g_autoptr(GRegex) syntax_regex = g_regex_new (XAPIAN_SYNTAX_REGEX, 0, 0, NULL);
  g_autofree gchar *without_syntax = g_regex_replace (syntax_regex, query, -1, 0, "", 0, NULL);
  // Lowercase any xapian terms e.g. AND, OR
  g_autoptr(GRegex) term_regex = g_regex_new (XAPIAN_TERM_REGEX, 0, 0, NULL);
  g_autofree gchar *without_terms = g_regex_replace (term_regex, without_syntax, -1, 0, "\\L\\0\\E", 0, NULL);
  // Split the query
  g_autoptr(GRegex) delimiter_regex = g_regex_new (XAPIAN_DELIMITER_REGEX, 0, 0, NULL);
  gchar **terms = g_regex_split (delimiter_regex, without_terms, 0);
  // Chomp the terms
  guint length = g_strv_length (terms);
  for (guint i = 0; i < length; i++)
    {
      chomp_term (terms[i]);
    }
  return terms;
}

// Combines the term with a wild-carded version if search mode is incremental
static gchar *
maybe_add_wildcard (EkncQueryObject *self, gchar *term)
{
  if (self->mode == EKNC_QUERY_OBJECT_MODE_DELIMITED)
    return g_strdup (term);
  g_autofree gchar *with_wildcard = g_strdup_printf ("%s%s%s*", term, XAPIAN_OP_OR, term);
  return parenthesize (with_wildcard);
}

static gchar *
get_exact_title_clause (EkncQueryObject *self, gchar **terms)
{
  g_autofree gchar *joined = g_strjoinv ("_", terms);
  g_autofree gchar *prefixed = g_strconcat (XAPIAN_PREFIX_EXACT_TITLE, joined, NULL);
  return maybe_add_wildcard (self, prefixed);
}

static gchar *
get_title_clause (EkncQueryObject *self,
                  char **terms,
                  char **corrected_terms)
{
  guint terms_length = g_strv_length (terms);
  guint corrected_terms_length = corrected_terms != NULL
                               ? g_strv_length (corrected_terms)
                               : 0;

  guint max_length = MAX (terms_length, corrected_terms_length);

  g_auto(GStrv) title_terms = g_new0 (gchar *, max_length + 1);

  for (guint i = 0; i < max_length; i++)
    {
      g_autofree char *term = NULL;
      if (i < terms_length)
        term = g_strconcat (XAPIAN_PREFIX_TITLE, terms[i], NULL);

      g_autofree char *corrected_term = NULL;
      if (i < corrected_terms_length)
        corrected_term = g_strconcat (XAPIAN_PREFIX_TITLE, corrected_terms[i], NULL);

      /* Discard duplicates */
      if (g_strcmp0 (term, corrected_term) == 0)
        g_clear_pointer (&corrected_term, g_free);

      if (term != NULL && corrected_term != NULL)
        title_terms[i] = g_strdup_printf ("(%s%s%s)", term, XAPIAN_OP_OR, corrected_term);
      else if (term != NULL)
        title_terms[i] = g_steal_pointer (&term);
      else if (corrected_term != NULL)
        title_terms[i] = g_steal_pointer (&corrected_term);
      else
        g_assert_not_reached ();
    }

  return g_strjoinv (" ", title_terms);
}

static gchar *
get_tags_clause (char **tags,
                 char *join_op)
{
  if (tags == NULL)
    return NULL;
  // Tag lists should be joined as a series of individual tag queries joined
  // by with a join operator, so an article that has any of the tags will
  // match, e.g. [foo,bar,baz] => 'K:foo OR K:bar OR K:baz'
  size_t length = g_strv_length (tags);
  g_auto(GStrv) prefixed_tags = g_new0 (gchar *, length + 1);
  for (guint i = 0; i < length; i++)
    prefixed_tags[i] = g_strdup_printf ("%s\"%s\"", XAPIAN_PREFIX_TAG, tags[i]);
  return g_strjoinv (join_op, prefixed_tags);
}

static gchar *
get_ids_clause (char **ids,
                char *join_op)
{
  if (ids == NULL)
    return NULL;
  size_t length = g_strv_length (ids);
  g_auto(GStrv) prefixed_ids = g_new0 (gchar *, length + 1);
  for (guint i = 0; i < length; i++)
    {
      const gchar *hash = eknc_utils_id_get_hash (ids[i]);
      if (hash == NULL)
        {
          g_critical ("Unexpected id structure in query object: %s", ids[i]);
          prefixed_ids[i] = NULL;
        }
      else
        {
          prefixed_ids[i] = g_strdup_printf ("%s%s", XAPIAN_PREFIX_ID, hash);
        }
    }
  return g_strjoinv (join_op, prefixed_ids);
}

static void
consume_clause (GString *parser_string,
                gchar *clause)
{
  if (clause && *clause)
    {
      g_autofree gchar *parenthesized = parenthesize (clause);
      if (*(parser_string->str))
        g_string_append (parser_string, XAPIAN_OP_AND);
      g_string_append (parser_string, parenthesized);
    }
  g_free (clause);
}

/**
 * eknc_query_object_get_tags_match_all:
 * @self: the model
 *
 * Accessor function for #EkncQueryObject:tags-match-all.
 *
 * Returns: (transfer none) (array zero-terminated=1): an array of strings
 */
char * const *
eknc_query_object_get_tags_match_all (EkncQueryObject *self)
{
  g_return_val_if_fail (EKNC_IS_QUERY_OBJECT (self), NULL);
  return self->tags_match_all;
}

/**
 * eknc_query_object_get_tags_match_any:
 * @self: the model
 *
 * Accessor function for #EkncQueryObject:tags-match-any.
 *
 * Returns: (transfer none) (array zero-terminated=1): an array of strings
 */
char * const *
eknc_query_object_get_tags_match_any (EkncQueryObject *self)
{
  g_return_val_if_fail (EKNC_IS_QUERY_OBJECT (self), NULL);
  return self->tags_match_any;
}

/**
 * eknc_query_object_get_ids:
 * @self: the model
 *
 * Accessor function for #EkncQueryObject:ids.
 *
 * Returns: (transfer none) (array zero-terminated=1): an array of strings
 */
char * const *
eknc_query_object_get_ids (EkncQueryObject *self)
{
  g_return_val_if_fail (EKNC_IS_QUERY_OBJECT (self), NULL);
  return self->ids;
}

/**
 * eknc_query_object_get_excluded_ids:
 * @self: the model
 *
 * Accessor function for #EkncQueryObject:excluded-ids.
 *
 * Returns: (transfer none) (array zero-terminated=1): an array of strings
 */
char * const *
eknc_query_object_get_excluded_ids (EkncQueryObject *self)
{
  g_return_val_if_fail (EKNC_IS_QUERY_OBJECT (self), NULL);
  return self->excluded_ids;
}

/**
 * eknc_query_object_get_excluded_tags:
 * @self: the model
 *
 * Accessor function for #EkncQueryObject:excluded-tags.
 *
 * Returns: (transfer none) (array zero-terminated=1): an array of strings
 */
char * const *
eknc_query_object_get_excluded_tags (EkncQueryObject *self)
{
  g_return_val_if_fail (EKNC_IS_QUERY_OBJECT (self), NULL);
  return self->excluded_tags;
}

/**
 * eknc_query_object_get_search_terms:
 * @self: the model
 *
 * Get the search terms set on the object, as typed in by a user.
 *
 * Returns: (transfer none): the search terms as a string
 */
const char *
eknc_query_object_get_search_terms (EkncQueryObject *self)
{
  g_return_val_if_fail (EKNC_IS_QUERY_OBJECT (self), NULL);
  return self->search_terms;
}

/**
 * eknc_query_object_get_corrected_query_string:
 * @self: a #EkncQueryObject
 *
 * Retrieves the query string, including spelling corrections in case
 * the #EkncQueryObject:corrected-terms property is set.
 *
 * If #EkncQueryObject:corrected-terms is unset, this function returns
 * the same string as eknc_query_object_get_query_string().
 *
 * Returns: (transfer full) (nullable): the corrected query string
 */
char *
eknc_query_object_get_corrected_query_string (EkncQueryObject *self)
{
  g_return_val_if_fail (EKNC_IS_QUERY_OBJECT (self), NULL);

  if (self->literal_query != NULL && self->literal_query[0] != '\0')
    return g_strdup (self->literal_query);

  g_auto(GStrv) raw_terms = get_terms (self->search_terms);

  if (g_strv_length (raw_terms) == 0)
    return NULL;

  /* If we only have one character in our search, only look for an exact match.
   * Fancier searching, particularly wildcard search, leads to performance
   * problems.
   */
  if (g_strv_length (raw_terms) == 1 && g_utf8_strlen (raw_terms[0], -1) == 1)
    return g_strconcat (XAPIAN_PREFIX_EXACT_TITLE, raw_terms[0], NULL);

  GString *query_clause = g_string_new (NULL);

  g_autofree char *exact_title_clause = get_exact_title_clause (self, raw_terms);
  g_string_append (query_clause, exact_title_clause);

  /* If we were given a corrected query, use its terms for the rest of the
   * query clause.
   */
  g_auto(GStrv) corrected_terms = NULL;
  if (self->corrected_terms != NULL)
    corrected_terms = get_terms (self->corrected_terms);

  g_autofree char *title_clause = get_title_clause (self, raw_terms, corrected_terms);

  g_string_append (query_clause, XAPIAN_OP_OR);
  g_string_append (query_clause, title_clause);

  if (self->match == EKNC_QUERY_OBJECT_MATCH_TITLE_SYNOPSIS)
    {
      g_autofree char *body_clause = g_strjoinv (" ", raw_terms);

      g_string_append (query_clause, XAPIAN_OP_OR);
      g_string_append (query_clause, body_clause);

      if (corrected_terms != NULL && *corrected_terms[0] != '\0')
        {
          g_autofree char *corrected_body_clause = g_strjoinv (" ", corrected_terms);

          g_string_append (query_clause, XAPIAN_OP_OR);
          g_string_append (query_clause, corrected_body_clause);
        }
    }

  return g_string_free (query_clause, FALSE);
}

/**
 * eknc_query_object_get_query_string:
 * @self: a #EkncQueryObject
 *
 * Retrieves the query string.
 *
 * Returns: (transfer full) (nullable): the query string
 */
char *
eknc_query_object_get_query_string (EkncQueryObject *self)
{
  g_return_val_if_fail (EKNC_IS_QUERY_OBJECT (self), NULL);

  if (self->literal_query != NULL && self->literal_query[0] != '\0')
    return g_strdup (self->literal_query);

  g_auto(GStrv) raw_terms = get_terms (self->search_terms);

  if (g_strv_length (raw_terms) == 0)
    return NULL;

  /* If we only have one character in our search, only look for an exact match.
   * Fancier searching, particularly wildcard search, leads to performance
   * problems.
   */
  if (g_strv_length (raw_terms) == 1 && g_utf8_strlen (raw_terms[0], -1) == 1)
    return g_strconcat (XAPIAN_PREFIX_EXACT_TITLE, raw_terms[0], NULL);

  GString *query_clause = g_string_new (NULL);

  g_autofree char *exact_title_clause = get_exact_title_clause (self, raw_terms);

  g_string_append (query_clause, exact_title_clause);

  g_autofree char *title_clause = get_title_clause (self, raw_terms, NULL);

  g_string_append (query_clause, XAPIAN_OP_OR);
  g_string_append (query_clause, title_clause);

  if (self->match == EKNC_QUERY_OBJECT_MATCH_TITLE_SYNOPSIS)
    {
      g_autofree char *body_clause = g_strjoinv (" ", raw_terms);

      g_string_append (query_clause, XAPIAN_OP_OR);
      g_string_append (query_clause, body_clause);
    }

  return g_string_free (query_clause, FALSE);
}

/**
 * eknc_query_object_get_filter_string:
 * @self: a #EkncQueryObject
 *
 * Retrieves the `filter` string from the object.
 *
 * Returns: (transfer full) (nullable): the filter string
 */
char *
eknc_query_object_get_filter_string (EkncQueryObject *self)
{
  g_return_val_if_fail (EKNC_IS_QUERY_OBJECT (self), NULL);

  GString *filter_string = g_string_new (NULL);

  consume_clause (filter_string, get_tags_clause (self->tags_match_any, XAPIAN_OP_OR));
  consume_clause (filter_string, get_tags_clause (self->tags_match_all, XAPIAN_OP_AND));
  consume_clause (filter_string, get_ids_clause (self->ids, XAPIAN_OP_OR));

  return g_string_free (filter_string, FALSE);
}

/**
 * eknc_query_object_get_filter_out_string:
 * @self: a #EkncQueryObject
 *
 * Retrieves the `filter-out` string from the object.
 *
 * Returns: (transfer full) (nullable): the filter-out string
 */
char *
eknc_query_object_get_filter_out_string (EkncQueryObject *self)
{
  g_return_val_if_fail (EKNC_IS_QUERY_OBJECT (self), NULL);

  GString *filterout_string = g_string_new (NULL);

  consume_clause (filterout_string, get_tags_clause (self->excluded_tags, XAPIAN_OP_OR));
  consume_clause (filterout_string, get_ids_clause (self->excluded_ids, XAPIAN_OP_OR));

  return g_string_free (filterout_string, FALSE);
}

/**
 * eknc_query_object_is_match_all:
 * @self: a #EkncQueryObject
 *
 * Checks whether the object is a query for all results.
 *
 * This function is typically used to retrieve all articles matching to a
 * specific tag.
 *
 * Returns: %TRUE if the object is for matching all results
 */
gboolean
eknc_query_object_is_match_all (EkncQueryObject *self)
{
  g_return_val_if_fail (EKNC_IS_QUERY_OBJECT (self), FALSE);

  return self->search_terms == NULL || self->search_terms[0] == '\0';
}

/**
 * eknc_query_object_get_cutoff:
 * @self: the model
 *
 * Get the xapian cutoff value to be used with the xapian query
 *
 * Returns: the cutoff value
 */
guint
eknc_query_object_get_cutoff (EkncQueryObject *self)
{
  g_return_val_if_fail (EKNC_IS_QUERY_OBJECT (self), 0);

  switch (self->match)
    {
    case EKNC_QUERY_OBJECT_MATCH_TITLE_SYNOPSIS:
      return MATCH_SYNOPSIS_CUTOFF;
      break;

    default:
      return DEFAULT_CUTOFF;
      break;
    }
}

/**
 * eknc_query_object_get_sort_value:
 * @self: the model
 *
 * Get the xapian identifier for the value to sort the query by
 *
 * Returns: the sort value, or -1 if no should be set
 */
gint
eknc_query_object_get_sort_value (EkncQueryObject *self)
{
  g_return_val_if_fail (EKNC_IS_QUERY_OBJECT (self), 0);

  switch (self->sort)
    {
    case EKNC_QUERY_OBJECT_SORT_SEQUENCE_NUMBER:
      return XAPIAN_SEQUENCE_NUMBER_VALUE_NO;
      break;

    case EKNC_QUERY_OBJECT_SORT_DATE:
      return XAPIAN_PUBLISHED_DATE_VALUE_NO;
      break;

    default:
      return -1;
      break;
    }
}

/**
 * eknc_query_object_new_from_object:
 * @source: the query object to copy
 * @first_property_name: name of the first property to set
 * @...: values and names of other properties to set
 *
 * Clone all properties not explicitly set from the source object.
 *
 * Returns: (transfer full): the newly allocated query object
 */
EkncQueryObject *
eknc_query_object_new_from_object (EkncQueryObject *source,
                                   const gchar     *first_property_name,
                                   ...)
{
  g_return_val_if_fail (EKNC_IS_QUERY_OBJECT (source), NULL);

  GParameter params[NPROPS - 1] = {{ NULL, { 0, }}};
  for (guint i = 0; i < NPROPS - 1; i++)
    {
      GParamSpec *pspec = eknc_query_object_props[i + 1];
      params[i].name = g_param_spec_get_name (pspec);
      g_value_init (&params[i].value, pspec->value_type);
      g_object_get_property (G_OBJECT (source), params[i].name, &params[i].value);
    }

  va_list args;
  va_start (args, first_property_name);
  const gchar *name = first_property_name;
  do
    {
      GParamSpec *pspec = NULL;
      GValue *value = NULL;
      for (guint i = 0; i < NPROPS - 1; i++)
        {
          const gchar *prop_name = g_param_spec_get_name (eknc_query_object_props[i + 1]);
          if (strcmp (prop_name, name) != 0)
            continue;
          pspec = eknc_query_object_props[i + 1];
          value = &params[i].value;
          g_value_unset (value);
        }
      if (!pspec)
        {
          g_critical ("Failed to find property: %s", name);
          va_end (args);
          return NULL;
        }

      g_autofree gchar *error = NULL;
      G_VALUE_COLLECT_INIT (value, pspec->value_type, args, 0, &error);
      if (error != NULL)
        {
          g_critical ("Failed to retrieve va_list value: %s", error);
          va_end (args);
          return NULL;
        }
    }
  while ((name = va_arg (args, const gchar *)));
  va_end (args);

G_GNUC_BEGIN_IGNORE_DEPRECATIONS
  GObject *ret = g_object_newv (EKNC_TYPE_QUERY_OBJECT, NPROPS - 1, params);
G_GNUC_END_IGNORE_DEPRECATIONS

  for (guint i = 0; i < NPROPS - 1; i++)
    {
      g_value_unset (&params[i].value);
    }
  return EKNC_QUERY_OBJECT (ret);
}
