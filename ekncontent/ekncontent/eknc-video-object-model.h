/* Copyright 2016 Endless Mobile, Inc. */

#pragma once

#include "eknc-media-object-model.h"

#include <gio/gio.h>
#include <json-glib/json-glib.h>

G_BEGIN_DECLS

#define EKNC_TYPE_VIDEO_OBJECT_MODEL eknc_video_object_model_get_type ()
G_DECLARE_DERIVABLE_TYPE (EkncVideoObjectModel, eknc_video_object_model, EKNC, VIDEO_OBJECT_MODEL, EkncMediaObjectModel)

struct _EkncVideoObjectModelClass
{
  EkncMediaObjectModelClass parent_class;

  gpointer padding[8];
};

EkncContentObjectModel *
eknc_video_object_model_new_from_json_node (JsonNode *node);

G_END_DECLS
