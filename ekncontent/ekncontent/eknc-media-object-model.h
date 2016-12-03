/* Copyright 2016 Endless Mobile, Inc. */

#pragma once

#include "eknc-content-object-model.h"

#include <gio/gio.h>
#include <json-glib/json-glib.h>

G_BEGIN_DECLS

#define EKNC_TYPE_MEDIA_OBJECT_MODEL eknc_media_object_model_get_type ()
G_DECLARE_DERIVABLE_TYPE (EkncMediaObjectModel, eknc_media_object_model, EKNC, MEDIA_OBJECT_MODEL, EkncContentObjectModel)

struct _EkncMediaObjectModelClass
{
  EkncContentObjectModelClass parent_class;

  gpointer padding[8];
};

EkncContentObjectModel *
eknc_media_object_model_new_from_json_node (JsonNode *node);

G_END_DECLS
