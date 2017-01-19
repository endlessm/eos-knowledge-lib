/* -*- mode: C; c-file-style: "gnu"; indent-tabs-mode: nil; -*- */

/* Copyright 2015 Endless Mobile, Inc. */

#include "eknc-utils.h"
#include "eknc-utils-private.h"

#include <eos-shard/eos-shard-shard-file.h>
#include <stdlib.h>
#include <string.h>

/**
 * SECTION:utils
 * @title: Utils
 * @short_description: Library utility functions
 *
 * Utility functions for the Endless Knowledge Content library.
 */

GQuark
eknc_content_object_error_quark (void)
{
  return g_quark_from_static_string("eknc-content-object-error-quark");
}

/**
 * eknc_utils_append_gparam_from_json_node:
 *
 * For use instantiating a GObject from json data. Marshals the contents
 * of a JsonNode into a GParameter matching the GParamSpec pspec. Appends
 * that GParameter to a GArray, for eventual use with g_object_newv.
 */
void
eknc_utils_append_gparam_from_json_node (JsonNode *node,
                                         GParamSpec *pspec,
                                         GArray *params)
{
  g_autoptr(GError) error = NULL;
  GParameter param = { NULL, { 0, }};

  if (!node)
    return;

  param.name = pspec->name;
  g_value_init (&param.value, pspec->value_type);

  if (G_IS_PARAM_SPEC_VARIANT (pspec))
    {
      GVariantType *type = G_PARAM_SPEC_VARIANT (pspec)->type;
      GVariant *variant = json_gvariant_deserialize (node,
                                                     g_variant_type_peek_string (type),
                                                     &error);
      g_value_set_variant (&param.value, variant);
    }
  else if (JSON_NODE_HOLDS_VALUE (node))
    {
      GValue value = { 0, };
      GType type = json_node_get_value_type (node);

      // Most of our integer properties are stored in json as strings.
      // ImageObject for example was originally trying to follow
      // https://schema.org/ImageObject for its width and height properties,
      // though in practice it is always a string. May be worth a future cleanup,
      // but for now try to parse if we hit this case.
      if (type == G_TYPE_STRING && (pspec->value_type == G_TYPE_INT ||
                                    pspec->value_type == G_TYPE_UINT))
        {
          g_value_init (&value, G_TYPE_INT);
          g_value_set_int (&value, atoi (json_node_get_string (node)));
        }
      else
        {
          json_node_get_value (node, &value);
        }

      if (g_value_type_transformable (pspec->value_type, type))
        g_value_transform (&value, &param.value);
      else
        g_set_error (&error, EKNC_CONTENT_OBJECT_ERROR, EKNC_CONTENT_OBJECT_ERROR_BAD_FORMAT,
                     "Unexpected type %s", g_type_name (type));
    }
  else
    {
      g_set_error (&error, EKNC_CONTENT_OBJECT_ERROR, EKNC_CONTENT_OBJECT_ERROR_BAD_FORMAT,
                   "Unexpected json value");
    }

  if (error)
    g_critical ("Error parsing model property %s: %s",
                pspec->name,
                error->message);
  else
    g_array_append_val (params, param);
}

/**
 * eknc_utils_free_gparam_array:
 *
 * Frees a GArray of GParameters.
 */
void
eknc_utils_free_gparam_array (GArray *params)
{
  for (gint i = 0; i < params->len; i++) {
    GParameter *param = &g_array_index (params, GParameter, i);
    g_value_unset (&param->value);
  }
  g_array_free (params, TRUE);
}

#define EKN_ID_REGEX "^ekn://[^/]*/(?=[A-Za-z0-9]*)(?:.{16}|.{40})$"
/**
 * eknc_utils_is_valid_id:
 * @ekn_id: the ekn id
 *
 * Checks if an ekn id is valid.
 *
 * Returns: true if the ekn id is valid.
 */
gboolean
eknc_utils_is_valid_id (const gchar *ekn_id)
{
  g_autoptr(GRegex) ekn_id_regex = g_regex_new (EKN_ID_REGEX, 0, 0, NULL);
  return g_regex_match (ekn_id_regex, ekn_id, 0, NULL);
}

/**
 * eknc_utils_id_get_hash:
 * @ekn_id: the ekn id
 *
 * Gets a pointer to the hash part of an ekn id.
 *
 * Returns: (transfer none): a pointer to the hash part of the ekn id.
 */
const gchar *
eknc_utils_id_get_hash (const gchar *ekn_id)
{
  if (!eknc_utils_is_valid_id (ekn_id))
    return NULL;
  const gchar *post_uri = ekn_id + strlen ("ekn://");
  return g_strstr_len (post_uri, -1, "/") + 1;
}

/**
 * eknc_get_subscriptions_dir:
 *
 * Gets the user's subscription directory (not app specific one).
 *
 * Returns: (transfer full): a GFile pointing to the directory.
 */
GFile *
eknc_get_subscriptions_dir (void)
{
  g_autofree gchar *path = NULL;
  if (eknc_get_running_under_flatpak ())
    path = g_build_filename (g_get_home_dir (), ".local", "share",
                             "com.endlessm.subscriptions", NULL);
  else
    path = g_build_filename (g_get_user_data_dir (), "com.endlessm.subscriptions", NULL);
  return g_file_new_for_path (path);
}

/**
 * eknc_get_ekn_version:
 * @app_id: knowledge app id
 * @cancellable: (allow-none): optional #GCancellable object, %NULL to ignore.
 * @error: #GError for error reporting.
 *
 * Gets the version of our on disk content format, stored in the EKN_VERSION
 * file.
 *
 * Returns: (transfer full): the version, or NULL if an error occurred
 */
gchar *
eknc_get_ekn_version (const gchar *app_id,
                      GCancellable *cancellable,
                      GError **error)
{
  g_autoptr(GFile) dir = eknc_get_data_dir (app_id);

  // Sanity check
  if (dir == NULL)
    {
      g_set_error (error, G_IO_ERROR, G_IO_ERROR_NOT_FOUND,
                   "No data dir found for app id %s", app_id);
      return NULL;
    }

  g_autoptr(GFile) ekn_version_file = g_file_get_child (dir, "EKN_VERSION");
  g_autofree gchar *contents = NULL;
  if (!g_file_load_contents (ekn_version_file, cancellable, &contents,
                             NULL, NULL, error))
    return NULL;

  gchar *stripped = g_strstrip (contents);
  return g_strdup (stripped);
}

/**
 * eknc_get_current_language:
 *
 * Gets the Xapian-friendly version of the current system language, or NULL if
 * none set.
 *
 * Returns: the language
 */
const gchar *
eknc_get_current_language (void)
{
  const gchar * const * langs = g_get_language_names ();

  guint length = g_strv_length ((gchar **)langs);
  // We don't care about the last entry of the locales list, since it's always
  // 'C'. If we get there without finding a suitable language, return null
  for (guint i = 0; i < length - 1; i++)
    {
      const gchar *lang = langs[i];
      // If the locale includes a country code or codeset (e.g. "en.utf8"), skip it
      if (strpbrk (lang, "_.") == NULL)
          return lang;
    }

  return NULL;
}

struct parallel_init_data {
  int n_left;
  GError *error;
  GCancellable *internal_cancel;
};

static void
parallel_init_abort (struct parallel_init_data *data)
{
  g_cancellable_cancel (data->internal_cancel);
}

static void
init_callback (GObject      *source_object,
               GAsyncResult *result,
               gpointer      user_data)
{
  struct parallel_init_data *data = user_data;
  GError *error = NULL;

  data->n_left--;

  if (!g_async_initable_init_finish (G_ASYNC_INITABLE (source_object), result, &error))
    {
      if (data->error == NULL)
        g_propagate_error (&data->error, error);

      parallel_init_abort (data);
      return;
    }
}

static void
user_cancelled (GCancellable *cancellable,
                gpointer      user_data)
{
  struct parallel_init_data *data = user_data;

  g_cancellable_set_error_if_cancelled (cancellable, &data->error);
  parallel_init_abort (data);
}

/**
 * eknc_utils_parallel_init:
 * @initables: (element-type GAsyncInitable)
 * @io_priority: The IO priority to init at.
 * @cancellable: A #GCancellable
 * @error: The output error.
 *
 * Synchronously initializes a list of #GAsyncInitables in parallel.
 */
gboolean
eknc_utils_parallel_init (GSList        *initables,
                          int            io_priority,
                          GCancellable  *cancellable,
                          GError       **error)
{
  GMainContext *context = g_main_context_new ();
  g_main_context_push_thread_default (context);

  struct parallel_init_data data = {
    .internal_cancel = g_cancellable_new (),
  };

  if (cancellable)
    g_cancellable_connect (cancellable, G_CALLBACK (user_cancelled), &data, NULL);

  data.n_left = g_slist_length (initables);

  GSList *l;
  for (l = initables; l; l = l->next)
    {
      GAsyncInitable *initable = G_ASYNC_INITABLE (l->data);
      g_async_initable_init_async (initable, io_priority, data.internal_cancel, init_callback, &data);
    }

  while (data.n_left > 0)
    g_main_context_iteration (context, TRUE);

  g_object_unref (data.internal_cancel);
  g_main_context_pop_thread_default (context);
  g_main_context_unref (context);

  if (data.error)
    {
      g_propagate_error (error, data.error);
      return FALSE;
    }
  else
    {
      return TRUE;
    }
}

static GFile *
database_dir_from_data_dir (const gchar *data_dir, const gchar *app_id)
{
  g_autofree gchar *database_dir = g_build_filename (data_dir, "ekn", "data",
                                                     app_id, NULL);
  GFile *file = g_file_new_for_path (database_dir);
  if (g_file_query_exists (file, NULL))
      return file;
  g_object_unref (file);
  return NULL;
}

/**
 * eknc_get_running_under_flatpak:
 *
 * Checks if we are running in a flatpak sandbox.
 *
 * Returns: true if we are running in a flatpak sandbox.
 */
gboolean
eknc_get_running_under_flatpak (void)
{
  g_autoptr(GError) error = NULL;
  g_autofree gchar *path = g_build_filename (g_get_user_runtime_dir (),
                                             "flatpak-info", NULL);
  g_autoptr(GKeyFile) keyfile = g_key_file_new ();

  g_key_file_load_from_file (keyfile, path, G_KEY_FILE_NONE, &error);
  if (error)
    return FALSE;

  return TRUE;
}

/**
 * eknc_get_data_dir:
 * @app_id: knowledge app ID, such as "com.endlessm.health-es"
 *
 * Searches for the EKN manifest for a knowledge engine domain
 *
 * This function searches through the system data directories for an EKN
 * data directory for the given domain.
 *
 * Returns: (transfer full): a #GFile pointing to an app content directory, or *null*.
 */
GFile *
eknc_get_data_dir (const gchar *app_id)
{
  GFile *ret;
  // We may be asked for the data dir on behalf of another bundle, in
  // the search provider case -- so detect if we're under flatpak and
  // key off the app ID
  if (eknc_get_running_under_flatpak ())
    {
      g_autofree gchar *flatpak_relative_path = NULL;
      g_autofree gchar *user_path = NULL;
      g_autofree gchar *system_path = NULL;
      g_autofree gchar *split_path = NULL;

      flatpak_relative_path = g_build_filename ("flatpak", "app", app_id,
                                                "current", "active",
                                                "files", "share", NULL);

      // Try the user flatpak location first
      user_path = g_build_filename (g_get_home_dir (), ".local", "share",
                                    flatpak_relative_path, NULL);
      ret = database_dir_from_data_dir (user_path, app_id);
      if (ret)
        return ret;

      // Try the system flatpak location next
      system_path = g_build_filename ("/var", "lib", flatpak_relative_path,
                                      NULL);
      ret = database_dir_from_data_dir (system_path, app_id);
      if (ret)
        return ret;

      // Try the split layout system flatpak location next
      split_path = g_build_filename ("/var", "endless-extra",
                                     flatpak_relative_path, NULL);
      ret = database_dir_from_data_dir (split_path, app_id);
      if (ret)
        return ret;
    }

  // Fall back to the XDG data dirs otherwise
  const gchar * const *dirs = g_get_system_data_dirs ();
  for (gint i = 0; dirs[i]; i++)
    {
      ret = database_dir_from_data_dir (dirs[i], app_id);
      if (ret)
        return ret;
    }

  return NULL;
}

/**
 * eknc_default_vfs_set_shards:
 * @shards: (type GSList(EosShardShardFile)): a list of shard objects
 *
 * Set a list of shards in the default GVfs extension point where to lookup
 * ekn:// uris resources.
 *
 * Returns: TRUE on success, FALSE if an error occurred
 */
gboolean
eknc_default_vfs_set_shards (GSList *shards)
{
  GType shard_type = EOS_SHARD_TYPE_SHARD_FILE;
  GVfs *vfs = g_vfs_get_default ();
  GSList *l;

  if (g_strcmp0 (G_OBJECT_TYPE_NAME (vfs), "EknVfs"))
    {
      g_warning ("Default VFS is not a EknVfs, ekn:// uri wont be supported");
      return FALSE;
    }

  for (l = shards; l && l->data; l = g_slist_next (l))
    {
      if (!g_type_is_a (G_OBJECT_TYPE (l->data), shard_type))
        {
          g_warning ("%s is not a EosShardShardFile", G_OBJECT_TYPE_NAME (l->data));
          return FALSE;
        }

    }

  g_object_set (vfs, "shards", shards, NULL);

  return TRUE;
}

/**
 * eknc_get_subscriptions_json:
 * @app_id: knowledge app ID, such as "com.endlessm.health-es"
 * @cancellable: (allow-none): optional #GCancellable object, %NULL to ignore.
 * @error: #GError for error reporting.
 *
 * Reads the subscriptions json file for a given app_id.
 *
 * Returns: (transfer full): the JsonNode for the given app id
 */
JsonNode *
eknc_get_subscriptions_json (const gchar *app_id,
                             GCancellable *cancellable,
                             GError **error)
{
  g_return_val_if_fail (app_id && *app_id, NULL);
  g_return_val_if_fail (G_IS_CANCELLABLE (cancellable) || cancellable == NULL, NULL);
  g_return_val_if_fail (error == NULL || *error == NULL, NULL);

  g_autoptr(GFile) data_dir = eknc_get_data_dir (app_id);
  if (data_dir == NULL)
    {
      g_set_error (error, G_IO_ERROR, G_IO_ERROR_NOT_FOUND,
                   "Could not find datadir for app id %s", app_id);
      return NULL;
    }

  g_autoptr(GFile) subscriptions_file = g_file_get_child (data_dir, "subscriptions.json");
  g_autofree gchar *contents = NULL;
  if (!g_file_load_contents (subscriptions_file, cancellable, &contents,
                             NULL, NULL, error))
    return NULL;

  return json_from_string (contents, error);
}
