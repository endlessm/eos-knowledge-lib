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

#define QUERY_PARAM_COLLAPSE_KEY "collapse"
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

#define QUERY_RESULTS_MEMBER_NUM_RESULTS "numResults"
#define QUERY_RESULTS_MEMBER_OFFSET "offset"
#define QUERY_RESULTS_MEMBER_QUERYSTR "query"
#define QUERY_RESULTS_MEMBER_RESULTS "results"
#define QUERY_RESULTS_MEMBER_UPPER_BOUND "upperBound"

#define FIX_RESULTS_MEMBER_SPELL_CORRECTED_RESULT "spellCorrectedQuery"
#define FIX_RESULTS_MEMBER_STOP_WORD_CORRECTED_RESULT "stopWordCorrectedQuery"

#define PREFIX_METADATA_KEY "XbPrefixes"
#define STOPWORDS_METADATA_KEY "XbStopwords"
#define QUERY_PARSER_FLAGS XAPIAN_QUERY_PARSER_FEATURE_DEFAULT | \
  XAPIAN_QUERY_PARSER_FEATURE_WILDCARD |\
  XAPIAN_QUERY_PARSER_FEATURE_PURE_NOT |\
  XAPIAN_QUERY_PARSER_FEATURE_SPELLING_CORRECTION

G_DEFINE_QUARK (eknc-database-manager-error-quark, eknc_database_manager_error)

typedef struct {
  XapianDatabase *db;
  XapianQueryParser *qp;
  EkncDatabaseManager *manager;
  char *path;
} DatabasePayload;

static void
database_payload_free (DatabasePayload *payload)
{
  g_clear_object (&payload->db);
  g_clear_object (&payload->qp);

  g_free (payload->path);

  g_slice_free (DatabasePayload, payload);
}

static DatabasePayload *
database_payload_new (XapianDatabase *db,
                      XapianQueryParser *qp,
                      EkncDatabaseManager *manager,
                      const char *path)
{
  DatabasePayload *payload;

  payload = g_slice_new0 (DatabasePayload);
  payload->db = g_object_ref (db);
  payload->qp = g_object_ref (qp);
  payload->manager = manager;
  payload->path = g_strdup (path);

  return payload;
}

typedef struct {
  /* string path => struct DatabasePayload */
  GHashTable *databases;
  /* string lang_name => object XapianStem */
  GHashTable *stemmers;

  char *manifest_path;
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
                                                XapianQueryParser *query_parser,
                                                JsonObject *object)
{
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
      xapian_query_parser_add_prefix (query_parser,
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
      xapian_query_parser_add_boolean_prefix (query_parser,
                                              json_object_get_string_member (element_object, "field"),
                                              json_object_get_string_member (element_object, "prefix"),
                                              FALSE);
    }

  g_list_free (elements);
}

static void
eknc_database_manager_add_queryparser_standard_prefixes (EkncDatabaseManager *self,
                                                         XapianQueryParser *query_parser)
{
  /* TODO: these should be configurable */
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
  gint idx;

  for (idx = 0; idx < G_N_ELEMENTS (standard_prefixes); idx++)
    xapian_query_parser_add_prefix (query_parser,
                                    standard_prefixes[idx].field,
                                    standard_prefixes[idx].prefix);

  for (idx = 0; idx < G_N_ELEMENTS (standard_boolean_prefixes); idx++)
    xapian_query_parser_add_boolean_prefix (query_parser,
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

  g_clear_pointer (&priv->databases, g_hash_table_unref);
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

  priv->databases = g_hash_table_new_full (g_str_hash, g_str_equal,
                                           g_free,
                                           (GDestroyNotify) database_payload_free);
}

static gboolean
eknc_database_manager_register_prefixes (EkncDatabaseManager *self,
                                         XapianDatabase *db,
                                         XapianQueryParser *query_parser,
                                         GError **error_out)
{
  gchar *metadata_json;
  GError *error = NULL;
  JsonParser *parser = NULL;
  JsonNode *root;
  gboolean ret = FALSE;

  /* Attempt to read the database's custom prefix association metadata */
  metadata_json = xapian_database_get_metadata (db, PREFIX_METADATA_KEY, &error);
  if (error != NULL)
    {
      g_propagate_error (error_out, error);
      goto out;
    }

  parser = json_parser_new ();
  json_parser_load_from_data (parser, metadata_json, -1, &error);
  if (error != NULL)
    {
      g_propagate_error (error_out, error);
      goto out;
    }

  root = json_parser_get_root (parser);
  if (root != NULL)
    eknc_database_manager_add_queryparser_prefixes (self, query_parser,
                                                  json_node_get_object (root));

  ret = TRUE;

 out:
  /* If there was an error, just use the "standard" prefix map */
  if (error != NULL)
    eknc_database_manager_add_queryparser_standard_prefixes (self, query_parser);

  g_clear_error (&error);
  g_clear_object (&parser);
  g_free (metadata_json);
  return ret;
}

static gboolean
eknc_database_manager_register_stopwords (EkncDatabaseManager *self,
                                          XapianDatabase *db,
                                          XapianQueryParser *query_parser,
                                          GError **error_out)
{
  XapianSimpleStopper *stopper;
  gchar *stopwords_json;
  GError *error = NULL;
  JsonParser *parser;
  JsonNode *node;
  JsonArray *array;
  GList *elements, *l;
  const gchar *stopword;
  gchar *stopword_chomped;

  stopwords_json = xapian_database_get_metadata (db, STOPWORDS_METADATA_KEY, &error);
  if (error != NULL)
    {
      g_propagate_error (error_out, error);
      return FALSE;
    }

  parser = json_parser_new ();
  json_parser_load_from_data (parser, stopwords_json, -1, &error);
  if (error != NULL)
    {
      g_propagate_error (error_out, error);
      g_object_unref (parser);
      return FALSE;
    }

  /* empty JSON is not an error */
  node = json_parser_get_root (parser);
  if (node != NULL)
    {
      array = json_node_get_array (node);
      elements = json_array_get_elements (array);

      stopper = xapian_simple_stopper_new ();
      for (l = elements; l != NULL; l = l->next)
        {
          stopword = json_node_get_string (l->data);
          /* In older databases, each stopword had a newline appended.
           * This has now been fixed, but to avoid having to rebuild
           * everything, we check for and remove such newlines.
           */
          if (g_str_has_suffix (stopword, "\n"))
            {
              stopword_chomped = g_strdup (stopword);
              g_strchomp (stopword_chomped);
              xapian_simple_stopper_add (stopper, stopword_chomped);
              g_free (stopword_chomped);
            }
          else
            {
              xapian_simple_stopper_add (stopper, stopword);
            }
        }

      xapian_query_parser_set_stopper (query_parser, XAPIAN_STOPPER (stopper));
      g_object_unref (stopper);
    }

  g_object_unref (parser);

  return TRUE;
}

static XapianDatabase *
create_database_from_manifest (const char  *manifest_path,
                               GError     **error_out)
{
  GError *error = NULL;
  g_autofree char *manifest_dir_path = NULL;
  XapianDatabase *db = NULL;

  JsonParser *parser = json_parser_new ();
  if (!json_parser_load_from_file (parser, manifest_path, &error))
    goto out;

  db = xapian_database_new (&error);
  if (error != NULL)
    goto out;

  JsonNode *node = json_parser_get_root (parser);
  JsonObject *json_manifest = json_node_get_object (node);
  JsonArray *json_dbs = json_object_get_array_member (json_manifest, "xapian_databases");

  manifest_dir_path = g_path_get_dirname (manifest_path);

  GList *dbs = json_array_get_elements (json_dbs), *l;
  for (l = dbs; l != NULL; l = l->next)
    {
      JsonObject *json_db = json_node_get_object (l->data);

      guint64 db_offset = json_object_get_int_member (json_db, "offset");

      const char *relpath = json_object_get_string_member (json_db, "path");
      g_autofree char *db_path = g_build_filename (manifest_dir_path, relpath, NULL);

      XapianDatabase *internal_db = g_initable_new (XAPIAN_TYPE_DATABASE,
                                                    NULL, &error,
                                                    "path", db_path,
                                                    "offset", db_offset,
                                                    NULL);

      if (error != NULL)
        goto out;

      xapian_database_add_database (db, internal_db);
      g_object_unref (internal_db);
    }

 out:
  g_clear_object (&parser);

  if (error)
    {
      g_propagate_error (error_out, error);
      g_clear_object (&db);
    }

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
static DatabasePayload *
eknc_database_manager_create_db_internal (EkncDatabaseManager *self,
                                          const char *path,
                                          GError **error_out)
{
  EkncDatabaseManagerPrivate *priv = eknc_database_manager_get_instance_private (self);
  GError *error = NULL;
  DatabasePayload *payload;

  g_autoptr(XapianDatabase) db = create_database_from_manifest (path, &error);

  if (error != NULL)
    {
      g_set_error (error_out, EKNC_DATABASE_MANAGER_ERROR,
                   EKNC_DATABASE_MANAGER_ERROR_INVALID_PATH,
                   "Cannot create XapianDatabase for path %s: %s",
                   path, error->message);
      g_error_free (error);
      return NULL;
    }

  /* Create a XapianQueryParser for this particular database, stemming by its
   * registered language.
   */
  g_autoptr(XapianQueryParser) query_parser = xapian_query_parser_new ();
  xapian_query_parser_set_database (query_parser, db);

  if (!eknc_database_manager_register_prefixes (self, db, query_parser, &error))
    {
      /* Non-fatal */
      g_warning ("Could not register prefixes for database %s: %s",
                 path, error->message);
      g_clear_error (&error);
    }

  if (!eknc_database_manager_register_stopwords (self, db, query_parser, &error))
    {
      /* Non-fatal */
      g_warning ("Could not add stop words for database %s: %s.",
                 path, error->message);
      g_clear_error (&error);
    }

  /* DatabasePayload owns a reference on the database and query parser */
  payload = database_payload_new (db, query_parser, self, path);
  g_hash_table_insert (priv->databases, g_strdup (path), payload);

  return payload;
}

static DatabasePayload *
ensure_db (EkncDatabaseManager *self,
           GError **error_out)
{
  EkncDatabaseManagerPrivate *priv = eknc_database_manager_get_instance_private (self);
  DatabasePayload *payload;

  g_autofree char *path = read_link (priv->manifest_path);
  payload = g_hash_table_lookup (priv->databases, path);
  if (payload != NULL)
    return payload;

  GError *error = NULL;
  payload = eknc_database_manager_create_db_internal (self, path, &error);
  if (error != NULL)
    {
      g_propagate_error (error_out, error);
      return NULL;
    }

  return payload;
}

static XapianMSet *
eknc_database_manager_fetch_results (EkncDatabaseManager *self,
                                     XapianEnquire *enquire,
                                     XapianQuery *query,
                                     const gchar *query_str,
                                     GHashTable *query_options,
                                     GError **error_out)
{
  const gchar *str;
  gchar *document_data;
  guint limit, offset;
  XapianMSet *matches;
  GError *error = NULL;

  str = g_hash_table_lookup (query_options, QUERY_PARAM_OFFSET);
  if (str == NULL)
    {
      g_set_error_literal (error_out, EKNC_DATABASE_MANAGER_ERROR,
                           EKNC_DATABASE_MANAGER_ERROR_INVALID_PARAMS,
                           "Offset parameter is required for the query");
      return NULL;
    }

  offset = (guint) g_ascii_strtod (str, NULL);

  str = g_hash_table_lookup (query_options, QUERY_PARAM_LIMIT);
  if (str == NULL)
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
  {
    double val = g_ascii_strtod (str, NULL);

    /* Allow negative values to mean "all results" */
    if (val < 0)
      limit = G_MAXUINT;
    else
      limit = CLAMP (val, 0, G_MAXUINT);
  }

  xapian_enquire_set_query (enquire, query, xapian_query_get_length (query));
  matches = xapian_enquire_get_mset (enquire, offset, limit, &error);
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
parse_default_op (XapianQueryParser *qp, const gchar *str, GError **error)
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
  gchar **v = g_strsplit (str, ",", -1), **iter;
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
          g_strfreev (v);
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
          g_strfreev (v);
          return FALSE;
        }
    }
  *flags_ptr = flags;
  g_strfreev (v);
  return TRUE;
}

static gboolean
eknc_database_manager_fix_query_internal (EkncDatabaseManager *self,
                                          DatabasePayload *payload,
                                          GHashTable *query_options,
                                          char **stop_fixed_query_out,
                                          char **spell_fixed_query_out,
                                          GError **error_out)
{
  GError *error = NULL;
  const char *query_str;
  const char *match_all;
  const char *default_op;
  const char *flags_str;
  XapianQueryParserFeature flags = QUERY_PARSER_FLAGS;
  XapianStopper *stopper;

  query_str = g_hash_table_lookup (query_options, QUERY_PARAM_QUERYSTR);
  match_all = g_hash_table_lookup (query_options, QUERY_PARAM_MATCH_ALL);

  stopper = xapian_query_parser_get_stopper (payload->qp);

  if (query_str == NULL || match_all != NULL)
    {
      g_set_error (error_out, EKNC_DATABASE_MANAGER_ERROR,
                  EKNC_DATABASE_MANAGER_ERROR_INVALID_PARAMS,
                  "Query parameter must be set, and must not be match all.");
      return FALSE;
    }

  if (stopper != NULL)
    {
      g_auto(GStrv) words = g_strsplit (query_str, " ", -1);
      g_auto(GStrv) filtered_words = g_new0 (char *, g_strv_length (words) + 1);

      char **filtered_iter = filtered_words;
      char **words_iter;
      for (words_iter = words; *words_iter != NULL; words_iter++)
        {
          if (!xapian_stopper_is_stop_term (stopper, *words_iter))
            *filtered_iter++ = *words_iter;
        }

      if (stop_fixed_query_out != NULL)
        *stop_fixed_query_out = g_strjoinv (" ", filtered_words);
    }

  default_op = g_hash_table_lookup (query_options, QUERY_PARAM_DEFAULT_OP);
  if (default_op != NULL && !parse_default_op (payload->qp, default_op, error_out))
    return FALSE;

  flags_str = g_hash_table_lookup (query_options, QUERY_PARAM_FLAGS);
  if (flags_str != NULL && !parse_query_flags (flags_str, &flags, error_out))
    return FALSE;

  /* Parse the user's query so we can request a spelling correction. */
  xapian_query_parser_parse_query_full (payload->qp, query_str, flags, "", &error);
  if (error != NULL)
    {
      g_propagate_error (error_out, error);
      return FALSE;
    }

  if (spell_fixed_query_out != NULL)
    *spell_fixed_query_out = xapian_query_parser_get_corrected_query_string (payload->qp);

  return TRUE;
}

gboolean
eknc_database_manager_fix_query (EkncDatabaseManager *self,
                                 GHashTable *query,
                                 char **stop_fixed_query,
                                 char **spell_fixed_query,
                                 GError **error_out)
{
  EkncDatabaseManagerPrivate *priv = eknc_database_manager_get_instance_private (self);

  g_return_val_if_fail (EKNC_IS_DATABASE_MANAGER (self), FALSE);

  GError *error = NULL;
  DatabasePayload *payload = ensure_db (self, &error);
  if (error != NULL)
    {
      g_propagate_error (error_out, error);
      return FALSE;
    }

  return eknc_database_manager_fix_query_internal (self, payload, query,
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
                                      DatabasePayload *payload,
                                      GHashTable *query_options,
                                      GError **error_out)
{
  EkncDatabaseManagerPrivate *priv = eknc_database_manager_get_instance_private (self);
  const gchar *filter_str, *filterout_str;
  GError *error = NULL;
  const gchar *lang;
  XapianStem *stem;
  const gchar *str;
  const gchar *match_all;
  const gchar *default_op;
  const gchar *flags_str;
  XapianQueryParserFeature flags = QUERY_PARSER_FLAGS;
  JsonNode *results;

  if (database_is_empty (payload->db))
    return NULL;

  g_autofree char *query_str = NULL;

  str = g_hash_table_lookup (query_options, QUERY_PARAM_QUERYSTR);

  lang = g_hash_table_lookup (query_options, QUERY_PARAM_LANG);
  if (lang == NULL)
    lang = "none";

  stem = g_hash_table_lookup (priv->stemmers, lang);
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

  xapian_query_parser_set_stemmer (payload->qp, stem);
  xapian_query_parser_set_stemming_strategy (payload->qp, XAPIAN_STEM_STRATEGY_STEM_SOME);

  g_autoptr(XapianQuery) parsed_query = NULL;
  g_autoptr(XapianEnquire) enquire = xapian_enquire_new (payload->db, &error);
  if (error != NULL)
    {
      g_propagate_error (error_out, error);
      return NULL;
    }

  match_all = g_hash_table_lookup (query_options, QUERY_PARAM_MATCH_ALL);
  if (match_all != NULL && str == NULL)
    {
      /* Handled below. */
    }
  else if (str != NULL && match_all == NULL)
    {
      default_op = g_hash_table_lookup (query_options, QUERY_PARAM_DEFAULT_OP);
      if (default_op != NULL && !parse_default_op (payload->qp, default_op, error_out))
        return NULL;

      flags_str = g_hash_table_lookup (query_options, QUERY_PARAM_FLAGS);
      if (flags_str != NULL && !parse_query_flags (flags_str, &flags, error_out))
        return NULL;

      /* save the query string aside */
      query_str = g_strdup (str);
      parsed_query = xapian_query_parser_parse_query_full (payload->qp, query_str,
                                                           flags, "", &error);

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

  filter_str = g_hash_table_lookup (query_options, QUERY_PARAM_FILTER);
  if (filter_str != NULL)
    {
      g_autoptr(XapianQuery) filter_query =
        xapian_query_parser_parse_query_full (payload->qp,
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
          parsed_query = xapian_query_new_for_pair (XAPIAN_QUERY_OP_FILTER,
                                                    parsed_query,
                                                    filter_query);
        }
    }
  else if (parsed_query == NULL)
    {
      parsed_query = xapian_query_new_match_all ();
    }

  filterout_str = g_hash_table_lookup (query_options, QUERY_PARAM_FILTER_OUT);
  if (filterout_str != NULL)
    {
      g_autoptr(XapianQuery) filterout_query =
        xapian_query_parser_parse_query_full (payload->qp,
                                              filterout_str,
                                              XAPIAN_QUERY_PARSER_FEATURE_DEFAULT,
                                              "", &error);
      if (error != NULL)
        {
          g_propagate_error (error_out, error);
          return NULL;
        }

      parsed_query = xapian_query_new_for_pair (XAPIAN_QUERY_OP_AND_NOT,
                                                parsed_query,
                                                filterout_query);
    }

  str = g_hash_table_lookup (query_options, QUERY_PARAM_COLLAPSE_KEY);
  if (str != NULL)
    xapian_enquire_set_collapse_key (enquire, (guint) g_ascii_strtod (str, NULL));

  str = g_hash_table_lookup (query_options, QUERY_PARAM_SORT_BY);
  if (str != NULL)
    {
      gboolean reverse_order;
      const gchar *order;

      order = g_hash_table_lookup (query_options, QUERY_PARAM_ORDER);
      reverse_order = (g_strcmp0 (order, "desc") == 0);
      xapian_enquire_set_sort_by_value (enquire,
                                        (guint) g_ascii_strtod (str, NULL),
                                        reverse_order);
    }
  else
    {
      str = g_hash_table_lookup (query_options, QUERY_PARAM_CUTOFF);
      if (str != NULL)
        xapian_enquire_set_cutoff (enquire, (guint) g_ascii_strtod (str, NULL));
    }

  return eknc_database_manager_fetch_results (self, enquire, parsed_query,
                                              query_str, query_options,
                                              error_out);
}

XapianMSet *
eknc_database_manager_query (EkncDatabaseManager *self,
                             GHashTable *query,
                             GError **error_out)
{
  EkncDatabaseManagerPrivate *priv = eknc_database_manager_get_instance_private (self);

  g_return_val_if_fail (EKNC_IS_DATABASE_MANAGER (self), NULL);

  GError *error = NULL;
  DatabasePayload *payload = ensure_db (self, &error);
  if (error != NULL)
    {
      g_propagate_error (error_out, error);
      return NULL;
    }

  return eknc_database_manager_query_internal (self, payload, query, error_out);
}

EkncDatabaseManager *
eknc_database_manager_new (const char *path)
{
  return g_object_new (EKNC_TYPE_DATABASE_MANAGER,
                       "manifest-path", path,
                       NULL);
}
