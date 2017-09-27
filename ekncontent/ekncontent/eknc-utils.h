/* -*- mode: C; c-file-style: "gnu"; indent-tabs-mode: nil; -*- */

/* Copyright 2016 Endless Mobile, Inc. */

#pragma once

#include <gio/gio.h>
#include <json-glib/json-glib.h>

G_BEGIN_DECLS

/**
 * EkncContentObjectError:
 * @EKNC_CONTENT_OBJECT_ERROR_BAD_FORMAT: unexpected format in metadata json
 *
 * Error enumeration for object model creation.
 */
typedef enum {
  EKNC_CONTENT_OBJECT_ERROR_BAD_FORMAT,
} EkncContentObjectError;

#define EKNC_CONTENT_OBJECT_ERROR eknc_content_object_error_quark ()
GQuark eknc_content_object_error_quark (void);

gboolean
eknc_utils_parallel_init (GSList        *initables,
                          int            io_priority,
                          GCancellable  *cancellable,
                          GError       **error);

gboolean
eknc_default_vfs_set_shards (GSList *shards);

gboolean
eknc_utils_is_valid_id (const gchar *ekn_id);

GFile *
eknc_get_data_dir (const gchar *app_id);

GList *
eknc_get_extensions_dirs (const gchar *app_id);

gchar *
eknc_get_ekn_version (const gchar *app_id,
                      GCancellable *cancellable,
                      GError **error);

const gchar *
eknc_get_current_language (void);

JsonNode *
eknc_get_subscriptions_json (const gchar *app_id,
                             GCancellable *cancellable,
                             GError **error);

G_END_DECLS
