/* Copyright 2014  Endless Mobile
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License as
 * published by the Free Software Foundation; either version 2 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

#include "eknc-database-manager-private.h"

#define QUERY_PARAM_CUTOFF "cutoff"
#define QUERY_PARAM_DEFAULT_OP "defaultOp"
#define QUERY_PARAM_FILTER "filter"
#define QUERY_PARAM_FILTER_OUT "filterOut"
#define QUERY_PARAM_FLAGS "flags"
#define QUERY_PARAM_LANG "lang"
#define QUERY_PARAM_LIMIT "limit"
#define QUERY_PARAM_MATCH_ALL "matchAll"
#define QUERY_PARAM_OFFSET "offset"
#define QUERY_PARAM_ORDER "order"
#define QUERY_PARAM_QUERYSTR "q"
#define QUERY_PARAM_SORT_BY "sortBy"

#define PREFIX_METADATA_KEY "XbPrefixes"
#define STOPWORDS_METADATA_KEY "XbStopwords"
#define QUERY_PARSER_FLAGS XAPIAN_QUERY_PARSER_FEATURE_DEFAULT | \
  XAPIAN_QUERY_PARSER_FEATURE_WILDCARD |\
  XAPIAN_QUERY_PARSER_FEATURE_PURE_NOT |\
  XAPIAN_QUERY_PARSER_FEATURE_SPELLING_CORRECTION

G_DEFINE_QUARK (eknc-database-manager-error-quark, eknc_database_manager_error)

typedef struct {
  /* string lang_name => object XapianStem */
  GHashTable *stemmers;

  char *manifest_path;

  XapianQueryParser *query_parser;
  XapianDatabase *database;
} EkncDatabaseManagerPrivate;

struct _EkncDatabaseManager {
  GObject parent_class;
};

enum {
  PROP_MANIFEST_PATH = 1,

  N_PROPS
};

static GParamSpec *eknc_database_manager_properties[N_PROPS];

G_DEFINE_TYPE_WITH_PRIVATE (EkncDatabaseManager, eknc_database_manager, G_TYPE_OBJECT)

/* Registers the prefixes and booleanPrefixes contained in the JSON object
 * to the query parser.
 */
static void
eknc_database_manager_add_queryparser_prefixes (EkncDatabaseManager *self,
                                                JsonObject *object)
{
  EkncDatabaseManagerPrivate *priv = eknc_database_manager_get_instance_private (self);
  JsonNode *element_node;
  JsonObject *element_object;
  JsonArray *array;
  GList *elements, *l;

  array = json_object_get_array_member (object, "prefixes");
  elements = json_array_get_elements (array);

  for (l = elements; l != NULL; l = l->next)
    {
      element_node = l->data;
      element_object = json_node_get_object (element_node);

      xapian_query_parser_add_prefix (priv->query_parser,
                                      json_object_get_string_member (element_object, "field"),
                                      json_object_get_string_member (element_object, "prefix"));
    }

  g_list_free (elements);

  array = json_object_get_array_member (object, "booleanPrefixes");
  elements = json_array_get_elements (array);

  for (l = elements; l != NULL; l = l->next)
    {
      element_node = l->data;
      element_object = json_node_get_object (element_node);

      xapian_query_parser_add_boolean_prefix (priv->query_parser,
                                              json_object_get_string_member (element_object, "field"),
                                              json_object_get_string_member (element_object, "prefix"),
                                              FALSE);
    }

  g_list_free (elements);
}

static void
eknc_database_manager_add_queryparser_standard_prefixes (EkncDatabaseManager *self)
{
  static const struct {
    const gchar *field;
    const gchar *prefix;
  } standard_prefixes[] = {
    { "title", "S" },
    { "exact_title", "XEXACTS" },
  }, standard_boolean_prefixes[] = {
    { "tag", "K" },
    { "id", "Q" },
  };

  EkncDatabaseManagerPrivate *priv = eknc_database_manager_get_instance_private (self);

  int idx;

  for (idx = 0; idx < G_N_ELEMENTS (standard_prefixes); idx++)
    xapian_query_parser_add_prefix (priv->query_parser,
                                    standard_prefixes[idx].field,
                                    standard_prefixes[idx].prefix);

  for (idx = 0; idx < G_N_ELEMENTS (standard_boolean_prefixes); idx++)
    xapian_query_parser_add_boolean_prefix (priv->query_parser,
                                            standard_boolean_prefixes[idx].field,
                                            standard_boolean_prefixes[idx].prefix,
                                            FALSE);
}

static void
eknc_database_manager_set_property (GObject *gobject,
                                    guint prop_id,
                                    const GValue *value,
                                    GParamSpec *pspec)
{
  EkncDatabaseManager *self = EKNC_DATABASE_MANAGER (gobject);
  EkncDatabaseManagerPrivate *priv = eknc_database_manager_get_instance_private (self);

  switch (prop_id)
    {
    case PROP_MANIFEST_PATH:
      g_free (priv->manifest_path);
      priv->manifest_path = g_value_dup_string (value);
      break;

    default:
      G_OBJECT_WARN_INVALID_PROPERTY_ID (gobject, prop_id, pspec);
    }
}

static void
eknc_database_manager_get_property (GObject *gobject,
                                    guint prop_id,
                                    GValue *value,
                                    GParamSpec *pspec)
{
  EkncDatabaseManager *self = EKNC_DATABASE_MANAGER (gobject);
  EkncDatabaseManagerPrivate *priv = eknc_database_manager_get_instance_private (self);

  switch (prop_id)
    {
    case PROP_MANIFEST_PATH:
      g_value_set_string (value, priv->manifest_path);
      break;

    default:
      G_OBJECT_WARN_INVALID_PROPERTY_ID (gobject, prop_id, pspec);
    }
}

static void
eknc_database_manager_finalize (GObject *object)
{
  EkncDatabaseManager *self = EKNC_DATABASE_MANAGER (object);
  EkncDatabaseManagerPrivate *priv = eknc_database_manager_get_instance_private (self);

  g_free (priv->manifest_path);

  g_clear_object (&priv->database);
  g_clear_object (&priv->query_parser);

  g_clear_pointer (&priv->stemmers, g_hash_table_unref);

  G_OBJECT_CLASS (eknc_database_manager_parent_class)->finalize (object);
}

static void
eknc_database_manager_class_init (EkncDatabaseManagerClass *klass)
{
  GObjectClass *gobject_class = (GObjectClass *)klass;

  gobject_class->set_property = eknc_database_manager_set_property;
  gobject_class->get_property = eknc_database_manager_get_property;
  gobject_class->finalize = eknc_database_manager_finalize;

  eknc_database_manager_properties[PROP_MANIFEST_PATH] =
    g_param_spec_string ("manifest-path", "Manifest Path", "The path to the database manifest",
                         NULL,
                         G_PARAM_READWRITE |
                         G_PARAM_CONSTRUCT_ONLY |
                         G_PARAM_STATIC_STRINGS);

  g_object_class_install_properties (gobject_class, N_PROPS, eknc_database_manager_properties);
}

static void
eknc_database_manager_init (EkncDatabaseManager *self)
{
  EkncDatabaseManagerPrivate *priv = eknc_database_manager_get_instance_private (self);

  priv->stemmers = g_hash_table_new_full (g_str_hash, g_str_equal, g_free, g_object_unref);
  g_hash_table_insert (priv->stemmers, g_strdup ("none"), xapian_stem_new ());
}

static gboolean
eknc_database_manager_register_prefixes (EkncDatabaseManager *self,
                                         GError **error_out)
{
  EkncDatabaseManagerPrivate *priv = eknc_database_manager_get_instance_private (self);
  GError *error = NULL;
  JsonNode *root;
  gboolean ret = FALSE;

  /* Attempt to read the database's custom prefix association metadata */
  g_autofree char *metadata_json =
    xapian_database_get_metadata (priv->database, PREFIX_METADATA_KEY, &error);

  if (error != NULL)
    {
      eknc_database_manager_add_queryparser_standard_prefixes (self);
      g_propagate_error (error_out, error);
      return FALSE;
    }

  g_autoptr(JsonParser) parser = json_parser_new_immutable ();
  json_parser_load_from_data (parser, metadata_json, -1, &error);
  if (error != NULL)
    {
      eknc_database_manager_add_queryparser_standard_prefixes (self);
      g_propagate_error (error_out, error);
      return FALSE;
    }

  root = json_parser_get_root (parser);
  if (root != NULL)
    eknc_database_manager_add_queryparser_prefixes (self, json_node_get_object (root));
  else
    eknc_database_manager_add_queryparser_standard_prefixes (self);

  return TRUE;
}

static gboolean
eknc_database_manager_register_stopwords (EkncDatabaseManager *self,
                                          GError **error_out)
{
  EkncDatabaseManagerPrivate *priv = eknc_database_manager_get_instance_private (self);
  GError *error = NULL;

  g_autofree char *stopwords_json =
    xapian_database_get_metadata (priv->database, STOPWORDS_METADATA_KEY, &error);

  if (error != NULL)
    {
      g_propagate_error (error_out, error);
      return FALSE;
    }

  g_autoptr(JsonParser) parser = json_parser_new_immutable ();
  json_parser_load_from_data (parser, stopwords_json, -1, &error);

  if (error != NULL)
    {
      g_propagate_error (error_out, error);
      return FALSE;
    }

  /* empty JSON is not an error */
  JsonNode *node = json_parser_get_root (parser);
  if (node == NULL)
    return TRUE;

  JsonArray *array = json_node_get_array (node);
  GList *elements = json_array_get_elements (array);

  g_autoptr(XapianSimpleStopper) stopper = xapian_simple_stopper_new ();

  for (GList *l = elements; l != NULL; l = l->next)
    {
      const char *stopword = json_node_get_string (l->data);

      /* In older databases, each stopword had a newline appended.
       * This has now been fixed, but to avoid having to rebuild
       * everything, we check for and remove such newlines.
       */
      if (g_str_has_suffix (stopword, "\n"))
        {
          g_autofree char *stopword_chomped = g_strdup (stopword);

          g_strchomp (stopword_chomped);

          xapian_simple_stopper_add (stopper, stopword_chomped);
        }
      else
        {
          xapian_simple_stopper_add (stopper, stopword);
        }
    }

  g_list_free (elements);

  xapian_query_parser_set_stopper (priv->query_parser, XAPIAN_STOPPER (stopper));

  return TRUE;
}

static XapianDatabase *
create_database_from_manifest (const char  *manifest_path,
                               GError     **error_out)
{
  GError *error = NULL;

  g_autoptr(JsonParser) parser = json_parser_new_immutable ();
  if (!json_parser_load_from_file (parser, manifest_path, &error))
    {
      g_propagate_error (error_out, error);
      return NULL;
    }

  XapianDatabase *db = xapian_database_new (&error);
  if (error != NULL)
    {
      g_propagate_error (error_out, error);
      return NULL;
    }

  JsonNode *node = json_parser_get_root (parser);
  JsonObject *json_manifest = json_node_get_object (node);
  JsonArray *json_dbs = json_object_get_array_member (json_manifest, "xapian_databases");

  g_autofree char *manifest_dir_path = g_path_get_dirname (manifest_path);

  GList *dbs = json_array_get_elements (json_dbs);

  for (GList *l = dbs; l != NULL; l = l->next)
    {
      JsonObject *json_db = json_node_get_object (l->data);

      guint64 db_offset = json_object_get_int_member (json_db, "offset");

      const char *relpath = json_object_get_string_member (json_db, "path");
      g_autofree char *db_path = g_build_filename (manifest_dir_path, relpath, NULL);

      g_autoptr(XapianDatabase) internal_db =
        g_initable_new (XAPIAN_TYPE_DATABASE,
                        NULL, &error,
                        "path", db_path,
                        "offset", db_offset,
                        NULL);

      if (error != NULL)
        {
          g_propagate_error (error_out, error);
          g_clear_object (&db);
          break;
        }

      xapian_database_add_database (db, internal_db);
    }

  g_list_free (dbs);

  return db;
}

static char *
read_link (const char *path)
{
  char *resolved_path = g_file_read_link (path, NULL);
  if (resolved_path != NULL)
    return resolved_path;
  else
    return g_strdup (path);
}

/* Creates a new XapianDatabase for the given path, and indexes it by path,
 * overwriting any existing database with the same name.
 */
static gboolean
eknc_database_manager_create_db_internal (EkncDatabaseManager *self,
                                          const char *path,
                                          GError **error_out)
{
  EkncDatabaseManagerPrivate *priv = eknc_database_manager_get_instance_private (self);

  GError *error = NULL;

  priv->database = create_database_from_manifest (path, &error);
  if (error != NULL)
    {
      g_set_error (error_out, EKNC_DATABASE_MANAGER_ERROR,
                   EKNC_DATABASE_MANAGER_ERROR_INVALID_PATH,
                   "Cannot create XapianDatabase for path %s: %s",
                   path, error->message);
      g_error_free (error);
      return FALSE;
    }

  /* Create a XapianQueryParser for this particular database, stemming
   * by its registered language
   */
  priv->query_parser = xapian_query_parser_new ();
  xapian_query_parser_set_database (priv->query_parser, priv->database);

  if (!eknc_database_manager_register_prefixes (self, &error))
    {
      /* Non-fatal */
      g_warning ("Could not register prefixes for database %s: %s",
                 path, error->message);
      g_clear_error (&error);
    }

  if (!eknc_database_manager_register_stopwords (self, &error))
    {
      /* Non-fatal */
      g_warning ("Could not add stop words for database %s: %s.",
                 path, error->message);
      g_clear_error (&error);
    }

  return TRUE;
}

static gboolean
ensure_db (EkncDatabaseManager *self,
           GError **error_out)
{
  EkncDatabaseManagerPrivate *priv = eknc_database_manager_get_instance_private (self);

  if (priv->database != NULL)
    return TRUE;

  g_autofree char *path = read_link (priv->manifest_path);

  return eknc_database_manager_create_db_internal (self, path, error_out);
}

static XapianMSet *
eknc_database_manager_fetch_results (EkncDatabaseManager *self,
                                     XapianEnquire *enquire,
                                     XapianQuery *query,
                                     guint offset,
                                     guint limit,
                                     GError **error_out)
{
  GError *error = NULL;

  xapian_enquire_set_query (enquire, query, xapian_query_get_length (query));

  XapianMSet *matches = xapian_enquire_get_mset (enquire, offset, limit, &error);
  if (error != NULL)
    {
      g_propagate_error (error_out, error);
      return NULL;
    }

  return matches;
}

/* Checks if the given database is empty (has no documents). Empty databases
 * cause problems with XapianEnquire, so we need to assert that a db isn't empty
 * before making a XapianEnquire for it.
 */
static gboolean
database_is_empty (XapianDatabase *db)
{
  return xapian_database_get_doc_count (db) == 0;
}

static gboolean
parse_default_op (XapianQueryParser *qp,
                  const gchar *str,
                  GError **error)
{
  XapianQueryOp op;

  if (g_str_equal (str, "and"))
    {
      op = XAPIAN_QUERY_OP_AND;
    }
  else if (g_str_equal (str, "or"))
    {
      op = XAPIAN_QUERY_OP_OR;
    }
  else if (g_str_equal (str, "near"))
    {
      op = XAPIAN_QUERY_OP_NEAR;
    }
  else if (g_str_equal (str, "phrase"))
    {
      op = XAPIAN_QUERY_OP_PHRASE;
    }
  else if (g_str_equal (str, "elite-set"))
    {
      op = XAPIAN_QUERY_OP_ELITE_SET;
    }
  else if (g_str_equal (str, "synonym"))
    {
      op = XAPIAN_QUERY_OP_SYNONYM;
    }
  else if (g_str_equal (str, "max"))
    {
#ifdef XAPIAN_QUERY_OP_MAX
      op = XAPIAN_QUERY_OP_MAX;
#else
      // Not wrapped by older xapian-glib.
      g_set_error (error, EKNC_DATABASE_MANAGER_ERROR,
                   EKNC_DATABASE_MANAGER_ERROR_INVALID_PARAMS,
                   "defaultOp value 'max' not supported by xapian-glib in use.");
      return FALSE;
#endif
    }
  else
    {
      g_set_error (error, EKNC_DATABASE_MANAGER_ERROR,
                   EKNC_DATABASE_MANAGER_ERROR_INVALID_PARAMS,
                   "defaultOp parameter must be \"and\", \"or\", \"near\", \"phrase\", \"elite-set\", \"synonym\" or \"max\".");
      return FALSE;
    }

  xapian_query_parser_set_default_op (qp, op);

  return TRUE;
}

static gboolean
parse_query_flags (const gchar *str,
                   XapianQueryParserFeature *flags_ptr,
                   GError **error)
{
  XapianQueryParserFeature flags = 0;

  g_auto(GStrv) v = g_strsplit (str, ",", -1);

  char **iter;

  for (iter = v; *iter != NULL; iter++)
    {
      if (g_str_equal (*iter, "boolean"))
        {
          flags |= XAPIAN_QUERY_PARSER_FEATURE_BOOLEAN;
        }
      else if (g_str_equal (*iter, "phrase"))
        {
          flags |= XAPIAN_QUERY_PARSER_FEATURE_PHRASE;
        }
      else if (g_str_equal (*iter, "lovehate"))
        {
          flags |= XAPIAN_QUERY_PARSER_FEATURE_LOVEHATE;
        }
      else if (g_str_equal (*iter, "boolean-any-case"))
        {
          flags |= XAPIAN_QUERY_PARSER_FEATURE_BOOLEAN_ANY_CASE;
        }
      else if (g_str_equal (*iter, "wildcard"))
        {
          flags |= XAPIAN_QUERY_PARSER_FEATURE_WILDCARD;
        }
      else if (g_str_equal (*iter, "pure-not"))
        {
          flags |= XAPIAN_QUERY_PARSER_FEATURE_PURE_NOT;
        }
      else if (g_str_equal (*iter, "partial"))
        {
          flags |= XAPIAN_QUERY_PARSER_FEATURE_PARTIAL;
        }
      else if (g_str_equal (*iter, "spelling-correction"))
        {
          flags |= XAPIAN_QUERY_PARSER_FEATURE_SPELLING_CORRECTION;
        }
      else if (g_str_equal (*iter, "synonym"))
        {
          flags |= XAPIAN_QUERY_PARSER_FEATURE_SYNONYM;
        }
      else if (g_str_equal (*iter, "auto-synonyms"))
        {
          flags |= XAPIAN_QUERY_PARSER_FEATURE_AUTO_SYNONYMS;
        }
      else if (g_str_equal (*iter, "auto-multiword-synonyms"))
        {
          flags |= XAPIAN_QUERY_PARSER_FEATURE_AUTO_MULTIWORD_SYNONYMS;
        }
      else if (g_str_equal (*iter, "cjk-ngram"))
        {
#ifdef XAPIAN_QUERY_PARSER_FEATURE_CJK_NGRAM
          flags |= XAPIAN_QUERY_PARSER_FEATURE_CJK_NGRAM;
#else
          /* Not wrapped by older xapian-glib. */
          g_set_error (error, EKNC_DATABASE_MANAGER_ERROR,
                       EKNC_DATABASE_MANAGER_ERROR_INVALID_PARAMS,
                       "Query parser flag 'cjk-ngram' not supported by xapian-glib in use.");
          return FALSE;
#endif
        }
      else if (g_str_equal (*iter, "default"))
        {
          flags |= XAPIAN_QUERY_PARSER_FEATURE_DEFAULT;
        }
      else
        {
          g_set_error (error, EKNC_DATABASE_MANAGER_ERROR,
                       EKNC_DATABASE_MANAGER_ERROR_INVALID_PARAMS,
                       "Unknown query parser flag.");
          return FALSE;
        }
    }

  *flags_ptr = flags;

  return TRUE;
}

static gboolean
eknc_database_manager_fix_query_internal (EkncDatabaseManager *self,
                                          const char *query_str,
                                          GHashTable *query_options,
                                          char **stop_fixed_query_out,
                                          char **spell_fixed_query_out,
                                          GError **error_out)
{
  EkncDatabaseManagerPrivate *priv = eknc_database_manager_get_instance_private (self);
  GError *error = NULL;
  const char *match_all;
  const char *default_op;
  const char *flags_str;
  XapianQueryParserFeature flags = QUERY_PARSER_FLAGS;
  XapianStopper *stopper;

  match_all = g_hash_table_lookup (query_options, QUERY_PARAM_MATCH_ALL);

  stopper = xapian_query_parser_get_stopper (priv->query_parser);

  if (query_str == NULL || match_all != NULL)
    {
      g_set_error (error_out, EKNC_DATABASE_MANAGER_ERROR,
                  EKNC_DATABASE_MANAGER_ERROR_INVALID_PARAMS,
                  "Query parameter must be set, and must not be match all.");
      return FALSE;
    }

  if (stopper != NULL && stop_fixed_query_out != NULL)
    {
      g_auto(GStrv) words = g_strsplit (query_str, " ", -1);

      /* This is not a GStrv, as we don't copy the words, just their pointer */
      g_autofree char **filtered_words = g_new0 (char *, g_strv_length (words) + 1);

      char **filtered_iter = filtered_words;
      char **words_iter;

      for (words_iter = words; *words_iter != NULL; words_iter++)
        {
          if (!xapian_stopper_is_stop_term (stopper, *words_iter))
            *filtered_iter++ = *words_iter;
        }

      *stop_fixed_query_out = g_strjoinv (" ", filtered_words);
    }

  default_op = g_hash_table_lookup (query_options, QUERY_PARAM_DEFAULT_OP);
  if (default_op != NULL && !parse_default_op (priv->query_parser, default_op, error_out))
    return FALSE;

  flags_str = g_hash_table_lookup (query_options, QUERY_PARAM_FLAGS);
  if (flags_str != NULL && !parse_query_flags (flags_str, &flags, error_out))
    return FALSE;

  /* Parse the user's query so we can request a spelling correction. */
  xapian_query_parser_parse_query_full (priv->query_parser,
                                        query_str != NULL ? query_str : "",
                                        flags, "",
                                        &error);
  if (error != NULL)
    {
      g_propagate_error (error_out, error);
      return FALSE;
    }

  if (spell_fixed_query_out != NULL)
    *spell_fixed_query_out = xapian_query_parser_get_corrected_query_string (priv->query_parser);

  g_debug (G_STRLOC ":\n"
           " - query: '%s'\n"
           " - stop_fixed_query: '%s'\n"
           " - spell_fixed_query: '%s'",
           query_str ? query_str : "<none>",
           *stop_fixed_query_out != NULL ? *stop_fixed_query_out : "<ignored>",
           *spell_fixed_query_out != NULL ? *spell_fixed_query_out : "<ignored>");

  return TRUE;
}

gboolean
eknc_database_manager_fix_query (EkncDatabaseManager *self,
                                 const char *query,
                                 GHashTable *params,
                                 char **stop_fixed_query,
                                 char **spell_fixed_query,
                                 GError **error_out)
{
  g_return_val_if_fail (EKNC_IS_DATABASE_MANAGER (self), FALSE);

  if (!ensure_db (self, error_out))
    return FALSE;

  return eknc_database_manager_fix_query_internal (self, query,
                                                   params,
                                                   stop_fixed_query,
                                                   spell_fixed_query,
                                                   error_out);
}

/* If a database exists, queries it with the following options:
 *   - collapse: see http://xapian.org/docs/collapsing.html
 *   - cutoff: percent between (0, 100) for the XapianEnquire cutoff parameter
 *   - limit: max number of results to return
 *   - offset: offset from which to start returning results
 *   - order: if sortBy is specified, either "desc" or "asc" (resp. "descending"
 *            and "ascending"
 *   - q: querystring that's parseable by a XapianQueryParser
 *   - sortBy: field to sort the results on
 *   - defaultOp: default operator to use when parsing q ("and", "or", "near",
 *     "phrase", "elite-set" or "synonym"; if not specified the default is
 *     "or")
 */
static XapianMSet *
eknc_database_manager_query_internal (EkncDatabaseManager *self,
                                      const char *query_str,
                                      GHashTable *query_options,
                                      GError **error_out)
{
  EkncDatabaseManagerPrivate *priv = eknc_database_manager_get_instance_private (self);
  XapianQueryParserFeature flags = QUERY_PARSER_FLAGS;
  GError *error = NULL;

  if (database_is_empty (priv->database))
    {
      g_set_error (error_out, EKNC_DATABASE_MANAGER_ERROR,
                   EKNC_DATABASE_MANAGER_ERROR_NOT_FOUND,
                   "Empty database found");
      return NULL;
    }

  const char *lang = g_hash_table_lookup (query_options, QUERY_PARAM_LANG);
  if (lang == NULL)
    lang = "none";

  XapianStem *stem = g_hash_table_lookup (priv->stemmers, lang);
  if (stem == NULL)
    {
      stem = xapian_stem_new_for_language (lang, &error);
      if (error != NULL)
        {
          g_warning ("Cannot create XapianStem for language %s: %s",
                     lang, error->message);
          g_clear_error (&error);

          stem = g_hash_table_lookup (priv->stemmers, "none");
        }
      else
        {
          g_hash_table_insert (priv->stemmers, g_strdup (lang), stem);
        }
    }

  g_assert (stem != NULL);

  xapian_query_parser_set_stemmer (priv->query_parser, stem);
  xapian_query_parser_set_stemming_strategy (priv->query_parser, XAPIAN_STEM_STRATEGY_STEM_SOME);

  g_autoptr(XapianEnquire) enquire = xapian_enquire_new (priv->database, &error);
  if (error != NULL)
    {
      g_propagate_error (error_out, error);
      return NULL;
    }

  g_debug (G_STRLOC ": Query: '%s'", query_str);

  g_autoptr(XapianQuery) parsed_query = NULL;

  const char *match_all = g_hash_table_lookup (query_options, QUERY_PARAM_MATCH_ALL);
  if (match_all != NULL && query_str == NULL)
    {
      /* Handled below. */
    }
  else if (query_str != NULL && match_all == NULL)
    {
      const char *default_op = g_hash_table_lookup (query_options, QUERY_PARAM_DEFAULT_OP);
      if (default_op != NULL && !parse_default_op (priv->query_parser, default_op, error_out))
        return NULL;

      const char *flags_str = g_hash_table_lookup (query_options, QUERY_PARAM_FLAGS);
      if (flags_str != NULL && !parse_query_flags (flags_str, &flags, error_out))
        return NULL;

      parsed_query = xapian_query_parser_parse_query_full (priv->query_parser,
                                                           query_str,
                                                           flags, "",
                                                           &error);

      if (error != NULL)
        {
          g_propagate_error (error_out, error);
          return NULL;
        }
    }
  else
    {
      g_set_error (error_out, EKNC_DATABASE_MANAGER_ERROR,
                  EKNC_DATABASE_MANAGER_ERROR_INVALID_PARAMS,
                  "Exactly one of query parameter or match all parameter is required.");
      return NULL;
    }

  /* Parse the filters (if any) and combine. */
  const char *filter_str = g_hash_table_lookup (query_options, QUERY_PARAM_FILTER);
  if (filter_str != NULL)
    {
      g_autoptr(XapianQuery) filter_query =
        xapian_query_parser_parse_query_full (priv->query_parser,
                                              filter_str,
                                              XAPIAN_QUERY_PARSER_FEATURE_DEFAULT,
                                              "", &error);
      if (error != NULL)
        {
          g_propagate_error (error_out, error);
          return NULL;
        }

      if (parsed_query == NULL)
        {
          /* match_all */
          parsed_query = g_steal_pointer (&filter_query);
        }
      else
        {
          g_autoptr(XapianQuery) full_query =
            xapian_query_new_for_pair (XAPIAN_QUERY_OP_FILTER, parsed_query, filter_query);

          g_object_unref (parsed_query);
          parsed_query = g_steal_pointer (&full_query);
        }
    }
  else if (parsed_query == NULL)
    {
      parsed_query = xapian_query_new_match_all ();
    }

  const char *filterout_str = g_hash_table_lookup (query_options, QUERY_PARAM_FILTER_OUT);
  if (filterout_str != NULL)
    {
      g_autoptr(XapianQuery) filterout_query =
        xapian_query_parser_parse_query_full (priv->query_parser,
                                              filterout_str,
                                              XAPIAN_QUERY_PARSER_FEATURE_DEFAULT,
                                              "",
                                              &error);
      if (error != NULL)
        {
          g_propagate_error (error_out, error);
          return NULL;
        }

      g_autoptr(XapianQuery) full_query =
        xapian_query_new_for_pair (XAPIAN_QUERY_OP_AND_NOT,
                                   parsed_query,
                                   filterout_query);

      g_object_unref (parsed_query);
      parsed_query = g_steal_pointer (&full_query);
    }

  const char *sort_str = g_hash_table_lookup (query_options, QUERY_PARAM_SORT_BY);
  if (sort_str != NULL)
    {
      gboolean reverse_order;
      const gchar *order;

      order = g_hash_table_lookup (query_options, QUERY_PARAM_ORDER);
      reverse_order = (g_strcmp0 (order, "desc") == 0);
      xapian_enquire_set_sort_by_value (enquire,
                                        CLAMP (g_ascii_strtod (sort_str, NULL), 0, G_MAXUINT),
                                        reverse_order);
    }
  else
    {
      const char *cutoff_str = g_hash_table_lookup (query_options, QUERY_PARAM_CUTOFF);
      if (cutoff_str != NULL)
        xapian_enquire_set_cutoff (enquire, CLAMP (g_ascii_strtod (cutoff_str, NULL), 0, G_MAXUINT));
    }

  guint limit, offset;
  const char *offset_str = g_hash_table_lookup (query_options, QUERY_PARAM_OFFSET);
  if (offset_str == NULL)
    {
      g_set_error_literal (error_out, EKNC_DATABASE_MANAGER_ERROR,
                           EKNC_DATABASE_MANAGER_ERROR_INVALID_PARAMS,
                           "Offset parameter is required for the query");
      return NULL;
    }

  offset = CLAMP (g_ascii_strtod (offset_str, NULL), 0, G_MAXUINT);

  const char *limit_str = g_hash_table_lookup (query_options, QUERY_PARAM_LIMIT);
  if (limit_str == NULL)
    {
      g_set_error_literal (error_out, EKNC_DATABASE_MANAGER_ERROR,
                           EKNC_DATABASE_MANAGER_ERROR_INVALID_PARAMS,
                           "Limit parameter is required for the query");
      return NULL;
    }

  /* str may contain a negative value to mean "all matching results"; since
   * casting a negative floating point value into an unsigned integer is
   * undefined behavior, we need to perform some level of validation first
   */
  double val = g_ascii_strtod (limit_str, NULL);

  /* Allow negative values to mean "all results" */
  if (val < 0)
    limit = G_MAXUINT;
  else
    limit = CLAMP (val, 0, G_MAXUINT);

  return eknc_database_manager_fetch_results (self, enquire,
                                              parsed_query,
                                              offset, limit,
                                              error_out);
}

XapianMSet *
eknc_database_manager_query (EkncDatabaseManager *self,
                             const char *query,
                             GHashTable *params,
                             GError **error_out)
{
  g_return_val_if_fail (EKNC_IS_DATABASE_MANAGER (self), NULL);

  if (!ensure_db (self, error_out))
    return NULL;

  return eknc_database_manager_query_internal (self, query, params, error_out);
}

EkncDatabaseManager *
eknc_database_manager_new (const char *path)
{
  return g_object_new (EKNC_TYPE_DATABASE_MANAGER,
                       "manifest-path", path,
                       NULL);
}
