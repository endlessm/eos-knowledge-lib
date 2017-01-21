/* Copyright 2016 Endless Mobile, Inc. */

#include "eknc-video-object-model.h"

#include "eknc-utils-private.h"
#include "eknc-media-object-model-private.h"

/**
 * SECTION:video-object-model
 * @title: Video Object Model
 * @short_description: Access video object metadata
 *
 * The model class for video objects.
 */
typedef struct {
  guint duration;
  gchar *transcript;
  gchar *poster_uri;
} EkncVideoObjectModelPrivate;

G_DEFINE_TYPE_WITH_PRIVATE (EkncVideoObjectModel,
                            eknc_video_object_model,
                            EKNC_TYPE_MEDIA_OBJECT_MODEL)

enum {
  PROP_0,
  PROP_DURATION,
  PROP_TRANSCRIPT,
  PROP_POSTER_URI,
  NPROPS
};

static GParamSpec *eknc_video_object_model_props [NPROPS] = { NULL, };

static void
eknc_video_object_model_get_property (GObject    *object,
                                      guint       prop_id,
                                      GValue     *value,
                                      GParamSpec *pspec)
{
  EkncVideoObjectModel *self = EKNC_VIDEO_OBJECT_MODEL (object);
  EkncVideoObjectModelPrivate *priv = eknc_video_object_model_get_instance_private (self);

  switch (prop_id)
    {
    case PROP_DURATION:
      g_value_set_uint (value, priv->duration);
      break;

    case PROP_TRANSCRIPT:
      g_value_set_string (value, priv->transcript);
      break;

    case PROP_POSTER_URI:
      g_value_set_string (value, priv->poster_uri);
      break;

    default:
      G_OBJECT_WARN_INVALID_PROPERTY_ID (object, prop_id, pspec);
    }
}

static void
eknc_video_object_model_set_property (GObject *object,
                                      guint prop_id,
                                      const GValue *value,
                                      GParamSpec *pspec)
{
  EkncVideoObjectModel *self = EKNC_VIDEO_OBJECT_MODEL (object);
  EkncVideoObjectModelPrivate *priv = eknc_video_object_model_get_instance_private (self);

  switch (prop_id)
    {
    case PROP_DURATION:
      priv->duration = g_value_get_uint (value);
      break;

    case PROP_TRANSCRIPT:
      g_clear_pointer (&priv->transcript, g_free);
      priv->transcript = g_value_dup_string (value);
      break;

    case PROP_POSTER_URI:
      g_clear_pointer (&priv->poster_uri, g_free);
      priv->poster_uri = g_value_dup_string (value);
      break;

    default:
      G_OBJECT_WARN_INVALID_PROPERTY_ID (object, prop_id, pspec);
    }
}

static void
eknc_video_object_model_finalize (GObject *object)
{
  EkncVideoObjectModel *self = EKNC_VIDEO_OBJECT_MODEL (object);
  EkncVideoObjectModelPrivate *priv = eknc_video_object_model_get_instance_private (self);

  g_clear_pointer (&priv->transcript, g_free);
  g_clear_pointer (&priv->poster_uri, g_free);

  G_OBJECT_CLASS (eknc_video_object_model_parent_class)->finalize (object);
}

static void
eknc_video_object_model_class_init (EkncVideoObjectModelClass *klass)
{
  GObjectClass *object_class = G_OBJECT_CLASS (klass);

  object_class->get_property = eknc_video_object_model_get_property;
  object_class->set_property = eknc_video_object_model_set_property;
  object_class->finalize = eknc_video_object_model_finalize;

  /**
   * EkncVideoObjectModel:duration:
   *
   * The duration of the video in seconds.
   */
  eknc_video_object_model_props[PROP_DURATION] =
    g_param_spec_uint ("duration", "Duration",
      "The duration of the video",
      0, G_MAXUINT, 0, G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);
  /**
   * EkncVideoObjectModel:transcript:
   *
   * Transcript of the video, in the same language as the video.
   */
  eknc_video_object_model_props[PROP_TRANSCRIPT] =
    g_param_spec_string ("transcript", "Transcript",
      "Transcript of the video",
      "", G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);
  /**
   * EkncVideoObjectModel:poster-uri:
   *
   * URI of the the video's poster image
   *
   * The EKN ID of an #ImageObjectModel.
   */
  eknc_video_object_model_props[PROP_POSTER_URI] =
    g_param_spec_string ("poster-uri", "Poster URI",
      "URI of the poster image",
      "", G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);

  g_object_class_install_properties (object_class,
                                     NPROPS,
                                     eknc_video_object_model_props);
}

static void
eknc_video_object_model_init (EkncVideoObjectModel *self)
{
}

static void
eknc_video_object_model_add_json_to_params (JsonNode *node,
                                            GArray *params)
{
  if (!JSON_NODE_HOLDS_OBJECT (node))
    {
      g_critical ("Trying to instantiate a EkncVideoObjectModel from a non json object.");
      return;
    }

  eknc_media_object_model_add_json_to_params (node, params);

  JsonObject *object = json_node_get_object (node);
  GObjectClass *klass = g_type_class_ref (EKNC_TYPE_VIDEO_OBJECT_MODEL);

  eknc_utils_append_gparam_from_json_node (json_object_get_member (object, "duration"),
                                           g_object_class_find_property (klass, "duration"),
                                           params);
  eknc_utils_append_gparam_from_json_node (json_object_get_member (object, "transcript"),
                                           g_object_class_find_property (klass, "transcript"),
                                           params);
  eknc_utils_append_gparam_from_json_node (json_object_get_member (object, "poster"),
                                           g_object_class_find_property (klass, "poster-uri"),
                                           params);
  g_type_class_unref (klass);
}

/**
 * eknc_video_object_model_new_from_json_node:
 * @node: a json node with the model metadata
 *
 * Instantiates a #EkncVideoObjectModel from a JsonNode of object metadata.
 * Outside of testing this metadata is usually retrieved from a shard.
 *
 * Returns: The newly created #EkncVideoObjectModel.
 */
EkncContentObjectModel *
eknc_video_object_model_new_from_json_node (JsonNode *node)
{
  GArray *params = g_array_new (FALSE, TRUE, sizeof (GParameter));
  eknc_video_object_model_add_json_to_params (node, params);
  EkncVideoObjectModel *model = g_object_newv (EKNC_TYPE_VIDEO_OBJECT_MODEL,
                                               params->len,
                                               (GParameter *)params->data);
  eknc_utils_free_gparam_array (params);
  return EKNC_CONTENT_OBJECT_MODEL (model);
}
