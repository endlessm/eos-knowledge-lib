/* Copyright 2016 Endless Mobile, Inc. */

#pragma once

#include "eknc-content-object-model.h"

G_BEGIN_DECLS

EkncContentObjectModel *
eknc_object_model_from_json_node (JsonNode *node,
                                  GError **error);

G_END_DECLS
