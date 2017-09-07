/* Copyright 2016 Endless Mobile, Inc. */

#pragma once

#include "eknc-query-object.h"

#include <gio/gio.h>
#include <json-glib/json-glib.h>

G_BEGIN_DECLS

#define EKNC_TYPE_XAPIAN_BRIDGE eknc_xapian_bridge_get_type ()
G_DECLARE_FINAL_TYPE (EkncXapianBridge, eknc_xapian_bridge, EKNC, XAPIAN_BRIDGE, GObject)

/**
 * EkncXapianBridgeError:
 * @EKNC_XAPIAN_BRIDGE_ERROR_BAD_STATUS: bad status code from xapian http request
 * @EKNC_XAPIAN_BRIDGE_ERROR_BAD_JSON: malformed json from xapian bridge
 *
 * Error enumeration for error communicating to and from the xapian bridge.
 */
typedef enum {
  EKNC_XAPIAN_BRIDGE_ERROR_BAD_STATUS,
  EKNC_XAPIAN_BRIDGE_ERROR_BAD_JSON,
} EkncXapianBridgeError;

#define EKNC_XAPIAN_BRIDGE_ERROR eknc_xapian_bridge_error_quark ()
GQuark eknc_xapian_bridge_error_quark (void);

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
