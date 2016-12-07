/* -*- mode: C; c-file-style: "gnu"; indent-tabs-mode: nil; -*- */
/*
 * ekn-vfs.c
 *
 * Copyright (C) 2016 Endless Mobile, Inc.
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
 *
 * Author: Juan Pablo Ugarte <ugarte@endlessm.com>
 *
 */

#include "ekn-file.h"
#include <string.h>
#include <eos-shard/eos-shard-shard-file.h>
#include <eos-shard/eos-shard-record.h>

#define EKN_TYPE_VFS (ekn_vfs_get_type ())
G_DECLARE_FINAL_TYPE (EknVfs, ekn_vfs, EKN, VFS, GVfs)

#define EKN_URI "ekn"
#define EKN_SCHEME_LEN 6

struct _EknVfs
{
  GVfs parent;
};

typedef struct
{
  GSList *shards;         /* EosShardShardFile list */

  GHashTable *extensions; /* (uri, GVfs *) table */
  gchar     **schemes;    /* Schemes suported by all GVfs in extensions table */
  GVfs       *local;      /* see g_vfs_get_local () */
} EknVfsPrivate;

enum
{
  PROP_0,

  PROP_SHARDS,
  N_PROPERTIES
};

static GParamSpec *properties[N_PROPERTIES];

G_DEFINE_DYNAMIC_TYPE_EXTENDED (EknVfs,
				ekn_vfs,
				G_TYPE_VFS, 0,
				G_ADD_PRIVATE_DYNAMIC (EknVfs))

#define EKN_VFS_PRIVATE(d) ((EknVfsPrivate *) ekn_vfs_get_instance_private((EknVfs*)d))

static inline gpointer
extension_object_new (GType type)
{
  if (g_type_is_a (type, G_TYPE_INITABLE))
    return g_initable_new (type, NULL, NULL, NULL);
  else
    return g_object_new (type, NULL);
}

static void
ekn_vfs_extension_points_init (EknVfs *self)
{
  EknVfsPrivate *priv = EKN_VFS_PRIVATE (self);
  GIOExtensionPoint *epoint;
  GList *l;

  /* Get the local vfs first */
  priv->local = g_object_ref (g_vfs_get_local ());

  /* Hash table to quickly get the extension point with higher priority that
   * supports a uri scheme.
   */
  priv->extensions = g_hash_table_new_full (g_str_hash, g_str_equal,
                                            NULL, g_object_unref);

  /* Get GVfs extension point */
  if (!(epoint = g_io_extension_point_lookup (G_VFS_EXTENSION_POINT_NAME)))
    return;

  /* Iterate over the list of Gvfs extension points */
  for (l = g_io_extension_point_get_extensions (epoint); l && l->data; l = g_list_next (l))
    {
      GIOExtension *extension = l->data;
      GType type = g_io_extension_get_type (extension);
      const gchar * const *schemes;
      GVfs *vfs;
      gint i;

      /* Skip ourself */
      if (type == EKN_TYPE_VFS)
        continue;

      if (type == G_OBJECT_TYPE (priv->local))
        vfs = g_object_ref (priv->local);
      else
        vfs = extension_object_new (type);

      /* Skip uninstantiable extensions points */
      if (vfs == NULL)
        continue;

      /* Get all the native schemes suported by the extension point */
      schemes = (* G_VFS_GET_CLASS (vfs)->get_supported_uri_schemes) (vfs);

      /* Add them in out hash table */
      for (i = 0; schemes && schemes[i]; i++)
        {
          if (!g_hash_table_lookup (priv->extensions, schemes[i]))
            g_hash_table_insert (priv->extensions,
                                 (gpointer) schemes[i],
                                 g_object_ref (vfs));
        }

      g_object_unref (vfs);
    }
}

static void
ekn_vfs_init (EknVfs *self)
{
  EknVfsPrivate *priv = EKN_VFS_PRIVATE (self);
  gchar **schemes;
  guint length;

  /* Init priv->extensions hash table */
  ekn_vfs_extension_points_init (self);

  /* Get suported all uri schemes */
  schemes = (gchar **) g_hash_table_get_keys_as_array (priv->extensions, &length);
  priv->schemes = g_realloc (schemes, (length + 2) * sizeof (gchar *));

  /* And append our custom scheme at the end */
  priv->schemes[length]   = EKN_URI;
  priv->schemes[++length] = NULL;
}

static void
ekn_vfs_finalize (GObject *self)
{
  EknVfsPrivate *priv = EKN_VFS_PRIVATE (self);

  g_free (priv->schemes);
  g_clear_pointer (&priv->extensions, g_hash_table_unref);

  G_OBJECT_CLASS (ekn_vfs_parent_class)->finalize (self);
}

static void
ekn_vfs_dispose (GObject *self)
{
  EknVfsPrivate *priv = EKN_VFS_PRIVATE (self);

  g_clear_pointer (&priv->shards, g_slist_free_full);
  g_clear_object (&priv->local);

  G_OBJECT_CLASS (ekn_vfs_parent_class)->dispose (self);
}

static inline void
ekn_vfs_set_shards (EknVfs *self, GSList *shards)
{
  EknVfsPrivate *priv = EKN_VFS_PRIVATE (self);

  g_slist_free_full (priv->shards, g_object_unref);

  priv->shards = shards ? g_slist_copy_deep (shards, (GCopyFunc) g_object_ref, NULL) : NULL;

  g_object_notify_by_pspec (G_OBJECT (self), properties[PROP_SHARDS]);
}

static void
ekn_vfs_set_property (GObject      *self,
                      guint         prop_id,
                      const GValue *value,
                      GParamSpec   *pspec)
{
  g_return_if_fail (EKN_IS_VFS (self));

  switch (prop_id)
    {
    case PROP_SHARDS:
      ekn_vfs_set_shards (EKN_VFS (self), g_value_get_pointer (value));
      break;
    default:
      G_OBJECT_WARN_INVALID_PROPERTY_ID (self, prop_id, pspec);
      break;
    }
}

static void
ekn_vfs_get_property (GObject    *self,
                      guint       prop_id,
                      GValue     *value,
                      GParamSpec *pspec)
{
  EknVfsPrivate *priv;

  g_return_if_fail (EKN_IS_VFS (self));
  priv = EKN_VFS_PRIVATE (self);

  switch (prop_id)
    {
    case PROP_SHARDS:
      g_value_set_pointer (value, priv->shards);
      break;
    default:
      G_OBJECT_WARN_INVALID_PROPERTY_ID (self, prop_id, pspec);
      break;
    }
}

static gboolean
ekn_vfs_is_active (GVfs *self)
{
  return TRUE;
}

static GFile *
ekn_vfs_get_file_for_path (GVfs *self, const char *path)
{
  return g_vfs_get_file_for_path (EKN_VFS_PRIVATE (self)->local, path);
}

static GFile *
ekn_vfs_get_file_for_uri (GVfs *self, const char *uri)
{
  EknVfsPrivate *priv = EKN_VFS_PRIVATE (self);
  GFile *retval = NULL;

  if (uri && g_str_has_prefix (uri, EKN_URI":"))
    {
      /* The URI is of the form 'ekn://domain/hash[/resource]' */
      /* Domain is part of legacy bundle support and should not be used
       * for modern content. */
      gchar **tokens = g_strsplit (uri + EKN_SCHEME_LEN, "/", -1);

      if (tokens && tokens[0] && tokens[1])
        {
          EosShardRecord *record = NULL;
          GSList *l;

          /* iterate over all shards until we find a matching record */
          for (l = priv->shards; l && !record; l = g_slist_next (l))
            record = eos_shard_shard_file_find_record_by_hex_name (l->data, tokens[1]);

          if (record)
            {
              EosShardBlob *blob = record->data;

              /* Use resource, if present */
              if (tokens[2])
                blob = eos_shard_record_lookup_blob (record, tokens[2]);

              if (blob)
                retval = _ekn_file_new (uri, blob);
            }
        }

      g_strfreev (tokens);
    }
  else if (uri && priv->extensions)
    {
      gchar *scheme   = g_uri_parse_scheme (uri);
      GVfs  *delegate = g_hash_table_lookup (priv->extensions, scheme);

      if (delegate)
        retval = g_vfs_get_file_for_uri (delegate, uri);

      g_free (scheme);
    }

  /* This method should never fail */
  return retval ? retval : g_vfs_get_file_for_uri (priv->local, uri);
}

static const gchar * const *
ekn_vfs_get_supported_uri_schemes (GVfs *self)
{
  return (const gchar * const *) EKN_VFS_PRIVATE (self)->schemes;
}

static GFile *
ekn_vfs_parse_name (GVfs *self, const char *parse_name)
{
  if (g_path_is_absolute (parse_name))
    return g_vfs_parse_name (EKN_VFS_PRIVATE (self)->local, parse_name);
  else
    return ekn_vfs_get_file_for_uri (self, parse_name);
}

static void
ekn_vfs_class_init (EknVfsClass *klass)
{
  GObjectClass *object_class = G_OBJECT_CLASS (klass);
  GVfsClass    *vfs_class    = G_VFS_CLASS (klass);

  object_class->finalize     = ekn_vfs_finalize;
  object_class->dispose      = ekn_vfs_dispose;
  object_class->set_property = ekn_vfs_set_property;
  object_class->get_property = ekn_vfs_get_property;

  vfs_class->is_active                 = ekn_vfs_is_active;
  vfs_class->get_file_for_path         = ekn_vfs_get_file_for_path;
  vfs_class->get_file_for_uri          = ekn_vfs_get_file_for_uri;
  vfs_class->get_supported_uri_schemes = ekn_vfs_get_supported_uri_schemes;
  vfs_class->parse_name                = ekn_vfs_parse_name;

  /* Properties */
  properties[PROP_SHARDS] =
    g_param_spec_pointer ("shards",
                          "Shards",
                          "Add a EosShardShardFile object to the list of shards to lookup ekn uris",
                          G_PARAM_READWRITE);

  g_object_class_install_properties (object_class, N_PROPERTIES, properties);
}

static void
ekn_vfs_class_finalize (EknVfsClass *klass)
{
}

/************************** GIO Module entry points ***************************/
void
g_io_module_load (GIOModule *module)
{
  ekn_vfs_register_type (G_TYPE_MODULE (module));
  g_io_extension_point_implement (G_VFS_EXTENSION_POINT_NAME,
                                  EKN_TYPE_VFS,
                                  "ekn-vfs",
                                  G_MAXINT);
}

void
g_io_module_unload (GIOModule *module)
{
}

char **
g_io_module_query (void)
{
  char **epoints = g_new0 (gchar *, 2);
  epoints[0] = g_strdup (G_VFS_EXTENSION_POINT_NAME);
  return epoints;
}
