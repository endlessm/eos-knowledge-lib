/* Copyright 2016 Endless Mobile, Inc. */

#include "eknc-set-object-model.h"

#include "eknc-utils-private.h"
#include "eknc-content-object-model-private.h"

/**
 * SECTION:set-object-model
 * @title: Set Object Model
 * @short_description: Access set object metadata
 *
 * The model class for set objects.
 */
typedef struct {
  GVariant *child_tags;
} EkncSetObjectModelPrivate;

G_DEFINE_TYPE_WITH_PRIVATE (EkncSetObjectModel,
                            eknc_set_object_model,
                            EKNC_TYPE_CONTENT_OBJECT_MODEL)

enum {
  PROP_0,
  PROP_CHILD_TAGS,
  NPROPS
};

static GParamSpec *eknc_set_object_model_props [NPROPS] = { NULL, };

static void
eknc_set_object_model_get_property (GObject    *object,
                                    guint       prop_id,
                                    GValue     *value,
                                    GParamSpec *pspec)
{
  EkncSetObjectModel *self = EKNC_SET_OBJECT_MODEL (object);
  EkncSetObjectModelPrivate *priv = eknc_set_object_model_get_instance_private (self);

  switch (prop_id)
    {
    case PROP_CHILD_TAGS:
      g_value_set_variant (value, priv->child_tags);
      break;

    default:
      G_OBJECT_WARN_INVALID_PROPERTY_ID (object, prop_id, pspec);
    }
}

static void
eknc_set_object_model_set_property (GObject *object,
                                    guint prop_id,
                                    const GValue *value,
                                    GParamSpec *pspec)
{
  EkncSetObjectModel *self = EKNC_SET_OBJECT_MODEL (object);
  EkncSetObjectModelPrivate *priv = eknc_set_object_model_get_instance_private (self);

  switch (prop_id)
    {
    case PROP_CHILD_TAGS:
      g_clear_pointer (&priv->child_tags, g_variant_unref);
      priv->child_tags = g_value_dup_variant (value);
      break;

    default:
      G_OBJECT_WARN_INVALID_PROPERTY_ID (object, prop_id, pspec);
    }
}

static void
eknc_set_object_model_finalize (GObject *object)
{
  EkncSetObjectModel *self = EKNC_SET_OBJECT_MODEL (object);
  EkncSetObjectModelPrivate *priv = eknc_set_object_model_get_instance_private (self);

  g_clear_pointer (&priv->child_tags, g_variant_unref);

  G_OBJECT_CLASS (eknc_set_object_model_parent_class)->finalize (object);
}

static void
eknc_set_object_model_class_init (EkncSetObjectModelClass *klass)
{
  GObjectClass *object_class = G_OBJECT_CLASS (klass);

  object_class->get_property = eknc_set_object_model_get_property;
  object_class->set_property = eknc_set_object_model_set_property;
  object_class->finalize = eknc_set_object_model_finalize;

  /**
   * EkncSetObjectModel:child-tags:
   *
   * A list of tags that articles in this set are tagged with
   *
   * child-tags refers to the articles that are contained within a
   * set; those articles are all articles whose
   * #ContentObjectModel:tags properties contain one of the tags in
   * the set's child-tags property.
   *
   * Note that #EkncContentObjectModel:tags on an #EkncSetObjectModel refers
   * to the tags with which a set itself has been tagged.
   */
  eknc_set_object_model_props[PROP_CHILD_TAGS] =
    g_param_spec_variant ("child-tags", "Child Tags",
      "A list of tags that articles in this set are tagged with",
      G_VARIANT_TYPE ("as"), NULL,
      G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);

  g_object_class_install_properties (object_class,
                                     NPROPS,
                                     eknc_set_object_model_props);
}

static void
eknc_set_object_model_init (EkncSetObjectModel *self)
{
}

static void
eknc_set_object_model_add_json_to_params (JsonNode *node,
                                              GArray *params)
{
  if (!JSON_NODE_HOLDS_OBJECT (node))
    {
      g_critical ("Trying to instantiate a EkncSetObjectModel from a non json object.");
      return;
    }

  eknc_content_object_model_add_json_to_params (node, params);

  JsonObject *object = json_node_get_object (node);
  GObjectClass *klass = g_type_class_ref (EKNC_TYPE_SET_OBJECT_MODEL);

  eknc_utils_append_gparam_from_json_node (json_object_get_member (object, "childTags"),
                                           g_object_class_find_property (klass, "child-tags"),
                                           params);
  g_type_class_unref (klass);
}

/**
 * eknc_set_object_model_get_child_tags:
 * @self: the model
 *
 * Get the models child_tags.
 *
 * Returns: (transfer none): the resources GVariant
 */
GVariant *
eknc_set_object_model_get_child_tags (EkncSetObjectModel *self)
{
  g_return_val_if_fail (EKNC_IS_SET_OBJECT_MODEL (self), NULL);

  EkncSetObjectModelPrivate *priv = eknc_set_object_model_get_instance_private (self);
  return priv->child_tags;
}

/**
 * eknc_set_object_model_new_from_json_node:
 * @node: a json node with the model metadata
 *
 * Instantiates a #EkncSetObjectModel from a JsonNode of object metadata.
 * Outside of testing this metadata is usually retrieved from a shard.
 *
 * Returns: The newly created #EkncSetObjectModel.
 */
EkncContentObjectModel *
eknc_set_object_model_new_from_json_node (JsonNode *node)
{
G_GNUC_BEGIN_IGNORE_DEPRECATIONS
  GArray *params = g_array_new (FALSE, TRUE, sizeof (GParameter));
  eknc_set_object_model_add_json_to_params (node, params);
  EkncSetObjectModel *model = g_object_newv (EKNC_TYPE_SET_OBJECT_MODEL,
                                               params->len,
                                               (GParameter *)params->data);
  eknc_utils_free_gparam_array (params);
G_GNUC_END_IGNORE_DEPRECATIONS
  return EKNC_CONTENT_OBJECT_MODEL (model);
}
