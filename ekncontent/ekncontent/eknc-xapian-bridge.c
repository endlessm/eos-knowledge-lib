/* Copyright 2016 Endless Mobile, Inc. */

#include "eknc-xapian-bridge.h"

#include <gio/gio.h>

GQuark
eknc_xapian_bridge_error_quark (void)
{
  return g_quark_from_static_string("eknc-xapian-bridge-error-quark");
}

#define XB_FIX_ENDPOINT "/fix"
#define XB_QUERY_ENDPOINT "/query"

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

  gchar *host;
  guint port;
  gchar *language;
  SoupSession *session;
};

G_DEFINE_TYPE (EkncXapianBridge,
               eknc_xapian_bridge,
               G_TYPE_OBJECT)

enum {
  PROP_0,
  PROP_HOST,
  PROP_PORT,
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
    case PROP_HOST:
      g_value_set_string (value, self->host);
      break;

    case PROP_PORT:
      g_value_set_uint (value, self->port);
      break;

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
    case PROP_HOST:
      g_clear_pointer (&self->host, g_free);
      self->host = g_value_dup_string (value);
      break;

    case PROP_PORT:
      self->port = g_value_get_uint (value);
      break;

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

  g_clear_pointer (&self->host, g_free);
  g_clear_pointer (&self->language, g_free);
  g_clear_object (&self->session);

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
   * EkncXapianBridge:host:
   *
   * The hostname of the xapian bridge. You generally don't
   * need to set this.
   */
  // FIXME: the default should just be localhost, but libsoup has a bug
  // whereby it does not resolve localhost when it is offline:
  // https://bugzilla.gnome.org/show_bug.cgi?id=692291
  // Once this bug is fixed, we should change this to be localhost.
  eknc_xapian_bridge_props[PROP_HOST] =
    g_param_spec_string ("host", "Hostname",
      "HTTP hostname for the xapian bridge service",
      "127.0.0.1", G_PARAM_READWRITE | G_PARAM_CONSTRUCT | G_PARAM_STATIC_STRINGS);

  /**
   * EkncXapianBridge:port:
   *
   * The port of the xapian bridge. You generally don't need
   * to set this.
   */
  eknc_xapian_bridge_props[PROP_PORT] =
    g_param_spec_uint ("port", "Port",
      "The port of the xapian bridge service",
      0, 65535, 3004, G_PARAM_READWRITE | G_PARAM_CONSTRUCT | G_PARAM_STATIC_STRINGS);

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
  self->session = soup_session_new ();
}

/**
 * eknc_xapian_bridge_get_soup_session:
 * @self: the xapian bridge object
 *
 * Exposes the soup session used for network communications with xapian bridge.
 * For testing, should not be needed for normal use.
 *
 * Returns: (transfer none): the soup session
 */
SoupSession *
eknc_xapian_bridge_get_soup_session (EkncXapianBridge *self)
{
  g_return_val_if_fail (EKNC_IS_XAPIAN_BRIDGE (self), NULL);

  return self->session;
}

static SoupURI *
build_xapian_uri (EkncXapianBridge *self,
                  const gchar *endpoint,
                  GHashTable *params)
{
  SoupURI *uri = soup_uri_new (NULL);
  soup_uri_set_scheme (uri, SOUP_URI_SCHEME_HTTP);
  soup_uri_set_host (uri, self->host);
  soup_uri_set_port (uri, self->port);
  soup_uri_set_path (uri, endpoint);
  soup_uri_set_query_from_form (uri, params);
  return uri;
}

static void
add_to_hash_table (gpointer key,
                   gpointer value,
                   gpointer user_data)
{
  GHashTable *hash_table = user_data;
  g_hash_table_insert (hash_table, key, value);
}

static SoupURI *
get_xapian_fix_uri (EkncXapianBridge *self,
                    EkncQueryObject *query,
                    GHashTable *extra_params)
{
  g_autoptr(GHashTable) params = g_hash_table_new (g_str_hash, g_str_equal);
  g_autofree gchar *query_string = NULL;
  g_object_get (query, "query", &query_string, NULL);
  g_hash_table_insert (params, "q", query_string);

  if (extra_params)
    g_hash_table_foreach (extra_params, add_to_hash_table, params);

  return build_xapian_uri (self, XB_FIX_ENDPOINT, params);
}

static SoupURI *
get_xapian_query_uri (EkncXapianBridge *self,
                      EkncQueryObject *query,
                      GHashTable *extra_params)
{
  g_autoptr(GHashTable) params = g_hash_table_new (g_str_hash, g_str_equal);
  g_hash_table_insert (params, "q", (gpointer) eknc_query_object_get_query_parser_string (query));
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

  return build_xapian_uri (self, XB_QUERY_ENDPOINT, params);
}

static void
json_ld_request_finished (SoupSession *session,
                          SoupMessage *request,
                          gpointer data)
{
  g_autoptr(GTask) task = data;
  if (request->status_code != SOUP_STATUS_OK)
    {
      g_task_return_new_error (task, EKNC_XAPIAN_BRIDGE_ERROR, EKNC_XAPIAN_BRIDGE_ERROR_BAD_STATUS,
                               "Bad status from xapian bridge: %d", request->status_code);
      return;
    }
  g_autoptr(GError) error = NULL;
  g_autoptr(JsonNode) node = json_from_string (request->response_body->data, &error);
  if (error)
    {
      g_task_return_new_error (task, EKNC_XAPIAN_BRIDGE_ERROR, EKNC_XAPIAN_BRIDGE_ERROR_BAD_JSON,
                               "Error parsing json from xapian: %s", error->message);
      return;
    }
  g_task_return_pointer (task, g_steal_pointer (&node), (GDestroyNotify)json_node_unref);
}

typedef struct
{
  EkncQueryObject *query;
  SoupMessage *request;
} RequestState;

static void
request_state_free (gpointer data)
{
  RequestState *state = data;
  g_object_unref (state->query);
  g_object_unref (state->request);
  g_slice_free (RequestState, state);
}

static void
json_ld_request_cancelled (GCancellable *cancellable,
                           GTask        *task)
{
  EkncXapianBridge *self = g_task_get_source_object (task);
  RequestState *state = g_task_get_task_data (task);
  soup_session_cancel_message (self->session, state->request, SOUP_STATUS_CANCELLED);
}

static void
send_json_ld_request (EkncXapianBridge *self,
                      SoupURI *uri,
                      GTask *task)
{
  g_autofree gchar * uri_string = soup_uri_to_string (uri, FALSE);
  g_debug ("Sending request to xapian-bridge at %s\n", uri_string);
  g_autoptr(SoupMessage) request = soup_message_new_from_uri (SOUP_METHOD_GET, uri);

  RequestState *state = g_task_get_task_data (task);
  state->request = g_object_ref (request);
  soup_session_queue_message (self->session, g_steal_pointer (&request), json_ld_request_finished, task);

  GCancellable *cancellable = g_task_get_cancellable (task);
  if (cancellable)
      g_cancellable_connect (cancellable, G_CALLBACK (json_ld_request_cancelled), g_object_ref (task), g_object_unref);
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
  state->query = g_object_ref (query);
  g_task_set_task_data (task, state, request_state_free);

  g_autoptr(SoupURI) uri = get_xapian_fix_uri (self, query, extra_params);
  send_json_ld_request (self, uri, task);
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
  if (!JSON_NODE_HOLDS_OBJECT (node))
    {
      g_set_error (error, EKNC_XAPIAN_BRIDGE_ERROR, EKNC_XAPIAN_BRIDGE_ERROR_BAD_JSON,
                   "Non json object from xapian bridge");
      return NULL;
    }
  JsonObject *object = json_node_get_object (node);
  JsonNode *fixed_query_node = json_object_get_member (object, "stopWordCorrectedQuery");
  // If we didn't get a corrected query, we can just reuse the existing query object.
  RequestState *state = g_task_get_task_data (task);
  if (fixed_query_node == NULL)
    return state->query;
  if (json_node_get_value_type (fixed_query_node) != G_TYPE_STRING)
    {
      g_set_error (error, EKNC_XAPIAN_BRIDGE_ERROR, EKNC_XAPIAN_BRIDGE_ERROR_BAD_JSON,
                   "Unexpected value for stopWordCorrectedQuery");
      return NULL;
    }
  const gchar *fixed_query = json_node_get_string (fixed_query_node);
  return eknc_query_object_new_from_object (state->query,
                                            "stopword-free-query", fixed_query,
                                            NULL);
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
  state->query = g_object_ref (query);
  g_task_set_task_data (task, state, request_state_free);

  g_autoptr(SoupURI) uri = get_xapian_query_uri (self, query, extra_params);
  send_json_ld_request (self, uri, task);
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
