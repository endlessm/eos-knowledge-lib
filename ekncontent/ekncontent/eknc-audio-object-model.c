/* Copyright 2017 Endless Mobile, Inc. */

#include "eknc-audio-object-model.h"

#include "eknc-utils-private.h"
#include "eknc-content-object-model-private.h"

#include <endless/endless.h>

/**
 * SECTION:audio-object-model
 * @title: Audio Object Model
 * @short_description: Access audio object metadata
 *
 * The model class for audio objects.
 */
typedef struct {
  guint duration;
  gchar *transcript;
} EkncAudioObjectModelPrivate;

G_DEFINE_TYPE_WITH_PRIVATE (EkncAudioObjectModel,
                            eknc_audio_object_model,
                            EKNC_TYPE_CONTENT_OBJECT_MODEL)

enum {
  PROP_0,
  PROP_DURATION,
  PROP_TRANSCRIPT,
  NPROPS
};

static GParamSpec *eknc_audio_object_model_props [NPROPS] = { NULL, };

static void
eknc_audio_object_model_get_property (GObject    *object,
                                      guint       prop_id,
                                      GValue     *value,
                                      GParamSpec *pspec)
{
  EkncAudioObjectModel *self = EKNC_AUDIO_OBJECT_MODEL (object);
  EkncAudioObjectModelPrivate *priv = eknc_audio_object_model_get_instance_private (self);

  switch (prop_id)
    {
    case PROP_DURATION:
      g_value_set_uint (value, priv->duration);
      break;

    case PROP_TRANSCRIPT:
      g_value_set_string (value, priv->transcript);
      break;

    default:
      G_OBJECT_WARN_INVALID_PROPERTY_ID (object, prop_id, pspec);
    }
}

static void
eknc_audio_object_model_set_property (GObject *object,
                                      guint prop_id,
                                      const GValue *value,
                                      GParamSpec *pspec)
{
  EkncAudioObjectModel *self = EKNC_AUDIO_OBJECT_MODEL (object);
  EkncAudioObjectModelPrivate *priv = eknc_audio_object_model_get_instance_private (self);

  switch (prop_id)
    {
    case PROP_DURATION:
      priv->duration = g_value_get_uint (value);
      break;

    case PROP_TRANSCRIPT:
      g_clear_pointer (&priv->transcript, g_free);
      priv->transcript = g_value_dup_string (value);
      break;

    default:
      G_OBJECT_WARN_INVALID_PROPERTY_ID (object, prop_id, pspec);
    }
}

static void
eknc_audio_object_model_finalize (GObject *object)
{
  EkncAudioObjectModel *self = EKNC_AUDIO_OBJECT_MODEL (object);
  EkncAudioObjectModelPrivate *priv = eknc_audio_object_model_get_instance_private (self);

  g_clear_pointer (&priv->transcript, g_free);

  G_OBJECT_CLASS (eknc_audio_object_model_parent_class)->finalize (object);
}

static void
eknc_audio_object_model_class_init (EkncAudioObjectModelClass *klass)
{
  GObjectClass *object_class = G_OBJECT_CLASS (klass);

  object_class->get_property = eknc_audio_object_model_get_property;
  object_class->set_property = eknc_audio_object_model_set_property;
  object_class->finalize = eknc_audio_object_model_finalize;

  /**
   * EkncAudioObjectModel:duration:
   *
   * The duration of the audio in seconds.
   */
  eknc_audio_object_model_props[PROP_DURATION] =
    g_param_spec_uint ("duration", "Duration",
      "The duration of the audio",
      0, G_MAXUINT, 0, G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);
  /**
   * EkncAudioObjectModel:transcript:
   *
   * Transcript of the audio, in the same language as the audio.
   */
  eknc_audio_object_model_props[PROP_TRANSCRIPT] =
    g_param_spec_string ("transcript", "Transcript",
      "Transcript of the audio",
      "", G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);

  g_object_class_install_properties (object_class,
                                     NPROPS,
                                     eknc_audio_object_model_props);
}

static void
eknc_audio_object_model_init (EkncAudioObjectModel *self)
{
}

/**
 * eknc_audio_object_model_add_json_to_params: (skip)
 * @node: a json node
 * @params: a caller owned array a gparams
 *
 * Private function. Appends GParameters to the array with EkncArticleObjectModel
 * property values parsed from the json node metadata.
 */
void
eknc_audio_object_model_add_json_to_params (JsonNode *node,
                                            GArray *params)
{
  if (!JSON_NODE_HOLDS_OBJECT (node))
    {
      g_critical ("Trying to instantiate a EkncAudioObjectModel from a non json object.");
      return;
    }

  eknc_content_object_model_add_json_to_params (node, params);

  JsonObject *object = json_node_get_object (node);
  GObjectClass *klass = g_type_class_ref (EKNC_TYPE_AUDIO_OBJECT_MODEL);

  eknc_utils_append_gparam_from_json_node (json_object_get_member (object, "duration"),
                                           g_object_class_find_property (klass, "duration"),
                                           params);
  eknc_utils_append_gparam_from_json_node (json_object_get_member (object, "transcript"),
                                           g_object_class_find_property (klass, "transcript"),
                                           params);
  g_type_class_unref (klass);
}

/**
 * eknc_audio_object_model_new_from_json_node:
 * @node: a json node with the model metadata
 *
 * Instantiates a #EkncAudioObjectModel from a JsonNode of object metadata.
 * Outside of testing this metadata is usually retrieved from a shard.
 *
 * Returns: The newly created #EkncAudioObjectModel.
 */
EkncContentObjectModel *
eknc_audio_object_model_new_from_json_node (JsonNode *node)
{
  g_autoptr(EosProfileProbe) probe = EOS_PROFILE_PROBE ("/ekncontent/object/audio");

G_GNUC_BEGIN_IGNORE_DEPRECATIONS
  GArray *params = g_array_new (FALSE, TRUE, sizeof (GParameter));
  eknc_audio_object_model_add_json_to_params (node, params);
  EkncAudioObjectModel *model = g_object_newv (EKNC_TYPE_AUDIO_OBJECT_MODEL,
                                               params->len,
                                               (GParameter *)params->data);
  eknc_utils_free_gparam_array (params);
G_GNUC_END_IGNORE_DEPRECATIONS

  return EKNC_CONTENT_OBJECT_MODEL (model);
}
