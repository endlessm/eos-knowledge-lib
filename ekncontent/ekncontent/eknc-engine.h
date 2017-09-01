/* Copyright 2016 Endless Mobile, Inc. */

#pragma once

#include "eknc-content-object-model.h"
#include "eknc-domain.h"

#include <gio/gio.h>

G_BEGIN_DECLS

#define EKNC_TYPE_ENGINE eknc_engine_get_type ()
G_DECLARE_FINAL_TYPE (EkncEngine, eknc_engine, EKNC, ENGINE, GObject)

gchar *
eknc_engine_test_link (EkncEngine *self,
                       const gchar *link,
                       GError **error);

gchar *
eknc_engine_test_link_for_app (EkncEngine *self,
                               const gchar *link,
                               const gchar *app_id,
                               GError **error);
void
eknc_engine_get_object (EkncEngine *self,
                        const gchar *id,
                        GCancellable *cancellable,
                        GAsyncReadyCallback callback,
                        gpointer user_data);

EkncContentObjectModel *
eknc_engine_get_object_finish (EkncEngine *self,
                               GAsyncResult *result,
                               GError **error);

void
eknc_engine_get_object_for_app (EkncEngine *self,
                                const gchar *id,
                                const gchar *app_id,
                                GCancellable *cancellable,
                                GAsyncReadyCallback callback,
                                gpointer user_data);

EkncContentObjectModel *
eknc_engine_get_object_for_app_finish (EkncEngine *self,
                                       GAsyncResult *result,
                                       GError **error);

void
eknc_engine_query (EkncEngine *self,
                   EkncQueryObject *query,
                   GCancellable *cancellable,
                   GAsyncReadyCallback callback,
                   gpointer user_data);

EkncQueryResults *
eknc_engine_query_finish (EkncEngine *self,
                          GAsyncResult *result,
                          GError **error);

EkncDomain *
eknc_engine_get_domain (EkncEngine *self,
                        GError **error);

EkncDomain *
eknc_engine_get_domain_for_app (EkncEngine *self,
                                const gchar *app_id,
                                GError **error);

void
eknc_engine_add_domain_for_path (EkncEngine *self,
                                 const gchar *app_id,
                                 const gchar *path,
                                 GError **error);

EkncEngine *
eknc_engine_get_default (void);

G_END_DECLS
