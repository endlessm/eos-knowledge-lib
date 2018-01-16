/* Copyright 2016 Endless Mobile, Inc. */

#include "eknc-image-object-model.h"

#include "eknc-utils-private.h"
#include "eknc-media-object-model-private.h"

#include <endless/endless.h>

/**
 * SECTION:image-object-model
 * @title: Image Object Model
 * @short_description: Access image object metadata
 *
 * The model class for image objects.
 */
G_DEFINE_TYPE (EkncImageObjectModel,
               eknc_image_object_model,
               EKNC_TYPE_MEDIA_OBJECT_MODEL)

static void
eknc_image_object_model_class_init (EkncImageObjectModelClass *klass)
{
}

static void
eknc_image_object_model_init (EkncImageObjectModel *self)
{
}

/**
 * eknc_image_object_model_new_from_json_node:
 * @node: a json node with the model metadata
 *
 * Instantiates a #EkncContentObjectModel from a JsonNode of object metadata.
 * Outside of testing this metadata is usually retrieved from a shard.
 *
 * Returns: The newly created #EkncImageObjectModel.
 */
EkncContentObjectModel *
eknc_image_object_model_new_from_json_node (JsonNode *node)
{
  g_autoptr(EosProfileProbe) probe = EOS_PROFILE_PROBE ("/ekncontent/object/image");

G_GNUC_BEGIN_IGNORE_DEPRECATIONS
  GArray *params = g_array_new (FALSE, TRUE, sizeof (GParameter));
  eknc_media_object_model_add_json_to_params (node, params);
  EkncImageObjectModel *model = g_object_newv (EKNC_TYPE_IMAGE_OBJECT_MODEL,
                                               params->len,
                                               (GParameter *)params->data);
  eknc_utils_free_gparam_array (params);
G_GNUC_END_IGNORE_DEPRECATIONS

  return EKNC_CONTENT_OBJECT_MODEL (model);
}
