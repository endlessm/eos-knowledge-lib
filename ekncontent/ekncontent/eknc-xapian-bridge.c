/* Copyright 2016 Endless Mobile, Inc. */

#include "eknc-xapian-bridge-private.h"
#include "eknc-database-manager-private.h"

#include <gio/gio.h>

/**
 * SECTION:xapian-bridge
 * @title: Xapian Bridge
 * @short_description: Communicate with the xapian http server
 *
 * The Xapian Bridge class allows you to make queries to the xapian http server
 * using #QueryObject and get a json response back.
 */
struct _EkncXapianBridge
{
  GObject parent_instance;

  EkncDatabaseManager *database_manager;

  gboolean has_default_op, has_flags, has_filter;

  gchar *language;
};

G_DEFINE_TYPE (EkncXapianBridge, eknc_xapian_bridge, G_TYPE_OBJECT)

enum {
  PROP_0,
  PROP_LANGUAGE,
  NPROPS
};

static GParamSpec *eknc_xapian_bridge_props[NPROPS] = { NULL, };

static void
eknc_xapian_bridge_get_property (GObject    *object,
                                 guint       prop_id,
                                 GValue     *value,
                                 GParamSpec *pspec)
{
  EkncXapianBridge *self = EKNC_XAPIAN_BRIDGE (object);

  switch (prop_id)
    {
    case PROP_LANGUAGE:
      g_value_set_string (value, self->language);
      break;

    default:
      G_OBJECT_WARN_INVALID_PROPERTY_ID (object, prop_id, pspec);
    }
}

static void
eknc_xapian_bridge_set_property (GObject *object,
                                 guint prop_id,
                                 const GValue *value,
                                 GParamSpec *pspec)
{
  EkncXapianBridge *self = EKNC_XAPIAN_BRIDGE (object);

  switch (prop_id)
    {
    case PROP_LANGUAGE:
      g_clear_pointer (&self->language, g_free);
      self->language = g_value_dup_string (value);
      break;

    default:
      G_OBJECT_WARN_INVALID_PROPERTY_ID (object, prop_id, pspec);
    }
}

static void
eknc_xapian_bridge_finalize (GObject *object)
{
  EkncXapianBridge *self = EKNC_XAPIAN_BRIDGE (object);

  g_clear_object (&self->database_manager);

  g_clear_pointer (&self->language, g_free);

  G_OBJECT_CLASS (eknc_xapian_bridge_parent_class)->finalize (object);
}

static void
eknc_xapian_bridge_class_init (EkncXapianBridgeClass *klass)
{
  GObjectClass *object_class = G_OBJECT_CLASS (klass);

  object_class->get_property = eknc_xapian_bridge_get_property;
  object_class->set_property = eknc_xapian_bridge_set_property;
  object_class->finalize = eknc_xapian_bridge_finalize;

  /**
   * EkncXapianBridge:language:
   *
   * The ISO639 language code which will be used for various search
   * features, such as term stemming and spelling correction.
   */
  eknc_xapian_bridge_props[PROP_LANGUAGE] =
    g_param_spec_string ("language", "Language",
      "ISO639 locale code to be used in search",
      "", G_PARAM_READWRITE | G_PARAM_CONSTRUCT | G_PARAM_STATIC_STRINGS);

  g_object_class_install_properties (object_class,
                                     NPROPS,
                                     eknc_xapian_bridge_props);
}

static void
eknc_xapian_bridge_init (EkncXapianBridge *self)
{
  self->database_manager = eknc_database_manager_new ();

  self->has_default_op = TRUE;
  self->has_flags = TRUE;
  self->has_filter = TRUE;
}

static void
add_to_hash_table (gpointer key,
                   gpointer value,
                   gpointer user_data)
{
  GHashTable *hash_table = user_data;
  g_hash_table_insert (hash_table, key, value);
}

static GHashTable *
get_xapian_query_params (EkncXapianBridge *self,
                         EkncQueryObject *query,
                         GHashTable *extra_params)
{
  GHashTable *params = g_hash_table_new (g_str_hash, g_str_equal);

  const gchar *query_str;

  if (self->has_default_op && self->has_filter && self->has_flags)
    {
      const gchar *filter, *filterout;
      g_hash_table_insert (params, "defaultOp", "and");
      g_hash_table_insert (params, "flags", "default,partial,spelling-correction");
      query_str = eknc_query_object_get_query_parser_strings (query,
                                                              &filter,
                                                              &filterout);
      if (filter && *filter)
        g_hash_table_insert (params, "filter", (gpointer) filter);
      if (filterout && *filterout)
        g_hash_table_insert (params, "filterOut", (gpointer) filterout);
    }
  else
    {
      query_str = eknc_query_object_get_query_parser_string (query);
    }

  if (query_str)
    g_hash_table_insert (params, "q", (gpointer) query_str);
  else
    g_hash_table_insert (params, "matchAll", "1");

  if (self->language && *self->language)
    g_hash_table_insert (params, "lang", self->language);

  guint limit, offset;
  g_object_get (query, "limit", &limit, "offset", &offset, NULL);
  g_autofree gchar *offset_string = g_strdup_printf ("%u", offset);
  g_autofree gchar *limit_string = g_strdup_printf ("%u", limit);
  if (limit > 0)
    g_hash_table_insert (params, "limit", limit_string);
  g_hash_table_insert (params, "offset", offset_string);

  guint cutoff = eknc_query_object_get_cutoff (query);
  g_autofree gchar *cutoff_string = g_strdup_printf ("%u", cutoff);
  g_hash_table_insert (params, "cutoff", cutoff_string);

  gint sort_value = eknc_query_object_get_sort_value (query);
  g_autofree gchar *sort_string = g_strdup_printf ("%d", sort_value);
  if (sort_value > -1)
    g_hash_table_insert (params, "sortBy", sort_string);

  EkncQueryObjectOrder order;
  g_object_get (query, "order", &order, NULL);
  g_hash_table_insert (params, "order",
                       order == EKNC_QUERY_OBJECT_ORDER_ASCENDING ? "asc" : "desc");

  if (extra_params)
    g_hash_table_foreach (extra_params, add_to_hash_table, params);

  return params;
}

static GHashTable *
get_xapian_query_fix_params (EkncXapianBridge *self,
                             EkncQueryObject *query,
                             GHashTable *extra_params)
{
  GHashTable *params = g_hash_table_new (g_str_hash, g_str_equal);

  g_autofree gchar *query_string = NULL;
  g_object_get (query, "query", &query_string, NULL);
  g_hash_table_insert (params, "q", query_string);

  if (self->has_default_op)
    g_hash_table_insert (params, "defaultOp", "and");

  if (extra_params)
    g_hash_table_foreach (extra_params, add_to_hash_table, params);

  return params;
}

typedef struct
{
  EkncQueryObject *query;

  EkncDatabaseManager *db_manager;
  EkncDatabase db;

  GHashTable *params;
} RequestState;

static void
request_state_free (gpointer data)
{
  RequestState *state = data;

  g_clear_object (&state->query);

  g_clear_object (&state->db_manager);
  g_clear_pointer (&state->params, g_hash_table_unref);

  g_slice_free (RequestState, state);
}

static void
query_fix_task (GTask *task,
                gpointer source_obj,
                gpointer task_data,
                GCancellable *cancellable)
{
  RequestState *request = task_data;
  GError *error = NULL;

  if (g_task_return_error_if_cancelled (task))
    {
      g_object_unref (task);
      return;
    }

  JsonObject *result = eknc_database_manager_fix_query (request->db_manager,
                                                        &request->db,
                                                        request->params,
                                                        &error);

  if (result != NULL)
    {
      JsonNode *retval = json_node_new (JSON_NODE_OBJECT);
      json_node_take_object (retval, result);

      g_task_return_pointer (task, g_steal_pointer (&retval), (GDestroyNotify) json_node_unref);
    }
  else
    {
      g_task_return_error (task, error);
    }

  g_object_unref (task);
}

/**
 * eknc_xapian_bridge_get_fixed_query:
 * @self: the xapian bridge object
 * @query: the query object to fix
 * @extra_params: (element-type utf8 utf8) (allow-none): extra parameters for the xapian url
 * @cancellable: (allow-none): optional #GCancellable object, %NULL to ignore.
 * @callback: (scope async): callback to call when the request is satisfied.
 * @user_data: (closure): the data to pass to callback function.
 *
 * Asynchronously ask xapian bridge to fixup a query. At the moment, that just
 * means fetching a stopword free version of the query.
 */
void
eknc_xapian_bridge_get_fixed_query (EkncXapianBridge *self,
                                    EkncQueryObject *query,
                                    GHashTable *extra_params,
                                    GCancellable *cancellable,
                                    GAsyncReadyCallback callback,
                                    gpointer user_data)
{
  g_return_if_fail (EKNC_IS_XAPIAN_BRIDGE (self));
  g_return_if_fail (EKNC_IS_QUERY_OBJECT (query));
  g_return_if_fail (G_IS_CANCELLABLE (cancellable) || cancellable == NULL);

  GTask *task = g_task_new (self, cancellable, callback, user_data);

  RequestState *state = g_slice_new0 (RequestState);
  state->db_manager = g_object_ref (self->database_manager);

  state->db.path = g_hash_table_lookup (extra_params, "path");
  state->db.manifest_path = g_hash_table_lookup (extra_params, "manifest_path");

  state->query = g_object_ref (query);
  state->params = get_xapian_query_fix_params (self, query, extra_params);

  g_task_set_task_data (task, state, request_state_free);

  g_task_run_in_thread (task, query_fix_task);
}

/**
 * eknc_xapian_bridge_get_fixed_query_finish:
 * @self: the xapian bridge object
 * @result: the #GAsyncResult that was provided to the callback.
 * @error: #GError for error reporting.
 *
 * Finish a eknc_xapian_bridge_get_fixed_query call.
 *
 * Returns: (transfer full): a new query object with the fixed query.
 */
EkncQueryObject *
eknc_xapian_bridge_get_fixed_query_finish (EkncXapianBridge *self,
                                           GAsyncResult *result,
                                           GError **error)
{
  g_return_val_if_fail (EKNC_IS_XAPIAN_BRIDGE (self), NULL);
  g_return_val_if_fail (G_IS_ASYNC_RESULT (result), NULL);

  GTask *task = G_TASK (result);

  g_autoptr(JsonNode) node = g_task_propagate_pointer (task, error);
  if (node == NULL)
    return NULL;

  JsonObject *object = json_node_get_object (node);
  JsonNode *stop_fixed_query_node = json_object_get_member (object, "stopWordCorrectedQuery");
  JsonNode *spell_fixed_query_node = json_object_get_member (object, "spellCorrectedQuery");
  // If we didn't get a corrected query, we can just reuse the existing query object.
  RequestState *state = g_task_get_task_data (task);
  if (stop_fixed_query_node == NULL && spell_fixed_query_node == NULL)
    return state->query;

  const gchar *stop_fixed_query = NULL, *spell_fixed_query = NULL;
  if (stop_fixed_query_node != NULL)
    stop_fixed_query = json_node_get_string (stop_fixed_query_node);

  if (spell_fixed_query_node != NULL)
    spell_fixed_query = json_node_get_string (spell_fixed_query_node);

  if (stop_fixed_query != NULL && spell_fixed_query != NULL)
    return eknc_query_object_new_from_object (state->query,
                                              "stopword-free-query", stop_fixed_query,
                                              "corrected-query", spell_fixed_query,
                                              NULL);
  else if (stop_fixed_query != NULL)
    return eknc_query_object_new_from_object (state->query,
                                              "stopword-free-query", stop_fixed_query,
                                              NULL);
  else
    return eknc_query_object_new_from_object (state->query,
                                              "corrected-query", spell_fixed_query,
                                              NULL);
}

static void
query_task (GTask *task,
            gpointer source_object,
            gpointer task_data,
            GCancellable *cancellable)
{
  RequestState *request = task_data;
  GError *error = NULL;

  if (g_task_return_error_if_cancelled (task))
    {
      g_object_unref (task);
      return;
    }

  JsonObject *result = eknc_database_manager_query_db (request->db_manager,
                                                       &request->db,
                                                       request->params,
                                                       &error);
  if (result != NULL)
    {
      JsonNode *retval = json_node_new (JSON_NODE_OBJECT);
      json_node_take_object (retval, result);

      g_task_return_pointer (task, g_steal_pointer (&retval), (GDestroyNotify) json_node_unref);
    }
  else
    {
      g_task_return_error (task, error);
    }

  g_object_unref (task);
}

/**
 * eknc_xapian_bridge_query:
 * @self: the xapian bridge object
 * @query: the query object to use
 * @extra_params: (element-type utf8 utf8) (allow-none): extra parameters for the xapian url
 * @cancellable: (allow-none): optional #GCancellable object, %NULL to ignore.
 * @callback: (scope async): callback to call when the request is satisfied.
 * @user_data: (closure): the data to pass to callback function.
 *
 * Asynchronously make a query to xapian bridge.
 */
void
eknc_xapian_bridge_query (EkncXapianBridge *self,
                          EkncQueryObject *query,
                          GHashTable *extra_params,
                          GCancellable *cancellable,
                          GAsyncReadyCallback callback,
                          gpointer user_data)
{
  g_return_if_fail (EKNC_IS_XAPIAN_BRIDGE (self));
  g_return_if_fail (EKNC_IS_QUERY_OBJECT (query));
  g_return_if_fail (G_IS_CANCELLABLE (cancellable) || cancellable == NULL);

  GTask *task = g_task_new (self, cancellable, callback, user_data);

  RequestState *state = g_slice_new0 (RequestState);
  state->db_manager = g_object_ref (self->database_manager);

  state->db.path = g_hash_table_lookup (extra_params, "path");
  state->db.manifest_path = g_hash_table_lookup (extra_params, "manifest_path");

  state->query = g_object_ref (query);
  state->params = get_xapian_query_params (self, query, extra_params);

  g_task_set_task_data (task, state, request_state_free);

  g_task_run_in_thread (task, query_task);
}

/**
 * eknc_xapian_bridge_query_finish:
 * @self: the xapian bridge object
 * @result: the #GAsyncResult that was provided to the callback.
 * @error: #GError for error reporting.
 *
 * Finish a eknc_xapian_bridge_query call.
 *
 * Returns: (transfer full): the text body of the xapian bridge response
 */
JsonNode *
eknc_xapian_bridge_query_finish (EkncXapianBridge *self,
                                 GAsyncResult *result,
                                 GError **error)
{
  g_return_val_if_fail (EKNC_IS_XAPIAN_BRIDGE (self), NULL);
  g_return_val_if_fail (G_IS_ASYNC_RESULT (result), NULL);

  GTask *task = G_TASK (result);
  return g_task_propagate_pointer (task, error);
}
