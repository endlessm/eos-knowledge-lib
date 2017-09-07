/* Copyright 2016 Endless Mobile, Inc. */

#pragma once

#include "eknc-query-object.h"

#include <gio/gio.h>
#include <json-glib/json-glib.h>

G_BEGIN_DECLS

#define EKNC_TYPE_XAPIAN_BRIDGE eknc_xapian_bridge_get_type ()
G_DECLARE_FINAL_TYPE (EkncXapianBridge, eknc_xapian_bridge, EKNC, XAPIAN_BRIDGE, GObject)

void
eknc_xapian_bridge_get_fixed_query (EkncXapianBridge *self,
                                    EkncQueryObject *query,
                                    GHashTable *extra_params,
                                    GCancellable *cancellable,
                                    GAsyncReadyCallback callback,
                                    gpointer user_data);

EkncQueryObject *
eknc_xapian_bridge_get_fixed_query_finish (EkncXapianBridge *self,
                                           GAsyncResult *result,
                                           GError **error);

void
eknc_xapian_bridge_query (EkncXapianBridge *self,
                          EkncQueryObject *query,
                          GHashTable *extra_params,
                          GCancellable *cancellable,
                          GAsyncReadyCallback callback,
                          gpointer user_data);

JsonNode *
eknc_xapian_bridge_query_finish (EkncXapianBridge *self,
                                 GAsyncResult *result,
                                 GError **error);

G_END_DECLS
