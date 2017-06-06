/* Copyright 2016 Endless Mobile, Inc. */

#include "eknc-domain.h"

#include "eknc-object-model.h"
#include "eknc-utils.h"
#include "eknc-utils-private.h"

// Consolidate header would be nice
#include <eos-shard/eos-shard-blob.h>
#include <eos-shard/eos-shard-record.h>
#include <eos-shard/eos-shard-dictionary.h>
#include <eos-shard/eos-shard-shard-file.h>
#include <string.h>

GQuark
eknc_domain_error_quark (void)
{
  return g_quark_from_static_string ("eknc-domain-error-quark");
}

// This hash is derived from sha1('link-table'), and for now is the hardcoded
// location of link tables for all shards.
#define LINK_TABLE_ID "4dba9091495e8f277893e0d400e9e092f9f6f551"

/**
 * SECTION:domain
 * @title: Domain
 * @short_description: Grab content for a specific application
 *
 * The domain object handles querying for content for a specific application.
 * Usually you will want to use #EkncEngine rather than use this directly.
 */
struct _EkncDomain
{
  GObject parent_instance;

  gchar *app_id;
  gchar *path;
  gchar *subscription_id;

  EkncXapianBridge *xapian_bridge;
  GFile *content_dir;
  GFile *manifest_file;
  // List of EosShardShardFile items
  GSList *shards;
  // List of EosShardDictionary items
  GSList *link_tables;
};

static void initable_iface_init (GInitableIface *initable_iface);

G_DEFINE_TYPE_EXTENDED (EkncDomain,
                        eknc_domain,
                        G_TYPE_OBJECT,
                        0,
                        G_IMPLEMENT_INTERFACE (G_TYPE_INITABLE, initable_iface_init))

enum {
  PROP_0,
  PROP_APP_ID,
  PROP_PATH,
  PROP_XAPIAN_BRIDGE,
  NPROPS
};

static GParamSpec *eknc_domain_props[NPROPS] = { NULL, };

static void
eknc_domain_get_property (GObject    *object,
                          guint       prop_id,
                          GValue     *value,
                          GParamSpec *pspec)
{
  EkncDomain *self = EKNC_DOMAIN (object);

  switch (prop_id)
    {
    case PROP_APP_ID:
      g_value_set_string (value, self->app_id);
      break;

    case PROP_PATH:
      g_value_set_string (value, self->path);
      break;

    case PROP_XAPIAN_BRIDGE:
      g_value_set_object (value, self->xapian_bridge);
      break;

    default:
      G_OBJECT_WARN_INVALID_PROPERTY_ID (object, prop_id, pspec);
    }
}

static void
eknc_domain_set_property (GObject *object,
                          guint prop_id,
                          const GValue *value,
                          GParamSpec *pspec)
{
  EkncDomain *self = EKNC_DOMAIN (object);

  switch (prop_id)
    {
    case PROP_APP_ID:
      g_clear_pointer (&self->app_id, g_free);
      self->app_id = g_value_dup_string (value);
      break;

    case PROP_PATH:
      g_clear_pointer (&self->path, g_free);
      self->path = g_value_dup_string (value);
      break;

    case PROP_XAPIAN_BRIDGE:
      g_clear_object (&self->xapian_bridge);
      self->xapian_bridge = g_value_dup_object (value);
      break;

    default:
      G_OBJECT_WARN_INVALID_PROPERTY_ID (object, prop_id, pspec);
    }
}

static void
eknc_domain_finalize (GObject *object)
{
  EkncDomain *self = EKNC_DOMAIN (object);

  g_clear_pointer (&self->app_id, g_free);
  g_clear_pointer (&self->path, g_free);
  g_clear_pointer (&self->subscription_id, g_free);

  g_clear_object (&self->xapian_bridge);
  g_clear_object (&self->content_dir);
  g_clear_object (&self->manifest_file);
  g_slist_free_full (self->shards, g_object_unref);
  g_slist_free_full (self->link_tables, (GDestroyNotify)eos_shard_dictionary_unref);

  G_OBJECT_CLASS (eknc_domain_parent_class)->finalize (object);
}

static void
eknc_domain_class_init (EkncDomainClass *klass)
{
  GObjectClass *object_class = G_OBJECT_CLASS (klass);

  object_class->get_property = eknc_domain_get_property;
  object_class->set_property = eknc_domain_set_property;
  object_class->finalize = eknc_domain_finalize;

  /**
   * EkncDomain:app-id:
   *
   * The application id of the content this domain should be loading.
   */
  eknc_domain_props[PROP_APP_ID] =
    g_param_spec_string ("app-id", "Application ID",
      "Application ID of the domain content",
      "", G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);

  /**
   * EkncDomain:path:
   *
   * Path to the domain content.
   */
  eknc_domain_props[PROP_PATH] =
    g_param_spec_string ("path", "Path",
      "Path to the domain content",
      "", G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);

  /**
   * EkncDomain:xapian-bridge:
   *
   * The xapian bridge object to use for querying xapian.
   */
  eknc_domain_props[PROP_XAPIAN_BRIDGE] =
    g_param_spec_object ("xapian-bridge", "Xapian Bridge",
      "The xapian bridge object to use for querying xapian",
      EKNC_TYPE_XAPIAN_BRIDGE, G_PARAM_READWRITE | G_PARAM_CONSTRUCT | G_PARAM_STATIC_STRINGS);

  g_object_class_install_properties (object_class,
                                     NPROPS,
                                     eknc_domain_props);
}

static void
eknc_domain_init (EkncDomain *self)
{
}

static gboolean
eknc_parse_subscription_id (EkncDomain *self,
                            GCancellable *cancellable,
                            GError **error)
{
  g_autoptr(JsonNode) subscriptions_node = NULL;
  if (!(subscriptions_node = eknc_get_subscriptions_json (self->app_id, cancellable, error)))
    return FALSE;

  if (!JSON_NODE_HOLDS_OBJECT (subscriptions_node))
    {
      g_set_error (error, EKNC_DOMAIN_ERROR, EKNC_DOMAIN_ERROR_BAD_SUBSCRIPTIONS,
                   "Subscriptions file does not hold a json object");
      return FALSE;
    }

  JsonNode *child_node = json_object_get_member (json_node_get_object (subscriptions_node), "subscriptions");
  if (child_node == NULL || !JSON_NODE_HOLDS_ARRAY (child_node))
    {
      g_set_error (error, EKNC_DOMAIN_ERROR, EKNC_DOMAIN_ERROR_BAD_SUBSCRIPTIONS,
                   "Malformed subscriptions file");
      return FALSE;
    }

  JsonArray *subs_array = json_node_get_array (child_node);
  if (json_array_get_length (subs_array) == 0)
    {
      g_set_error (error, EKNC_DOMAIN_ERROR, EKNC_DOMAIN_ERROR_BAD_SUBSCRIPTIONS,
                   "No subscriptions in subscriptions file");
      return FALSE;
    }

  JsonNode *sub_node = json_array_get_element (subs_array, 0);
  if (!JSON_NODE_HOLDS_OBJECT (sub_node))
    {
      g_set_error (error, EKNC_DOMAIN_ERROR, EKNC_DOMAIN_ERROR_BAD_SUBSCRIPTIONS,
                   "Malformed subscription entry in subscriptions file");
      return FALSE;
    }

  JsonNode *id_node = json_object_get_member (json_node_get_object (sub_node), "id");
  if (id_node == NULL || json_node_get_value_type (id_node) != G_TYPE_STRING)
    {
      g_set_error (error, EKNC_DOMAIN_ERROR, EKNC_DOMAIN_ERROR_BAD_SUBSCRIPTIONS,
                   "Malformed subscription entry in subscriptions file");
      return FALSE;
    }
  self->subscription_id = g_strdup (json_node_get_string (id_node));
  return TRUE;
}

static gboolean
eknc_domain_clean_old_symlinks (EkncDomain *self,
                                GFile *subscription_dir,
                                GCancellable *cancellable,
                                GError **error)
{
  GError *local_error = NULL;
  g_autoptr(GFileEnumerator) enumerator = g_file_enumerate_children (subscription_dir,
                                                                     "standard::name,standard::type",
                                                                     G_FILE_QUERY_INFO_NOFOLLOW_SYMLINKS,
                                                                     cancellable,
                                                                     &local_error);
  if (local_error != NULL)
    {
      g_propagate_error (error, local_error);
      return FALSE;
    }

  gpointer info_ptr;
  while ((info_ptr = g_file_enumerator_next_file (enumerator, cancellable, &local_error)))
    {
      g_autoptr(GFileInfo) info = info_ptr;
      g_autoptr(GFile) file = g_file_enumerator_get_child (enumerator, info);
      if (g_file_query_exists (file, cancellable))
        continue;
      g_file_delete (file, cancellable, &local_error);
      if (local_error == NULL)
        continue;
      if (g_error_matches (local_error, G_IO_ERROR, G_IO_ERROR_NOT_FOUND))
        {
          g_clear_error (&local_error);
        }
      else
        {
          g_propagate_error (error, local_error);
          return FALSE;
        }
    }

  if (local_error != NULL)
    {
      g_propagate_error (error, local_error);
      return FALSE;
    }

  return TRUE;
}

static gboolean
eknc_domain_setup_link_tables (EkncDomain *self,
                               GError **error)
{
  for (GSList *l = self->shards; l; l = l->next)
    {
      EosShardShardFile *shard = l->data;
      g_autoptr(EosShardRecord) record = eos_shard_shard_file_find_record_by_hex_name (shard, LINK_TABLE_ID);
      if (record == NULL)
        continue;
      EosShardDictionary *dict;
      if (!(dict = eos_shard_blob_load_as_dictionary (record->data, error)))
        return FALSE;
      self->link_tables = g_slist_append (self->link_tables, dict);
    }

  return TRUE;
}

static gboolean
eknc_domain_initable_init (GInitable *initable,
                           GCancellable *cancellable,
                           GError **error)
{
  EkncDomain *self = EKNC_DOMAIN (initable);
  GError *local_error = NULL;

  gboolean has_app_id = (self->app_id != NULL && *self->app_id != '\0');
  gboolean has_path = (self->path != NULL && *self->path != '\0');

  g_autoptr(GFile) subscription_dir = NULL;
  g_autoptr(GFile) bundle_dir = NULL;

  if (has_path)
    {
      subscription_dir = g_file_new_for_path (self->path);
      bundle_dir = g_file_dup (subscription_dir);

      if (!g_file_query_exists (subscription_dir, cancellable))
        {
          g_set_error (error, EKNC_DOMAIN_ERROR, EKNC_DOMAIN_ERROR_PATH_NOT_FOUND,
                       "You must provide an existing domain path");
          return FALSE;
        }
    }
  else if (has_app_id)
    {
      if (!eknc_parse_subscription_id (self, cancellable, error))
        return FALSE;

      g_autoptr(GFile) subscriptions_dir = NULL;
      g_autoptr(GFile) bundle_subscriptions_dir = NULL;

      self->content_dir = eknc_get_data_dir (self->app_id);
      subscriptions_dir = eknc_get_subscriptions_dir ();
      subscription_dir = g_file_get_child (subscriptions_dir, self->subscription_id);
      bundle_subscriptions_dir = g_file_get_child (self->content_dir, "com.endlessm.subscriptions");
      bundle_dir = g_file_get_child (bundle_subscriptions_dir, self->subscription_id);
    }
  else
    {
      g_set_error (error, EKNC_DOMAIN_ERROR, EKNC_DOMAIN_ERROR_APP_ID_NOT_SET,
                   "You must set an app id or path to initialize a domain object");
      return FALSE;
    }

  self->manifest_file = g_file_get_child (subscription_dir, "manifest.json");

  g_file_make_directory_with_parents (subscription_dir, cancellable, &local_error);
  if (local_error)
    {
      if (g_error_matches (local_error, G_IO_ERROR, G_IO_ERROR_EXISTS))
        {
          g_clear_error (&local_error);
        }
      else
        {
          g_propagate_error (error, local_error);
          return FALSE;
        }
    }

  if (!g_file_query_exists (self->manifest_file, cancellable))
    {
      g_autoptr(GFile) bundle_manifest_file = g_file_get_child (bundle_dir, "manifest.json");
      if (!g_file_query_exists (bundle_manifest_file, cancellable))
        {
          g_set_error (error, G_IO_ERROR, G_IO_ERROR_NOT_FOUND,
                       "You have no manifest.json and are not running from a "
                       "Flatpak bundle. You must download a content update");
          return FALSE;
        }
      g_file_make_symbolic_link (self->manifest_file,
                                 g_file_get_path (bundle_manifest_file),
                                 cancellable,
                                 &local_error);
      if (local_error)
        {
          if (g_error_matches (local_error, G_IO_ERROR, G_IO_ERROR_EXISTS))
            {
              g_clear_error (&local_error);
            }
          else
            {
              g_propagate_error (error, local_error);
              return FALSE;
            }
        }
    }


  g_autofree gchar *contents = NULL;
  if (!g_file_load_contents (self->manifest_file, cancellable, &contents,
                             NULL, NULL, error))
    return FALSE;

  g_autoptr(JsonNode) manifest_node = NULL;
  if (!(manifest_node = json_from_string (contents, error)))
    return FALSE;

  if (!JSON_NODE_HOLDS_OBJECT (manifest_node))
    {
      g_set_error (error, EKNC_DOMAIN_ERROR, EKNC_DOMAIN_ERROR_BAD_MANIFEST,
                   "Manifest file does not hold a json object");
      return FALSE;
    }

  JsonNode *shards_node = json_object_get_member (json_node_get_object (manifest_node), "shards");

  if (shards_node == NULL || !JSON_NODE_HOLDS_ARRAY (shards_node))
    {
      g_set_error (error, EKNC_DOMAIN_ERROR, EKNC_DOMAIN_ERROR_BAD_MANIFEST,
                   "Missing or malformed shards entry in manifest");
      return FALSE;
    }

  if (!eknc_domain_clean_old_symlinks (self, subscription_dir, cancellable, error))
    return FALSE;

  JsonArray *shards_array = json_node_get_array (shards_node);
  for (guint i = 0; i < json_array_get_length (shards_array); i++)
    {
      JsonNode *shard_node = json_array_get_element (shards_array, i);
      if (!JSON_NODE_HOLDS_OBJECT (shard_node))
        {
          g_set_error (error, EKNC_DOMAIN_ERROR, EKNC_DOMAIN_ERROR_BAD_MANIFEST,
                       "Malformed shard entry in manifest");
          return FALSE;
        }
      JsonNode *path_node = json_object_get_member (json_node_get_object (shard_node), "path");
      if (path_node == NULL || json_node_get_value_type (path_node) != G_TYPE_STRING)
        {
          g_set_error (error, EKNC_DOMAIN_ERROR, EKNC_DOMAIN_ERROR_BAD_MANIFEST,
                       "Malformed shard entry in manifest");
          return FALSE;
        }
      g_autoptr(GFile) bundle_shard_file = g_file_get_child (bundle_dir, json_node_get_string (path_node));
      g_autoptr(GFile) subscription_shard_file = g_file_get_child (subscription_dir, json_node_get_string (path_node));

      // Make a symlink if necessary
      if (g_file_query_exists (bundle_shard_file, cancellable))
        {
          g_file_make_symbolic_link (subscription_shard_file,
                                     g_file_get_path (bundle_shard_file),
                                     cancellable, &local_error);
          if (local_error)
            {
              if (g_error_matches (local_error, G_IO_ERROR, G_IO_ERROR_EXISTS))
                {
                  g_clear_error (&local_error);
                }
              else
                {
                  g_propagate_error (error, local_error);
                  return FALSE;
                }
            }
        }
      EosShardShardFile *shard = g_object_new (EOS_SHARD_TYPE_SHARD_FILE,
                                               "path", g_file_get_path (subscription_shard_file),
                                               NULL);
      self->shards = g_slist_append (self->shards, shard);
    }

  if (!eknc_utils_parallel_init (self->shards, 0, cancellable, error))
    return FALSE;

  if (!eknc_domain_setup_link_tables (self, error))
    return FALSE;

  return TRUE;
}

static void
initable_iface_init (GInitableIface *initable_iface)
{
  initable_iface->init = eknc_domain_initable_init;
}

static EosShardRecord *
eknc_domain_load_record_from_hash_sync (EkncDomain *self,
                                        const gchar *hash)
{
  for (GSList *l = self->shards; l; l = l->next)
    {
      EosShardRecord *record = eos_shard_shard_file_find_record_by_hex_name (l->data, hash);
      if (record != NULL)
        return record;
    }
  return NULL;
}

static GHashTable *
eknc_get_domain_query_params (EkncDomain *self)
{
  GHashTable *params = g_hash_table_new_full (g_str_hash, g_str_equal, NULL, g_free);
  g_hash_table_insert (params, "manifest_path", g_file_get_path (self->manifest_file));
  return params;
}

/**
 * eknc_domain_get_subscription_id:
 * @self: the domain
 *
 * Gets subscription id of the domain
 *
 * Returns: (transfer none): the subscription id
 */
const gchar *
eknc_domain_get_subscription_id (EkncDomain *self)
{
  g_return_val_if_fail (EKNC_IS_DOMAIN (self), NULL);

  return self->subscription_id;
}

/**
 * eknc_domain_get_shards:
 * @self: the domain
 *
 * Gets the list of shard files in the domain.
 *
 * Returns: (element-type EosShardShardFile) (transfer none): the shards
 */
GSList *
eknc_domain_get_shards (EkncDomain *self)
{
  g_return_val_if_fail (EKNC_IS_DOMAIN (self), NULL);

  return self->shards;
}

/**
 * eknc_domain_test_link:
 * @self: the domain
 * @link: the ekn id of link to check for
 * @error: #GError for error reporting.
 *
 * Attempts to determine if the given link corresponds to content within
 * this domain.
 *
 * Returns: (transfer full): Returns an EKN URI to that content if so, and NULL otherwise.
 */
const gchar *
eknc_domain_test_link (EkncDomain *self,
                       const gchar *link,
                       GError **error)
{
  for (GSList *l = self->link_tables; l; l = l->next)
    {
      gchar *resolved = eos_shard_dictionary_lookup_key (l->data, link, error);
      if (resolved != NULL)
        return resolved;
    }
  return NULL;
}

static void
on_metadata_stream_parsed (GObject *source,
                           GAsyncResult *result,
                           gpointer user_data)
{
  JsonParser *parser = JSON_PARSER (source);
  g_autoptr(GTask) task = user_data;
  GError *error = NULL;

  if (!json_parser_load_from_stream_finish (parser, result, &error))
    {
      g_task_return_error (task, error);
      return;
    }

  EkncContentObjectModel *model = eknc_object_model_from_json_node (json_parser_get_root (parser), &error);
  if (error != NULL)
    {
      g_task_return_error (task, error);
      return;
    }

  g_task_return_pointer (task, model, g_object_unref);
}

/**
 * eknc_domain_get_object:
 * @self: the domain
 * @id: the ekn id of the object to load
 * @cancellable: (allow-none): optional #GCancellable object, %NULL to ignore.
 * @callback: (scope async): callback to call when the request is satisfied.
 * @user_data: (closure): the data to pass to callback function.
 *
 * Asynchronously load an object model for the given ekn_id
 */
void
eknc_domain_get_object (EkncDomain *self,
                        const gchar *id,
                        GCancellable *cancellable,
                        GAsyncReadyCallback callback,
                        gpointer user_data)
{
  g_return_if_fail (EKNC_IS_DOMAIN (self));
  g_return_if_fail (id != NULL);
  g_return_if_fail (G_IS_CANCELLABLE (cancellable) || cancellable == NULL);

  g_autoptr(GTask) task = g_task_new (self, cancellable, callback, user_data);
  JsonParser *parser = json_parser_new_immutable ();
  g_task_set_task_data (task, parser, g_object_unref);

  const gchar *hash = eknc_utils_id_get_hash (id);
  g_autoptr(EosShardRecord) record = eknc_domain_load_record_from_hash_sync (self, hash);
  if (record == NULL)
    {
      g_task_return_new_error (task, EKNC_DOMAIN_ERROR, EKNC_DOMAIN_ERROR_ID_NOT_FOUND,
                               "Could not find shard record for id %s", id);
      return;
    }

  GInputStream *stream = eos_shard_blob_get_stream (record->metadata);
  json_parser_load_from_stream_async (parser, stream, cancellable, on_metadata_stream_parsed, g_steal_pointer (&task));
}

/**
 * eknc_domain_get_object_finish:
 * @self: domain
 * @result: the #GAsyncResult that was provided to the callback.
 * @error: #GError for error reporting.
 *
 * Finish a eknc_domain_get_object call.
 *
 * Returns: (transfer full): the content object model that was fetched
 */
EkncContentObjectModel *
eknc_domain_get_object_finish (EkncDomain *self,
                               GAsyncResult *result,
                               GError **error)
{
  g_return_val_if_fail (EKNC_IS_DOMAIN (self), NULL);
  g_return_val_if_fail (G_IS_TASK (result), NULL);
  g_return_val_if_fail (error == NULL || *error == NULL, NULL);

  GTask *task = G_TASK (result);
  return g_task_propagate_pointer (task, error);
}

static void
on_xapian_bridge_query_fixed (GObject *source,
                              GAsyncResult *result,
                              gpointer user_data)
{
  EkncXapianBridge *bridge = EKNC_XAPIAN_BRIDGE (source);
  g_autoptr(GTask) task = user_data;
  GError *error = NULL;

  EkncQueryObject *query;
  if (!(query = eknc_xapian_bridge_get_fixed_query_finish (bridge, result, &error)))
    {
      g_task_return_error (task, error);
      return;
    }

  g_task_return_pointer (task, query, g_object_unref);
}

/**
 * eknc_domain_get_fixed_query:
 * @self: the domain
 * @query: the query object to fix
 * @cancellable: (allow-none): optional #GCancellable object, %NULL to ignore.
 * @callback: (scope async): callback to call when the request is satisfied.
 * @user_data: (closure): the data to pass to callback function.
 *
 * Asynchronously sends a request for to xapian-bridge to correct a given
 * query object. The corrections can be zero or more of the following:
 *      - the query with its stop words removed
 *      - the query which has had spelling correction applied to it.
 *
 * Note that the spelling correction will be performed on the original
 * query string, and not the string with stop words removed.
 */
void
eknc_domain_get_fixed_query (EkncDomain *self,
                             EkncQueryObject *query,
                             GCancellable *cancellable,
                             GAsyncReadyCallback callback,
                             gpointer user_data)
{
  g_return_if_fail (EKNC_IS_DOMAIN (self));
  g_return_if_fail (EKNC_IS_QUERY_OBJECT (query));
  g_return_if_fail (G_IS_CANCELLABLE (cancellable) || cancellable == NULL);

  GTask *task = g_task_new (self, cancellable, callback, user_data);

  g_autoptr(GHashTable) params = eknc_get_domain_query_params (self);
  eknc_xapian_bridge_get_fixed_query (self->xapian_bridge, query, params, cancellable,
                                      on_xapian_bridge_query_fixed, task);
}

/**
 * eknc_domain_get_fixed_query_finish:
 * @self: domain
 * @result: the #GAsyncResult that was provided to the callback.
 * @error: #GError for error reporting.
 *
 * Finish a eknc_domain_get_fixed_query call.
 *
 * Returns: (transfer full): a new query object with the fixed query.
 */
EkncQueryObject *
eknc_domain_get_fixed_query_finish (EkncDomain *self,
                                    GAsyncResult *result,
                                    GError **error)
{
  g_return_val_if_fail (EKNC_IS_DOMAIN (self), NULL);
  g_return_val_if_fail (G_IS_TASK (result), NULL);
  g_return_val_if_fail (error == NULL || *error == NULL, NULL);

  return g_task_propagate_pointer (G_TASK (result), error);
}

typedef struct
{
  // List of EkncContentModel items
  GPtrArray *models;
  guint total_models;
  guint upper_bound;
} QueryState;

static void
query_state_free (gpointer data)
{
  QueryState *state = data;
  g_clear_pointer (&state->models, g_ptr_array_unref);
  g_slice_free (QueryState, state);
}

typedef void (*ScatterTaskCountdownCompleteCallback) (GError *error, gpointer user_data);

typedef struct {
  guint remaining;
  ScatterTaskCountdownCompleteCallback callback;
  gpointer data;
  GError *error;
} ScatterTaskCountdown;

static ScatterTaskCountdown *
scatter_task_countdown_new (guint remaining,
                            ScatterTaskCountdownCompleteCallback callback,
                            gpointer data)
{
  ScatterTaskCountdown *countdown = g_new0 (ScatterTaskCountdown, 1);
  countdown->remaining = remaining;
  countdown->callback = callback;
  countdown->data = data;

  return countdown;
}

static void
scatter_task_countdown_subtask_completed (ScatterTaskCountdown **countdown_ptr,
                                          GError *error)
{
  ScatterTaskCountdown *countdown = *countdown_ptr;

  /* If we received an error we should still continue to countdown, but
   * store the error so that the caller can deal with it */
  if (!countdown->error && error)
    countdown->error = g_error_copy (error);

  if (--countdown->remaining == 0)
    {
      (*countdown->callback) (countdown->error, countdown->data);
      g_free (countdown);
      *countdown_ptr = NULL;
    }
}

typedef struct {
  /* Note that scatter_task_countdown_subtask_completed will free
   * this member once the countdown has completed */
  ScatterTaskCountdown *countdown;
  EkncDomain *domain;
  GPtrArray *models;
  guint index;
} ObjectResponseData;

static ObjectResponseData *
object_response_data_new (ScatterTaskCountdown *countdown,
                          EkncDomain *domain,
                          GPtrArray *models,
                          guint index)
{
  ObjectResponseData *data = g_new0 (ObjectResponseData, 1);
  data->countdown = countdown;
  data->domain = domain;
  data->models = models;
  data->index = index;
  return data;
}

static void
on_received_all_model_objects (GError *error, gpointer user_data)
{
  g_autoptr(GTask) task = user_data;

  /* Received an error, propogate it to the caller */
  if (error)
    g_task_return_error (task, error);
  else
    g_task_return_boolean (task, TRUE);
}

static void
on_object_response (GObject *source,
                    GAsyncResult *result,
                    gpointer user_data)
{
  g_autofree ObjectResponseData *object_response_data = user_data;
  EkncDomain *domain = object_response_data->domain;
  g_autoptr(GError) error = NULL;

  /* We take ownership of the returned error here and
   * scatter_task_countdown_completed may make a copy of it if
   * it needs to */
  EkncContentObjectModel *model = eknc_domain_get_object_finish (domain, result, &error);

  *(&g_ptr_array_index (object_response_data->models, object_response_data->index)) = model;
  scatter_task_countdown_subtask_completed (&object_response_data->countdown, error);
}

static void
maybe_unref_object (gpointer data)
{
  if (data)
    g_object_unref (data);
}

static void
on_xapian_query_response (GObject *source,
                          GAsyncResult *result,
                          gpointer user_data)
{
  EkncXapianBridge *bridge = EKNC_XAPIAN_BRIDGE (source);
  g_autoptr(GTask) task = user_data;
  EkncDomain *domain = g_task_get_source_object (task);
  QueryState *state = g_task_get_task_data (task);
  GCancellable *cancellable = g_task_get_cancellable (task);
  GError *error = NULL;

  JsonNode *json_node = eknc_xapian_bridge_query_finish (bridge, result, &error);

  if (error != NULL)
    {
      g_task_return_error (task, error);
      return;
    }

  if (!JSON_NODE_HOLDS_OBJECT (json_node))
    {
      g_task_return_new_error (task, EKNC_DOMAIN_ERROR, EKNC_DOMAIN_ERROR_BAD_RESULTS,
                               "Xapian results not a json object");
      return;
    }

  JsonNode *bound_node = json_object_get_member (json_node_get_object (json_node), "upperBound");
  if (bound_node != NULL)
    state->upper_bound = json_node_get_int (bound_node);

  JsonNode *results_node = json_object_get_member (json_node_get_object (json_node), "results");

  if (results_node == NULL || !JSON_NODE_HOLDS_ARRAY (results_node))
    {
      g_task_return_new_error (task, EKNC_DOMAIN_ERROR, EKNC_DOMAIN_ERROR_BAD_RESULTS,
                               "Xapian results with missing or malformed results property");
      return;
    }

  JsonArray *results_array = json_node_get_array (results_node);
  state->total_models = json_array_get_length (results_array);
  if (state->total_models == 0)
    {
      g_task_return_boolean (task, TRUE);
      return;
    }

  state->models = g_ptr_array_new_full (state->total_models, maybe_unref_object);
  g_ptr_array_set_size (state->models, state->total_models);

  /* We need to take a ref on the task here so that it is preserved until
   * we are done receiving all model objects */
  ScatterTaskCountdown *countdown = scatter_task_countdown_new (state->total_models,
                                                                on_received_all_model_objects,
                                                                g_object_ref (task));

  for (guint i = 0; i < json_array_get_length (results_array); i++)
    {
      JsonNode *result_node = json_array_get_element (results_array, i);
      if (json_node_get_value_type (result_node) != G_TYPE_STRING)
        {
          g_task_return_new_error (task, EKNC_DOMAIN_ERROR, EKNC_DOMAIN_ERROR_BAD_RESULTS,
                                   "Malformed results entry");
          return;
        }

      /* Note that we pass another closure here instead of just the task
       * containing the index of the response. This is done to preserve
       * ordering since the callback order is not guaranteed. */
      eknc_domain_get_object (domain, json_node_get_string (result_node),
                              cancellable,
                              on_object_response,
                              object_response_data_new (countdown,
                                                        domain,
                                                        state->models,
                                                        i));
    }
}

/**
 * eknc_domain_query:
 * @self: the domain
 * @query: the query object
 * @cancellable: (allow-none): optional #GCancellable object, %NULL to ignore.
 * @callback: (scope async): callback to call when the request is satisfied.
 * @user_data: (closure): the data to pass to callback function.
 *
 * Asynchronously fetch a #EkncQueryResults for a #EkncQueryObject.
 */
void
eknc_domain_query (EkncDomain *self,
                   EkncQueryObject *query,
                   GCancellable *cancellable,
                   GAsyncReadyCallback callback,
                   gpointer user_data)
{
  g_return_if_fail (EKNC_IS_DOMAIN (self));
  g_return_if_fail (EKNC_IS_QUERY_OBJECT (query));
  g_return_if_fail (G_IS_CANCELLABLE (cancellable) || cancellable == NULL);

  GTask *task = g_task_new (self, cancellable, callback, user_data);
  QueryState *state = g_slice_new0 (QueryState);
  g_task_set_task_data (task, state, query_state_free);

  g_autoptr(GHashTable) params = eknc_get_domain_query_params (self);
  eknc_xapian_bridge_query (self->xapian_bridge, query, params,
                            cancellable, on_xapian_query_response, task);
}

static GList *
ptr_array_to_list_deep (GPtrArray *array)
{
  GList *list = NULL;

  /* If there's no array just return an empty list */
  if (!array)
    return NULL;

  for (guint i = 0; i < array->len; ++i)
    list = g_list_append (list, g_object_ref (g_ptr_array_index (array, i)));

  return list;
}

/**
 * eknc_domain_query_finish:
 * @self: domain
 * @result: the #GAsyncResult that was provided to the callback.
 * @error: #GError for error reporting.
 *
 * Finish a eknc_domain_query call.
 *
 * Returns: (transfer full): the results object
 */
EkncQueryResults *
eknc_domain_query_finish (EkncDomain *self,
                          GAsyncResult *result,
                          GError **error)
{
  g_return_val_if_fail (EKNC_IS_DOMAIN (self), NULL);
  g_return_val_if_fail (G_IS_TASK (result), NULL);
  g_return_val_if_fail (error == NULL || *error == NULL, NULL);

  GTask *task = G_TASK (result);
  if (!g_task_propagate_boolean (task, error))
    return NULL;

  QueryState *state = g_task_get_task_data (task);
  return g_object_new (EKNC_TYPE_QUERY_RESULTS,
                       "upper-bound", state->upper_bound,
                       "models", ptr_array_to_list_deep (state->models),
                       NULL);
}

/**
 * eknc_domain_read_uri:
 * @self: domain
 * @uri: the ekn uri to read
 * @bytes: (out) (transfer full) (allow-none): return location for the contents GBytes
 * @mime_type: (out) (transfer full) (allow-none): return location for the content mime type
 * @error: #GError for error reporting
 *
 * Reads the contents of a ekn uri and returns a GBytes of the contents and the
 * contents mime type, if the ekn uri contents was found.
 *
 * Returns: true if the uri was successfully searched for, false if an error occurred
 */
gboolean
eknc_domain_read_uri (EkncDomain *self,
                      const gchar *uri,
                      GBytes **bytes,
                      const gchar **mime_type,
                      GError **error)
{
  g_return_val_if_fail(uri && g_str_has_prefix (uri, "ekn://"), FALSE);
  g_auto(GStrv) tokens = g_strsplit (uri + strlen("ekn://"), "/", -1);
  g_return_val_if_fail(tokens && tokens[0] && tokens[1], FALSE);

  g_autoptr(EosShardRecord) record = NULL;
  /* iterate over all shards until we find a matching record */
  for (GSList *l = self->shards; l && !record; l = g_slist_next (l))
    record = eos_shard_shard_file_find_record_by_hex_name (l->data, tokens[1]);

  if (!record)
    return TRUE;

  g_autoptr(EosShardBlob) blob = eos_shard_blob_ref (record->data);
  /* Use resource, if present */
  if (tokens[2])
    blob = eos_shard_record_lookup_blob (record, tokens[2]);

  if (!blob)
    return TRUE;

  if (mime_type)
    *mime_type = g_strdup (eos_shard_blob_get_content_type (blob));

  if (bytes)
    *bytes = eos_shard_blob_load_contents (blob, error);

  return TRUE;
}

/**
 * eknc_domain_get_impl:
 * @app_id: the domains app id
 * @path: path to the content
 * @xapian_bridge: the xapian bridge instance to use to communicate to xapian
 * @cancellable: (allow-none): optional #GCancellable object, %NULL to ignore.
 * @error: #GError for error reporting
 *
 * Gets a domain object for a given app id. Currently only EKN_VERSION 3 domains
 * are supported, but we may bring back multiple version of our on disk database
 * format in the future.
 *
 * Returns: (transfer full): the newly created domain object
 */
EkncDomain *
eknc_domain_get_impl (const gchar *app_id,
                      const gchar *path,
                      EkncXapianBridge *xapian_bridge,
                      GCancellable *cancellable,
                      GError **error)
{
  g_autofree gchar *ekn_version;
  if (!(ekn_version = eknc_get_ekn_version (app_id, cancellable, error)))
    return NULL;

  EkncDomain *domain = NULL;
  if (g_strcmp0 (ekn_version, "3") == 0)
    {
      domain = g_object_new (EKNC_TYPE_DOMAIN,
                             "app-id", app_id,
                             "path", path,
                             "xapian-bridge", xapian_bridge,
                             NULL);
    }
  else
    {
      g_set_error (error, EKNC_DOMAIN_ERROR, EKNC_DOMAIN_ERROR_UNSUPPORTED_VERSION,
                   "Invalid ekn version for app ID %s: %s", app_id, ekn_version);
      return NULL;
    }

  g_initable_init (G_INITABLE (domain), cancellable, error);
  return domain;
}
