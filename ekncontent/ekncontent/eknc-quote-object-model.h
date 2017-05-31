/* Copyright 2017 Endless Mobile, Inc. */

#pragma once

#include "eknc-content-object-model.h"

#include <gio/gio.h>
#include <json-glib/json-glib.h>

G_BEGIN_DECLS

#define EKNC_TYPE_QUOTE_OBJECT_MODEL eknc_quote_object_model_get_type ()
G_DECLARE_DERIVABLE_TYPE (EkncQuoteObjectModel, eknc_quote_object_model, EKNC, QUOTE_OBJECT_MODEL, EkncContentObjectModel)

struct _EkncQuoteObjectModelClass
{
  EkncContentObjectModelClass parent_class;

  gpointer padding[8];
};

EkncContentObjectModel *
eknc_quote_object_model_new_from_json_node (JsonNode *node);

G_END_DECLS
