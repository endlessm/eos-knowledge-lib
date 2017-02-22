/* Copyright 2016 Endless Mobile, Inc. */

#pragma once

#include "eknc-content-object-model.h"
#include "eknc-query-object.h"
#include "eknc-query-results.h"
#include "eknc-xapian-bridge.h"

#include <gio/gio.h>

G_BEGIN_DECLS

#define EKNC_TYPE_DOMAIN eknc_domain_get_type ()
G_DECLARE_FINAL_TYPE (EkncDomain, eknc_domain, EKNC, DOMAIN, GObject)

/**
 * EkncDomainError:
 * @EKNC_DOMAIN_ERROR_APP_ID_NOT_SET: App id property not set on object
 * @EKNC_DOMAIN_ERROR_ID_NOT_FOUND: Requested ekn id object not found
 * @EKNC_DOMAIN_ERROR_BAD_SUBSCRIPTIONS: Error found while parsing the subscriptions.json
 * @EKNC_DOMAIN_ERROR_BAD_MANIFEST: Error found while parsing the manifest.json
 * @EKNC_DOMAIN_ERROR_BAD_RESULTS: Error found while parsing the results json from xapian
 * @EKNC_DOMAIN_ERROR_UNSUPPORTED_VERSION: Unsupported version of content found
 *
 * Error enumeration for domain related errors.
 */
typedef enum {
  EKNC_DOMAIN_ERROR_APP_ID_NOT_SET,
  EKNC_DOMAIN_ERROR_ID_NOT_FOUND,
  EKNC_DOMAIN_ERROR_BAD_SUBSCRIPTIONS,
  EKNC_DOMAIN_ERROR_BAD_MANIFEST,
  EKNC_DOMAIN_ERROR_BAD_RESULTS,
  EKNC_DOMAIN_ERROR_UNSUPPORTED_VERSION,
} EkncDomainError;

#define EKNC_DOMAIN_ERROR eknc_domain_error_quark ()
GQuark eknc_domain_error_quark (void);

const gchar *
eknc_domain_get_subscription_id (EkncDomain *self);

GSList *
eknc_domain_get_shards (EkncDomain *self);

const gchar *
eknc_domain_test_link (EkncDomain *self,
                       const gchar *link,
                       GError **error);

void
eknc_domain_get_object (EkncDomain *self,
                        const gchar *id,
                        GCancellable *cancellable,
                        GAsyncReadyCallback callback,
                        gpointer user_data);

EkncContentObjectModel *
eknc_domain_get_object_finish (EkncDomain *self,
                               GAsyncResult *result,
                               GError **error);

void
eknc_domain_get_fixed_query (EkncDomain *self,
                             EkncQueryObject *query,
                             GCancellable *cancellable,
                             GAsyncReadyCallback callback,
                             gpointer user_data);

EkncQueryObject *
eknc_domain_get_fixed_query_finish (EkncDomain *self,
                                    GAsyncResult *result,
                                    GError **error);

void
eknc_domain_query (EkncDomain *self,
                   EkncQueryObject *query,
                   GCancellable *cancellable,
                   GAsyncReadyCallback callback,
                   gpointer user_data);

gboolean
eknc_domain_read_uri (EkncDomain *self,
                      const gchar *uri,
                      GBytes **bytes,
                      const gchar **mime_type,
                      GError **error);

EkncQueryResults *
eknc_domain_query_finish (EkncDomain *self,
                          GAsyncResult *result,
                          GError **error);

G_END_DECLS
