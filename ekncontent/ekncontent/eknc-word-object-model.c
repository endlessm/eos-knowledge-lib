/* Copyright 2017 Endless Mobile, Inc. */

#include "eknc-word-object-model.h"

#include "eknc-utils-private.h"
#include "eknc-content-object-model-private.h"

/**
 * SECTION:word-object-model
 * @title: Word Object Model
 * @short_description: Access word object metadata
 *
 * The model class for word objects.
 */
typedef struct {
  gchar *word;
  gchar *definition;
  gchar *type;
} EkncWordObjectModelPrivate;

G_DEFINE_TYPE_WITH_PRIVATE (EkncWordObjectModel,
                            eknc_word_object_model,
                            EKNC_TYPE_CONTENT_OBJECT_MODEL)

enum {
  PROP_0,
  PROP_WORD,
  PROP_DEFINITION,
  PROP_TYPE,
  NPROPS
};

static GParamSpec *eknc_word_object_model_props [NPROPS] = { NULL, };

static void
eknc_word_object_model_get_property (GObject    *object,
                                     guint       prop_id,
                                     GValue     *value,
                                     GParamSpec *pspec)
{
  EkncWordObjectModel *self = EKNC_WORD_OBJECT_MODEL (object);
  EkncWordObjectModelPrivate *priv = eknc_word_object_model_get_instance_private (self);

  switch (prop_id)
    {
    case PROP_WORD:
      g_value_set_string (value, priv->word);
      break;

    case PROP_DEFINITION:
      g_value_set_string (value, priv->definition);
      break;

    case PROP_TYPE:
      g_value_set_string (value, priv->type);
      break;

    default:
      G_OBJECT_WARN_INVALID_PROPERTY_ID (object, prop_id, pspec);
    }
}

static void
eknc_word_object_model_set_property (GObject *object,
                                     guint prop_id,
                                     const GValue *value,
                                     GParamSpec *pspec)
{
  EkncWordObjectModel *self = EKNC_WORD_OBJECT_MODEL (object);
  EkncWordObjectModelPrivate *priv = eknc_word_object_model_get_instance_private (self);

  switch (prop_id)
    {
    case PROP_WORD:
      g_clear_pointer (&priv->word, g_free);
      priv->word = g_value_dup_string (value);
      break;

    case PROP_DEFINITION:
      g_clear_pointer (&priv->definition, g_free);
      priv->definition = g_value_dup_string (value);
      break;

    case PROP_TYPE:
      g_clear_pointer (&priv->type, g_free);
      priv->type = g_value_dup_string (value);
      break;

    default:
      G_OBJECT_WARN_INVALID_PROPERTY_ID (object, prop_id, pspec);
    }
}

static void
eknc_word_object_model_finalize (GObject *object)
{
  EkncWordObjectModel *self = EKNC_WORD_OBJECT_MODEL (object);
  EkncWordObjectModelPrivate *priv = eknc_word_object_model_get_instance_private (self);

  g_clear_pointer (&priv->word, g_free);
  g_clear_pointer (&priv->definition, g_free);
  g_clear_pointer (&priv->type, g_free);

  G_OBJECT_CLASS (eknc_word_object_model_parent_class)->finalize (object);
}

static void
eknc_word_object_model_class_init (EkncWordObjectModelClass *klass)
{
  GObjectClass *object_class = G_OBJECT_CLASS (klass);

  object_class->get_property = eknc_word_object_model_get_property;
  object_class->set_property = eknc_word_object_model_set_property;
  object_class->finalize = eknc_word_object_model_finalize;

  /**
   * EkncWordObjectModel:word:
   *
   * The actual word of the day
   */
  eknc_word_object_model_props[PROP_WORD] =
    g_param_spec_string ("word", "The actual word of the day.",
      "Word of the day to display.",
      "", G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);
  /**
   * EkncWordObjectModel:definition:
   *
   * The corresponding definition of the word of the day
   */
  eknc_word_object_model_props[PROP_DEFINITION] =
    g_param_spec_string ("definition", "Definition",
      "Definition of the word of the day",
      "", G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);

  /**
   * EkncWordObjectModel:type:
   *
   * The type of the word of the day e.g. noun, verb
   */
  eknc_word_object_model_props[PROP_TYPE] =
    g_param_spec_string ("type", "Type",
      "Type of the word of the day",
      "", G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);

  g_object_class_install_properties (object_class,
                                     NPROPS,
                                     eknc_word_object_model_props);
}

static void
eknc_word_object_model_init (EkncWordObjectModel *self)
{
}

static void
eknc_word_object_model_add_json_to_params (JsonNode *node,
                                           GArray *params)
{
  if (!JSON_NODE_HOLDS_OBJECT (node))
    {
      g_critical ("Trying to instantiate a EkncWordObjectModel from a non json object.");
      return;
    }

  eknc_content_object_model_add_json_to_params (node, params);

  JsonObject *object = json_node_get_object (node);
  GObjectClass *klass = g_type_class_ref (EKNC_TYPE_WORD_OBJECT_MODEL);

  eknc_utils_append_gparam_from_json_node (json_object_get_member (object, "word"),
                                           g_object_class_find_property (klass, "word"),
                                           params);
  eknc_utils_append_gparam_from_json_node (json_object_get_member (object, "definition"),
                                           g_object_class_find_property (klass, "definition"),
                                           params);
  eknc_utils_append_gparam_from_json_node (json_object_get_member (object, "type"),
                                           g_object_class_find_property (klass, "type"),
                                           params);
  g_type_class_unref (klass);
}

/**
 * eknc_word_object_model_new_from_json_node:
 * @node: a json node with the model metadata
 *
 * Instantiates a #EkncWordObjectModel from a JsonNode of object metadata.
 * Outside of testing this metadata is usually retrieved from a shard.
 *
 * Returns: The newly created #EkncWordObjectModel.
 */
EkncContentObjectModel *
eknc_word_object_model_new_from_json_node (JsonNode *node)
{
  GArray *params = g_array_new (FALSE, TRUE, sizeof (GParameter));
  eknc_word_object_model_add_json_to_params (node, params);
  EkncWordObjectModel *model = g_object_newv (EKNC_TYPE_WORD_OBJECT_MODEL,
                                              params->len,
                                              (GParameter *)params->data);
  eknc_utils_free_gparam_array (params);
  return EKNC_CONTENT_OBJECT_MODEL (model);
}
