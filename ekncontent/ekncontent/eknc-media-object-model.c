/* Copyright 2016 Endless Mobile, Inc. */

#include "eknc-media-object-model.h"
#include "eknc-media-object-model-private.h"

#include "eknc-utils-private.h"
#include "eknc-content-object-model-private.h"

#include <endless/endless.h>

/**
 * SECTION:media-object-model
 * @title: Media Object Model
 * @short_description: Access media object metadata
 *
 * The model class for media objects. A media object has the same
 * properties as a ContentObjectModel, plus caption, height
 * and width properties
 */
typedef struct {
  gchar *caption;
  guint width;
  guint height;
  char *parent_uri;
} EkncMediaObjectModelPrivate;

G_DEFINE_TYPE_WITH_PRIVATE (EkncMediaObjectModel,
                            eknc_media_object_model,
                            EKNC_TYPE_CONTENT_OBJECT_MODEL)

enum {
  PROP_0,
  PROP_CAPTION,
  PROP_WIDTH,
  PROP_HEIGHT,
  PROP_PARENT_URI,
  NPROPS
};

static GParamSpec *eknc_media_object_model_props [NPROPS] = { NULL, };

static void
eknc_media_object_model_get_property (GObject    *object,
                                      guint       prop_id,
                                      GValue     *value,
                                      GParamSpec *pspec)
{
  EkncMediaObjectModel *self = EKNC_MEDIA_OBJECT_MODEL (object);
  EkncMediaObjectModelPrivate *priv = eknc_media_object_model_get_instance_private (self);

  switch (prop_id)
    {
    case PROP_CAPTION:
      g_value_set_string (value, priv->caption);
      break;

    case PROP_WIDTH:
      g_value_set_uint (value, priv->width);
      break;

    case PROP_HEIGHT:
      g_value_set_uint (value, priv->height);
      break;

    case PROP_PARENT_URI:
      g_value_set_string (value, priv->parent_uri);
      break;

    default:
      G_OBJECT_WARN_INVALID_PROPERTY_ID (object, prop_id, pspec);
    }
}

static void
eknc_media_object_model_set_property (GObject *object,
                                      guint prop_id,
                                      const GValue *value,
                                      GParamSpec *pspec)
{
  EkncMediaObjectModel *self = EKNC_MEDIA_OBJECT_MODEL (object);
  EkncMediaObjectModelPrivate *priv = eknc_media_object_model_get_instance_private (self);

  switch (prop_id)
    {
    case PROP_CAPTION:
      g_clear_pointer (&priv->caption, g_free);
      priv->caption = g_value_dup_string (value);
      break;

    case PROP_WIDTH:
      priv->width = g_value_get_uint (value);
      break;

    case PROP_HEIGHT:
      priv->height = g_value_get_uint (value);
      break;

    case PROP_PARENT_URI:
      g_clear_pointer (&priv->parent_uri, g_free);
      priv->parent_uri = g_value_dup_string (value);
      break;

    default:
      G_OBJECT_WARN_INVALID_PROPERTY_ID (object, prop_id, pspec);
    }
}

static void
eknc_media_object_model_finalize (GObject *object)
{
  EkncMediaObjectModel *self = EKNC_MEDIA_OBJECT_MODEL (object);
  EkncMediaObjectModelPrivate *priv = eknc_media_object_model_get_instance_private (self);

  g_clear_pointer (&priv->caption, g_free);
  g_clear_pointer (&priv->parent_uri, g_free);

  G_OBJECT_CLASS (eknc_media_object_model_parent_class)->finalize (object);
}

static void
eknc_media_object_model_class_init (EkncMediaObjectModelClass *klass)
{
  GObjectClass *object_class = G_OBJECT_CLASS (klass);

  object_class->get_property = eknc_media_object_model_get_property;
  object_class->set_property = eknc_media_object_model_set_property;
  object_class->finalize = eknc_media_object_model_finalize;

  /**
   * EkncMediaObjectModel:caption:
   *
   * A displayable string which describes the media object in the same
   * language as the MediaObject.
   */
  eknc_media_object_model_props[PROP_CAPTION] =
    g_param_spec_string ("caption", "Caption",
      "Displayable caption for the media",
      "", G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);
  /**
   * EkncMediaObjectModel:width:
   *
   * The width of the media in pixels.
   */
  eknc_media_object_model_props[PROP_WIDTH] =
    g_param_spec_uint ("width", "Width",
      "The width of the media in pixels",
      0, G_MAXUINT, 0, G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);
  /**
   * EkncMediaObjectModel:height:
   *
   * The height of the media in pixels.
   */
  eknc_media_object_model_props[PROP_HEIGHT] =
    g_param_spec_uint ("height", "Height",
      "The height of the media in pixels",
      0, G_MAXUINT, 0, G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);

  /**
   * EkncMediaObjectModel:parent-uri:
   *
   * The EKN URI of an #EkncContentObjectModel that embeds this
   * #EkncMediaObjectModel.
   */
  eknc_media_object_model_props[PROP_PARENT_URI] =
    g_param_spec_string ("parent-uri", "Parent URI",
      "EKN URI of article that embeds this media object",
      NULL, G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);

  g_object_class_install_properties (object_class,
                                     NPROPS,
                                     eknc_media_object_model_props);
}

static void
eknc_media_object_model_init (EkncMediaObjectModel *self)
{
}

/**
 * eknc_media_object_model_add_json_to_params: (skip)
 * @node: a json node
 * @params: a caller owned array a gparams
 *
 * Private function. Appends GParameters to the array with EkncArticleObjectModel
 * property values parsed from the json node metadata.
 */
void
eknc_media_object_model_add_json_to_params (JsonNode *node,
                                            GArray *params)
{
  if (!JSON_NODE_HOLDS_OBJECT (node))
    {
      g_critical ("Trying to instantiate a EkncMediaObjectModel from a non json object.");
      return;
    }

  eknc_content_object_model_add_json_to_params (node, params);

  JsonObject *object = json_node_get_object (node);
  GObjectClass *klass = g_type_class_ref (EKNC_TYPE_MEDIA_OBJECT_MODEL);

  eknc_utils_append_gparam_from_json_node (json_object_get_member (object, "caption"),
                                           g_object_class_find_property (klass, "caption"),
                                           params);
  eknc_utils_append_gparam_from_json_node (json_object_get_member (object, "width"),
                                           g_object_class_find_property (klass, "width"),
                                           params);
  eknc_utils_append_gparam_from_json_node (json_object_get_member (object, "height"),
                                           g_object_class_find_property (klass, "height"),
                                           params);
  eknc_utils_append_gparam_from_json_node (json_object_get_member (object, "parent"),
                                           g_object_class_find_property (klass, "parent-uri"),
                                           params);
  g_type_class_unref (klass);
}

/**
 * eknc_media_object_model_new_from_json_node:
 * @node: a json node with the model metadata
 *
 * Instantiates a #EkncMediaObjectModel from a JsonNode of object metadata.
 * Outside of testing this metadata is usually retrieved from a shard.
 *
 * Returns: The newly created #EkncMediaObjectModel.
 */
EkncContentObjectModel *
eknc_media_object_model_new_from_json_node (JsonNode *node)
{
  g_autoptr(EosProfileProbe) probe = EOS_PROFILE_PROBE ("/ekncontent/object/media");

G_GNUC_BEGIN_IGNORE_DEPRECATIONS
  GArray *params = g_array_new (FALSE, TRUE, sizeof (GParameter));
  eknc_media_object_model_add_json_to_params (node, params);
  EkncMediaObjectModel *model = g_object_newv (EKNC_TYPE_MEDIA_OBJECT_MODEL,
                                               params->len,
                                               (GParameter *)params->data);
  eknc_utils_free_gparam_array (params);
G_GNUC_END_IGNORE_DEPRECATIONS

  return EKNC_CONTENT_OBJECT_MODEL (model);
}
