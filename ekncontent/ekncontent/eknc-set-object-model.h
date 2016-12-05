/* Copyright 2016 Endless Mobile, Inc. */

#pragma once

#include "eknc-content-object-model.h"

#include <gio/gio.h>
#include <json-glib/json-glib.h>

G_BEGIN_DECLS

#define EKNC_TYPE_SET_OBJECT_MODEL eknc_set_object_model_get_type ()
G_DECLARE_DERIVABLE_TYPE (EkncSetObjectModel, eknc_set_object_model, EKNC, SET_OBJECT_MODEL, EkncContentObjectModel)

struct _EkncSetObjectModelClass
{
  EkncContentObjectModelClass parent_class;

  gpointer padding[8];
};

GVariant *
eknc_set_object_model_get_child_tags (EkncSetObjectModel *self);

EkncContentObjectModel *
eknc_set_object_model_new_from_json_node (JsonNode *node);

G_END_DECLS
