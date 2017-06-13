/* Copyright 2017 Endless Mobile, Inc. */

#include "eknc-dictionary-object-model.h"

#include "eknc-utils-private.h"
#include "eknc-content-object-model-private.h"

/**
 * SECTION:dictionary-object-model
 * @title: dictionary Object Model
 * @short_description: Access dictionary object metadata
 *
 * The model class for dictionary objects.
 */
typedef struct {
  gchar *word;
  gchar *definition;
  gchar *part_of_speech;
} EkncDictionaryObjectModelPrivate;

G_DEFINE_TYPE_WITH_PRIVATE (EkncDictionaryObjectModel,
                            eknc_dictionary_object_model,
                            EKNC_TYPE_CONTENT_OBJECT_MODEL)

enum {
  PROP_0,
  PROP_WORD,
  PROP_DEFINITION,
  PROP_PART_OF_SPEECH,
  NPROPS
};

static GParamSpec *eknc_dictionary_object_model_props [NPROPS] = { NULL, };

static void
eknc_dictionary_object_model_get_property (GObject    *object,
                                           guint       prop_id,
                                           GValue     *value,
                                           GParamSpec *pspec)
{
  EkncDictionaryObjectModel *self = EKNC_DICTIONARY_OBJECT_MODEL (object);
  EkncDictionaryObjectModelPrivate *priv = eknc_dictionary_object_model_get_instance_private (self);

  switch (prop_id)
    {
    case PROP_WORD:
      g_value_set_string (value, priv->word);
      break;

    case PROP_DEFINITION:
      g_value_set_string (value, priv->definition);
      break;

    case PROP_PART_OF_SPEECH:
      g_value_set_string (value, priv->part_of_speech);
      break;

    default:
      G_OBJECT_WARN_INVALID_PROPERTY_ID (object, prop_id, pspec);
    }
}

static void
eknc_dictionary_object_model_set_property (GObject *object,
                                           guint prop_id,
                                           const GValue *value,
                                           GParamSpec *pspec)
{
  EkncDictionaryObjectModel *self = EKNC_DICTIONARY_OBJECT_MODEL (object);
  EkncDictionaryObjectModelPrivate *priv = eknc_dictionary_object_model_get_instance_private (self);

  switch (prop_id)
    {
    case PROP_WORD:
      priv->word = g_value_dup_string (value);
      break;

    case PROP_DEFINITION:
      priv->definition = g_value_dup_string (value);
      break;

    case PROP_PART_OF_SPEECH:
      priv->part_of_speech = g_value_dup_string (value);
      break;

    default:
      G_OBJECT_WARN_INVALID_PROPERTY_ID (object, prop_id, pspec);
    }
}

static void
eknc_dictionary_object_model_finalize (GObject *object)
{
  EkncDictionaryObjectModel *self = EKNC_DICTIONARY_OBJECT_MODEL (object);
  EkncDictionaryObjectModelPrivate *priv = eknc_dictionary_object_model_get_instance_private (self);

  g_clear_pointer (&priv->word, g_free);
  g_clear_pointer (&priv->definition, g_free);
  g_clear_pointer (&priv->part_of_speech, g_free);

  G_OBJECT_CLASS (eknc_dictionary_object_model_parent_class)->finalize (object);
}

static void
eknc_dictionary_object_model_class_init (EkncDictionaryObjectModelClass *klass)
{
  GObjectClass *object_class = G_OBJECT_CLASS (klass);

  object_class->get_property = eknc_dictionary_object_model_get_property;
  object_class->set_property = eknc_dictionary_object_model_set_property;
  object_class->finalize = eknc_dictionary_object_model_finalize;

  /**
   * EkncDictionaryObjectModel:word:
   *
   * The actual word
   */
  eknc_dictionary_object_model_props[PROP_WORD] =
    g_param_spec_string ("word", "Word",
      "The actual word",
      "", G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);
  /**
   * EkncDictionaryObjectModel:definition:
   *
   * The corresponding definition of the word
   */
  eknc_dictionary_object_model_props[PROP_DEFINITION] =
    g_param_spec_string ("definition", "Definition",
      "Definition of the word",
      "", G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);

  /**
   * EkncDictionaryObjectModel:part-of-speech:
   *
   * The part of speech the word does belong to e.g. noun, verb
   */
  eknc_dictionary_object_model_props[PROP_PART_OF_SPEECH] =
    g_param_spec_string ("part-of-speech", "Part of speech",
      "The part of speech the word does belong to",
      "", G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);

  g_object_class_install_properties (object_class,
                                     NPROPS,
                                     eknc_dictionary_object_model_props);
}

static void
eknc_dictionary_object_model_init (EkncDictionaryObjectModel *self)
{
}

static void
eknc_dictionary_object_model_add_json_to_params (JsonNode *node,
                                                 GArray *params)
{
  if (!JSON_NODE_HOLDS_OBJECT (node))
    {
      g_critical ("Trying to instantiate a EkncDictionaryObjectModel from a non json object.");
      return;
    }

  eknc_content_object_model_add_json_to_params (node, params);

  JsonObject *object = json_node_get_object (node);
  GObjectClass *klass = g_type_class_ref (EKNC_TYPE_DICTIONARY_OBJECT_MODEL);

  eknc_utils_append_gparam_from_json_node (json_object_get_member (object, "word"),
                                           g_object_class_find_property (klass, "word"),
                                           params);
  eknc_utils_append_gparam_from_json_node (json_object_get_member (object, "definition"),
                                           g_object_class_find_property (klass, "definition"),
                                           params);
  eknc_utils_append_gparam_from_json_node (json_object_get_member (object, "partOfSpeech"),
                                           g_object_class_find_property (klass, "part-of-speech"),
                                           params);
  g_type_class_unref (klass);
}

/**
 * eknc_dictionary_object_model_new_from_json_node:
 * @node: a json node with the model metadata
 *
 * Instantiates a #EkncDictionaryObjectModel from a JsonNode of object metadata.
 * Outside of testing this metadata is usually retrieved from a shard.
 *
 * Returns: The newly created #EkncDictionaryObjectModel.
 */
EkncContentObjectModel *
eknc_dictionary_object_model_new_from_json_node (JsonNode *node)
{
  GArray *params = g_array_new (FALSE, TRUE, sizeof (GParameter));
  eknc_dictionary_object_model_add_json_to_params (node, params);
  EkncDictionaryObjectModel *model = g_object_newv (EKNC_TYPE_DICTIONARY_OBJECT_MODEL,
                                                    params->len,
                                                    (GParameter *)params->data);
  eknc_utils_free_gparam_array (params);
  return EKNC_CONTENT_OBJECT_MODEL (model);
}

