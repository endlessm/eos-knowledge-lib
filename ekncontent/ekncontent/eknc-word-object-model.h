/* Copyright 2017 Endless Mobile, Inc. */

#pragma once

#include "eknc-content-object-model.h"

#include <gio/gio.h>
#include <json-glib/json-glib.h>

G_BEGIN_DECLS

#define EKNC_TYPE_WORD_OBJECT_MODEL eknc_word_object_model_get_type ()
G_DECLARE_DERIVABLE_TYPE (EkncWordObjectModel, eknc_word_object_model, EKNC, WORD_OBJECT_MODEL, EkncContentObjectModel)

struct _EkncWordObjectModelClass
{
  EkncContentObjectModelClass parent_class;

  gpointer padding[8];
};

EkncContentObjectModel *
eknc_word_object_model_new_from_json_node (JsonNode *node);

G_END_DECLS
