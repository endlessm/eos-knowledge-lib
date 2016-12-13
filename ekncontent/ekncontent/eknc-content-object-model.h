/* Copyright 2016 Endless Mobile, Inc. */

#pragma once

#include <gio/gio.h>
#include <json-glib/json-glib.h>

G_BEGIN_DECLS

#define EKNC_TYPE_CONTENT_OBJECT_MODEL eknc_content_object_model_get_type ()
G_DECLARE_DERIVABLE_TYPE (EkncContentObjectModel, eknc_content_object_model, EKNC, CONTENT_OBJECT_MODEL, GObject)

struct _EkncContentObjectModelClass
{
  GObjectClass parent_class;

  gpointer padding[8];
};

EkncContentObjectModel *
eknc_content_object_model_new_from_json_node (JsonNode *node);

GVariant *
eknc_content_object_model_get_tags (EkncContentObjectModel *self);

GVariant *
eknc_content_object_model_get_resources (EkncContentObjectModel *self);

GFileInputStream *
eknc_content_object_model_get_content_stream (EkncContentObjectModel *self,
                                              GError **error);

G_END_DECLS
