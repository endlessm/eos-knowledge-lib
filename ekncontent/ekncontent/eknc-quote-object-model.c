/* Copyright 2017 Endless Mobile, Inc. */

#include "eknc-quote-object-model.h"

#include "eknc-utils-private.h"
#include "eknc-content-object-model-private.h"

/**
 * SECTION:quote-object-model
 * @title: Quote Object Model
 * @short_description: Access quote object metadata
 *
 * The model class for quote objects.
 */
typedef struct {
  gchar *quote;
  gchar *author;
} EkncQuoteObjectModelPrivate;

G_DEFINE_TYPE_WITH_PRIVATE (EkncQuoteObjectModel,
                            eknc_quote_object_model,
                            EKNC_TYPE_CONTENT_OBJECT_MODEL)

enum {
  PROP_0,
  PROP_QUOTE,
  PROP_AUTHOR,
  NPROPS
};

static GParamSpec *eknc_quote_object_model_props [NPROPS] = { NULL, };

static void
eknc_quote_object_model_get_property (GObject    *object,
                                      guint       prop_id,
                                      GValue     *value,
                                      GParamSpec *pspec)
{
  EkncQuoteObjectModel *self = EKNC_QUOTE_OBJECT_MODEL (object);
  EkncQuoteObjectModelPrivate *priv = eknc_quote_object_model_get_instance_private (self);

  switch (prop_id)
    {
    case PROP_QUOTE:
      g_value_set_string (value, priv->quote);
      break;

    case PROP_AUTHOR:
      g_value_set_string (value, priv->author);
      break;

    default:
      G_OBJECT_WARN_INVALID_PROPERTY_ID (object, prop_id, pspec);
    }
}

static void
eknc_quote_object_model_set_property (GObject *object,
                                      guint prop_id,
                                      const GValue *value,
                                      GParamSpec *pspec)
{
  EkncQuoteObjectModel *self = EKNC_QUOTE_OBJECT_MODEL (object);
  EkncQuoteObjectModelPrivate *priv = eknc_quote_object_model_get_instance_private (self);

  switch (prop_id)
    {
    case PROP_QUOTE:
      g_clear_pointer (&priv->quote, g_free);
      priv->quote = g_value_dup_string (value);
      break;

    case PROP_AUTHOR:
      g_clear_pointer (&priv->author, g_free);
      priv->author = g_value_dup_string (value);
      break;

    default:
      G_OBJECT_WARN_INVALID_PROPERTY_ID (object, prop_id, pspec);
    }
}

static void
eknc_quote_object_model_finalize (GObject *object)
{
  EkncQuoteObjectModel *self = EKNC_QUOTE_OBJECT_MODEL (object);
  EkncQuoteObjectModelPrivate *priv = eknc_quote_object_model_get_instance_private (self);

  g_clear_pointer (&priv->quote, g_free);
  g_clear_pointer (&priv->author, g_free);

  G_OBJECT_CLASS (eknc_quote_object_model_parent_class)->finalize (object);
}

static void
eknc_quote_object_model_class_init (EkncQuoteObjectModelClass *klass)
{
  GObjectClass *object_class = G_OBJECT_CLASS (klass);

  object_class->get_property = eknc_quote_object_model_get_property;
  object_class->set_property = eknc_quote_object_model_set_property;
  object_class->finalize = eknc_quote_object_model_finalize;

  /**
   * EkncQuoteObjectModel:quote:
   *
   * The actual quote of the day
   */
  eknc_quote_object_model_props[PROP_QUOTE] =
    g_param_spec_string ("quote", "The actual quote of the day.",
      "Quote of the day to display.",
      "", G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);
  /**
   * EkncQuoteObjectModel:author:
   *
   * The corresponding author of the quote of the day
   */
  eknc_quote_object_model_props[PROP_AUTHOR] =
    g_param_spec_string ("author", "Author",
      "Author of the quote of the day",
      "", G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);

  g_object_class_install_properties (object_class,
                                     NPROPS,
                                     eknc_quote_object_model_props);
}

static void
eknc_quote_object_model_init (EkncQuoteObjectModel *self)
{
}

static void
eknc_quote_object_model_add_json_to_params (JsonNode *node,
                                            GArray *params)
{
  if (!JSON_NODE_HOLDS_OBJECT (node))
    {
      g_critical ("Trying to instantiate a EkncQuoteObjectModel from a non json object.");
      return;
    }

  eknc_content_object_model_add_json_to_params (node, params);

  JsonObject *object = json_node_get_object (node);
  GObjectClass *klass = g_type_class_ref (EKNC_TYPE_QUOTE_OBJECT_MODEL);

  eknc_utils_append_gparam_from_json_node (json_object_get_member (object, "quote"),
                                           g_object_class_find_property (klass, "quote"),
                                           params);
  eknc_utils_append_gparam_from_json_node (json_object_get_member (object, "author"),
                                           g_object_class_find_property (klass, "author"),
                                           params);
  g_type_class_unref (klass);
}

/**
 * eknc_quote_object_model_new_from_json_node:
 * @node: a json node with the model metadata
 *
 * Instantiates a #EkncQuoteObjectModel from a JsonNode of object metadata.
 * Outside of testing this metadata is usually retrieved from a shard.
 *
 * Returns: The newly created #EkncQuoteObjectModel.
 */
EkncContentObjectModel *
eknc_quote_object_model_new_from_json_node (JsonNode *node)
{
  GArray *params = g_array_new (FALSE, TRUE, sizeof (GParameter));
  eknc_quote_object_model_add_json_to_params (node, params);
  EkncQuoteObjectModel *model = g_object_newv (EKNC_TYPE_QUOTE_OBJECT_MODEL,
                                               params->len,
                                               (GParameter *)params->data);
  eknc_utils_free_gparam_array (params);
  return EKNC_CONTENT_OBJECT_MODEL (model);
}
