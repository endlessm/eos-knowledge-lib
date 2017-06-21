/* Copyright 2017 Endless Mobile, Inc. */

#pragma once

#include "eknc-content-object-model.h"

#include <gio/gio.h>
#include <json-glib/json-glib.h>

G_BEGIN_DECLS

#define EKNC_TYPE_DICTIONARY_OBJECT_MODEL eknc_dictionary_object_model_get_type ()
G_DECLARE_DERIVABLE_TYPE (EkncDictionaryObjectModel, eknc_dictionary_object_model, EKNC, DICTIONARY_OBJECT_MODEL, EkncContentObjectModel)

struct _EkncDictionaryObjectModelClass
{
  EkncContentObjectModelClass parent_class;
};

EkncContentObjectModel *
eknc_dictionary_object_model_new_from_json_node (JsonNode *node);

G_END_DECLS

