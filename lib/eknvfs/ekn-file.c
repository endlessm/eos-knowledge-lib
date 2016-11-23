/* -*- mode: C; c-file-style: "gnu"; indent-tabs-mode: nil; -*- */
/*
 * ekn-file.c
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
#include "ekn-file-input-stream-wrapper.h"

#define EKN_SCHEME_LEN 6

struct _EknFile
{
  GObject parent;
};

typedef struct
{
  gchar *uri;
  EosShardBlob *blob;
} EknFilePrivate;

enum
{
  PROP_0,

  PROP_URI,
  PROP_BLOB,
  N_PROPERTIES
};

static GParamSpec *properties[N_PROPERTIES];

static void ekn_file_iface_init (gpointer g_iface, gpointer iface_data);

G_DEFINE_TYPE_EXTENDED (EknFile,
			ekn_file,
			G_TYPE_OBJECT, 0,
			G_ADD_PRIVATE (EknFile)
			G_IMPLEMENT_INTERFACE (G_TYPE_FILE,
                                               ekn_file_iface_init))

#define EKN_FILE_PRIVATE(d) ((EknFilePrivate *) ekn_file_get_instance_private((EknFile*)d))

static void
ekn_file_init (EknFile *self)
{

}

static void
ekn_file_finalize (GObject *self)
{
  EknFilePrivate *priv = EKN_FILE_PRIVATE (self);

  g_clear_pointer (&priv->uri, g_free);
  g_clear_pointer (&priv->blob, eos_shard_blob_unref);
  
  G_OBJECT_CLASS (ekn_file_parent_class)->finalize (self);
}

static inline void
ekn_file_set_uri (EknFile *self, const gchar *uri)
{
  EknFilePrivate *priv = EKN_FILE_PRIVATE (self);

  g_return_if_fail (g_str_has_prefix (uri, "ekn:"));

  if (g_strcmp0 (priv->uri, uri) != 0)
    {
      g_free (priv->uri);
      priv->uri = g_strdup (uri);
      g_object_notify_by_pspec (G_OBJECT (self), properties[PROP_URI]);
    }
}

static inline void
ekn_file_set_blob (EknFile *self, EosShardBlob *blob)
{
  EknFilePrivate *priv = EKN_FILE_PRIVATE (self);

  g_clear_pointer (&priv->blob, eos_shard_blob_unref);
  
  if (blob)
    priv->blob = eos_shard_blob_ref (blob);

  g_object_notify_by_pspec (G_OBJECT (self), properties[PROP_BLOB]);
}

static void
ekn_file_set_property (GObject      *self,
                       guint         prop_id,
                       const GValue *value,
                       GParamSpec   *pspec)
{
  g_return_if_fail (EKN_IS_FILE (self));

  switch (prop_id)
    {
    case PROP_URI:
      ekn_file_set_uri (EKN_FILE (self), g_value_get_string (value));
      break;
    case PROP_BLOB:
      ekn_file_set_blob (EKN_FILE (self), g_value_get_pointer (value));
      break;
    default:
      G_OBJECT_WARN_INVALID_PROPERTY_ID (self, prop_id, pspec);
      break;
    }
}

static void
ekn_file_get_property (GObject    *self,
                       guint       prop_id,
                       GValue     *value,
                       GParamSpec *pspec)
{
  EknFilePrivate *priv;

  g_return_if_fail (EKN_IS_FILE (self));
  priv = EKN_FILE_PRIVATE (self);

  switch (prop_id)
    {
    case PROP_URI:
      g_value_set_string (value, priv->uri);
      break;
    case PROP_BLOB:
      g_value_set_pointer (value, priv->blob);
      break;
    default:
      G_OBJECT_WARN_INVALID_PROPERTY_ID (self, prop_id, pspec);
      break;
    }
}

/* GFile iface implementation */

static GFile *
ekn_file_dup (GFile *self)
{
  EknFilePrivate *priv = EKN_FILE_PRIVATE (self);
  return _ekn_file_new (priv->uri, priv->blob);
}

static guint
ekn_file_hash (GFile *self)
{
  return g_str_hash (EKN_FILE_PRIVATE (self)->uri);
}

static gboolean
ekn_file_equal (GFile *file1, GFile *file2)
{
  return g_str_equal (EKN_FILE_PRIVATE (file1)->uri, EKN_FILE_PRIVATE (file2)->uri);
}

static gboolean
ekn_file_is_native (GFile *self)
{
  return TRUE;
}

static gboolean 
ekn_file_has_uri_scheme (GFile *self, const char *uri_scheme)
{
  return g_str_equal ("ekn", uri_scheme);
}

static char *
ekn_file_get_uri_scheme (GFile *self)
{
  return g_strdup ("ekn");
}

static char *
ekn_file_get_basename (GFile *self)
{
  EknFilePrivate *priv = EKN_FILE_PRIVATE (self);
  return priv->uri ? g_path_get_basename (priv->uri + EKN_SCHEME_LEN) : NULL;
}

static char *
ekn_file_get_path (GFile *self)
{
  EknFilePrivate *priv = EKN_FILE_PRIVATE (self);
  return priv->uri ? g_strdup (priv->uri + EKN_SCHEME_LEN) : NULL;
}

static char *
ekn_file_get_uri (GFile *self)
{
  return g_strdup (EKN_FILE_PRIVATE (self)->uri);
}

static char *
ekn_file_get_parse_name (GFile *self)
{
  return g_strdup (EKN_FILE_PRIVATE (self)->uri);
}

static GFile *
ekn_file_get_parent (GFile *self)
{
  return NULL;
}

static GFileInfo *
ekn_file_query_info (GFile                *self,
                     const char           *attributes,
                     GFileQueryInfoFlags   flags,
                     GCancellable         *cancellable,
                     GError              **error)
{
  EknFilePrivate *priv = EKN_FILE_PRIVATE (self);
  GFileAttributeMatcher *matcher;
  GFileInfo *info;

  info    = g_file_info_new ();
  matcher = g_file_attribute_matcher_new (attributes);

  if (g_file_attribute_matcher_matches (matcher, G_FILE_ATTRIBUTE_STANDARD_SIZE))
    g_file_info_set_size (info, eos_shard_blob_get_content_size (priv->blob));

  if (g_file_attribute_matcher_matches (matcher, G_FILE_ATTRIBUTE_STANDARD_CONTENT_TYPE))
    g_file_info_set_content_type (info, eos_shard_blob_get_content_type (priv->blob));

  g_file_attribute_matcher_unref (matcher);

  return info;
}

static GFileInputStream *
ekn_file_read_fn (GFile *self, GCancellable *cancellable, GError **error)
{
  GInputStream *stream = eos_shard_blob_get_stream (EKN_FILE_PRIVATE (self)->blob);
  return _ekn_file_input_stream_wrapper_new (self, stream);
}

static void
ekn_file_iface_init (gpointer g_iface, gpointer iface_data)
{
  GFileIface *iface = g_iface;

  iface->dup            = ekn_file_dup;
  iface->hash           = ekn_file_hash;
  iface->equal          = ekn_file_equal;
  iface->is_native      = ekn_file_is_native;
  iface->has_uri_scheme = ekn_file_has_uri_scheme;
  iface->get_uri_scheme = ekn_file_get_uri_scheme;
  iface->get_basename   = ekn_file_get_basename;
  iface->get_path       = ekn_file_get_path;
  iface->get_uri        = ekn_file_get_uri;
  iface->get_parse_name = ekn_file_get_parse_name;
  iface->get_parent     = ekn_file_get_parent;
  iface->query_info     = ekn_file_query_info;
  iface->read_fn        = ekn_file_read_fn;
}

static void
ekn_file_class_init (EknFileClass *klass)
{
  GObjectClass *object_class = G_OBJECT_CLASS (klass);

  object_class->finalize     = ekn_file_finalize;
  object_class->get_property = ekn_file_get_property;
  object_class->set_property = ekn_file_set_property;

  /* Properties */
  properties[PROP_URI] =
    g_param_spec_string ("uri",
                         "URI",
                         "EOS Knowledge URI",
                         NULL,
                         G_PARAM_READWRITE |
                         G_PARAM_CONSTRUCT_ONLY |
                         G_PARAM_STATIC_STRINGS);

  properties[PROP_BLOB] =
    g_param_spec_pointer ("blob",
                          "Blob",
                          "EosShardBlob for uri",
                          G_PARAM_READWRITE |
                          G_PARAM_CONSTRUCT_ONLY |
                          G_PARAM_STATIC_STRINGS);

  g_object_class_install_properties (object_class, N_PROPERTIES, properties);
}

GFile *
_ekn_file_new (const gchar *uri, EosShardBlob *blob)
{
  return g_object_new (EKN_TYPE_FILE, "uri", uri, "blob", blob, NULL);
}
