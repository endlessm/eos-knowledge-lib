/* -*- mode: C; c-file-style: "gnu"; indent-tabs-mode: nil; -*- */

/* Copyright 2016 Endless Mobile, Inc. */

#pragma once

#include <gio/gio.h>

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
eknc_get_running_under_flatpak (void);

GFile *
eknc_get_data_dir (const gchar *app_id);

G_END_DECLS
