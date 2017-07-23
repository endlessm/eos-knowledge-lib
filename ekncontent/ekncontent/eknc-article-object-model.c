/* Copyright 2016 Endless Mobile, Inc. */

#include "eknc-article-object-model.h"

#include "eknc-utils-private.h"
#include "eknc-content-object-model-private.h"

/**
 * SECTION:article-object-model
 * @title: Article Object Model
 * @short_description: Access article object metadata
 *
 * The model class for article objects.
 */
typedef struct {
  gchar *source;
  gchar *source_name;
  gchar *published;
  guint word_count;
  gboolean is_server_templated;
  GVariant *authors;
  GVariant *temporal_coverage;
  GVariant *outgoing_links;
  GVariant *table_of_contents;
} EkncArticleObjectModelPrivate;

G_DEFINE_TYPE_WITH_PRIVATE (EkncArticleObjectModel,
                            eknc_article_object_model,
                            EKNC_TYPE_CONTENT_OBJECT_MODEL)

enum {
  PROP_0,
  PROP_SOURCE,
  PROP_SOURCE_NAME,
  PROP_PUBLISHED,
  PROP_WORD_COUNT,
  PROP_IS_SERVER_TEMPLATED,
  PROP_AUTHORS,
  PROP_TEMPORAL_COVERAGE,
  PROP_OUTGOING_LINKS,
  PROP_TABLE_OF_CONTENTS,
  NPROPS
};

static GParamSpec *eknc_article_object_model_props [NPROPS] = { NULL, };

static void
eknc_article_object_model_get_property (GObject    *object,
                                        guint       prop_id,
                                        GValue     *value,
                                        GParamSpec *pspec)
{
  EkncArticleObjectModel *self = EKNC_ARTICLE_OBJECT_MODEL (object);
  EkncArticleObjectModelPrivate *priv = eknc_article_object_model_get_instance_private (self);

  switch (prop_id)
    {
    case PROP_SOURCE:
      g_value_set_string (value, priv->source);
      break;

    case PROP_SOURCE_NAME:
      g_value_set_string (value, priv->source_name);
      break;

    case PROP_PUBLISHED:
      g_value_set_string (value, priv->published);
      break;

    case PROP_WORD_COUNT:
      g_value_set_uint (value, priv->word_count);
      break;

    case PROP_IS_SERVER_TEMPLATED:
      g_value_set_boolean (value, priv->is_server_templated);
      break;

    case PROP_AUTHORS:
      g_value_set_variant (value, priv->authors);
      break;

    case PROP_TEMPORAL_COVERAGE:
      g_value_set_variant (value, priv->temporal_coverage);
      break;

    case PROP_OUTGOING_LINKS:
      g_value_set_variant (value, priv->outgoing_links);
      break;

    case PROP_TABLE_OF_CONTENTS:
      g_value_set_variant (value, priv->table_of_contents);
      break;

    default:
      G_OBJECT_WARN_INVALID_PROPERTY_ID (object, prop_id, pspec);
    }
}

static void
eknc_article_object_model_set_property (GObject *object,
                                        guint prop_id,
                                        const GValue *value,
                                        GParamSpec *pspec)
{
  EkncArticleObjectModel *self = EKNC_ARTICLE_OBJECT_MODEL (object);
  EkncArticleObjectModelPrivate *priv = eknc_article_object_model_get_instance_private (self);

  switch (prop_id)
    {
    case PROP_SOURCE:
      g_clear_pointer (&priv->source, g_free);
      priv->source = g_value_dup_string (value);
      break;

    case PROP_SOURCE_NAME:
      g_clear_pointer (&priv->source_name, g_free);
      priv->source_name = g_value_dup_string (value);
      break;

    case PROP_PUBLISHED:
      g_clear_pointer (&priv->published, g_free);
      priv->published = g_value_dup_string (value);
      break;

    case PROP_WORD_COUNT:
      priv->word_count = g_value_get_uint (value);
      break;

    case PROP_IS_SERVER_TEMPLATED:
      priv->is_server_templated = g_value_get_boolean (value);
      break;

    case PROP_AUTHORS:
      g_clear_pointer (&priv->authors, g_variant_unref);
      priv->authors = g_value_dup_variant (value);
      break;

    case PROP_TEMPORAL_COVERAGE:
      g_clear_pointer (&priv->temporal_coverage, g_variant_unref);
      priv->temporal_coverage = g_value_dup_variant (value);
      break;

    case PROP_OUTGOING_LINKS:
      g_clear_pointer (&priv->outgoing_links, g_variant_unref);
      priv->outgoing_links = g_value_dup_variant (value);
      break;

    case PROP_TABLE_OF_CONTENTS:
      g_clear_pointer (&priv->table_of_contents, g_variant_unref);
      priv->table_of_contents = g_value_dup_variant (value);
      break;

    default:
      G_OBJECT_WARN_INVALID_PROPERTY_ID (object, prop_id, pspec);
    }
}

static void
eknc_article_object_model_finalize (GObject *object)
{
  EkncArticleObjectModel *self = EKNC_ARTICLE_OBJECT_MODEL (object);
  EkncArticleObjectModelPrivate *priv = eknc_article_object_model_get_instance_private (self);

  g_clear_pointer (&priv->source, g_free);
  g_clear_pointer (&priv->source_name, g_free);
  g_clear_pointer (&priv->published, g_free);
  g_clear_pointer (&priv->authors, g_variant_unref);
  g_clear_pointer (&priv->temporal_coverage, g_variant_unref);
  g_clear_pointer (&priv->outgoing_links, g_variant_unref);
  g_clear_pointer (&priv->table_of_contents, g_variant_unref);

  G_OBJECT_CLASS (eknc_article_object_model_parent_class)->finalize (object);
}

static void
eknc_article_object_model_class_init (EkncArticleObjectModelClass *klass)
{
  GObjectClass *object_class = G_OBJECT_CLASS (klass);

  object_class->get_property = eknc_article_object_model_get_property;
  object_class->set_property = eknc_article_object_model_set_property;
  object_class->finalize = eknc_article_object_model_finalize;

  /**
   * EkncArticleObjectModel:source:
   *
   * Source of the HTML. Right now can be wikipedia, wikihow, wikisource
   * or wikibooks.
   */
  eknc_article_object_model_props[PROP_SOURCE] =
    g_param_spec_string ("source", "Source of the HTML",
      "Where the article html was retrieved from.",
      "", G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);
  /**
   * EkncArticleObjectModel:source-name:
   *
   * Human-readable name of the source of this article
   *
   * A string containing the name of this article's source.
   * For example, "Wikipedia" or "Huffington Post" or "Cosimo's Blog".
   */
  eknc_article_object_model_props[PROP_SOURCE_NAME] =
    g_param_spec_string ("source-name", "Source name",
      "Human-readable name of the source of this article",
      "", G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);
  /**
   * EkncArticleObjectModel:published:
   *
   * The date this article was published. It treats dates
   * according to the ISO8601 standard.
   */
  eknc_article_object_model_props[PROP_PUBLISHED] =
    g_param_spec_string ("published", "Publication Date",
      "Publication Date of the article",
      "", G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);
  /**
   * EkncArticleObjectModel:word-count:
   *
   * Integer indicating how many words are in the article
   */
  eknc_article_object_model_props[PROP_WORD_COUNT] =
    g_param_spec_uint ("word-count", "Word Count",
      "Number of words contained in the article body",
      0, G_MAXUINT, 0, G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);
  /**
   * EkncArticleObjectModel:is-server-templated:
   *
   * Whether this content should be given priority in the UI
   */
  eknc_article_object_model_props[PROP_IS_SERVER_TEMPLATED] =
    g_param_spec_boolean ("is-server-templated", "Is Server Templated",
      "Is Server Templated",
      FALSE, G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);
  /**
   * EkncArticleObjectModel:authors:
   *
   * A list of authors of the article being read
   */
  eknc_article_object_model_props[PROP_AUTHORS] =
    g_param_spec_variant ("authors", "Authors",
      "A list of authors of the article being read",
      G_VARIANT_TYPE ("as"), NULL,
      G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);
  /**
   * EkncArticleObjectModel:temporal-coverage:
   *
   * A list of dates that the article being read refers to. The
   * dates are all in ISO8601.
   */
  eknc_article_object_model_props[PROP_TEMPORAL_COVERAGE] =
    g_param_spec_variant ("temporal-coverage", "Temporal Coverage",
      "A list of dates that the article being read refers to",
      G_VARIANT_TYPE ("as"), NULL,
      G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);
  /**
   * EkncArticleObjectModel:outgoing-links:
   *
   * A list of the outbound links present in this article.
   */
  eknc_article_object_model_props[PROP_OUTGOING_LINKS] =
    g_param_spec_variant ("outgoing-links", "Outgoing Links",
      "A list of the outbound links present in this article",
      G_VARIANT_TYPE ("as"), NULL,
      G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);
  /**
   * EkncArticleObjectModel:table-of-contents:
   *
   * A json array representing the article's hierarchical table of
   * contents
   */
  eknc_article_object_model_props[PROP_TABLE_OF_CONTENTS] =
    g_param_spec_variant ("table-of-contents", "Table of Contents",
      "A json array representing the article's hierarchical table of contents",
      G_VARIANT_TYPE ("aa{sv}"), NULL,
      G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);

  g_object_class_install_properties (object_class,
                                     NPROPS,
                                     eknc_article_object_model_props);
}

static void
eknc_article_object_model_init (EkncArticleObjectModel *self)
{
}

static void
eknc_article_object_model_add_json_to_params (JsonNode *node,
                                              GArray *params)
{
  if (!JSON_NODE_HOLDS_OBJECT (node))
    {
      g_critical ("Trying to instantiate a EkncArticleObjectModel from a non json object.");
      return;
    }

  eknc_content_object_model_add_json_to_params (node, params);

  JsonObject *object = json_node_get_object (node);
  GObjectClass *klass = g_type_class_ref (EKNC_TYPE_ARTICLE_OBJECT_MODEL);

  eknc_utils_append_gparam_from_json_node (json_object_get_member (object, "source"),
                                           g_object_class_find_property (klass, "source"),
                                           params);
  eknc_utils_append_gparam_from_json_node (json_object_get_member (object, "sourceName"),
                                           g_object_class_find_property (klass, "source-name"),
                                           params);
  eknc_utils_append_gparam_from_json_node (json_object_get_member (object, "published"),
                                           g_object_class_find_property (klass, "published"),
                                           params);
  eknc_utils_append_gparam_from_json_node (json_object_get_member (object, "wordCount"),
                                           g_object_class_find_property (klass, "word-count"),
                                           params);
  eknc_utils_append_gparam_from_json_node (json_object_get_member (object, "isServerTemplated"),
                                           g_object_class_find_property (klass, "is-server-templated"),
                                           params);
  eknc_utils_append_gparam_from_json_node (json_object_get_member (object, "authors"),
                                           g_object_class_find_property (klass, "authors"),
                                           params);
  eknc_utils_append_gparam_from_json_node (json_object_get_member (object, "temporalCoverage"),
                                           g_object_class_find_property (klass, "temporal-coverage"),
                                           params);
  eknc_utils_append_gparam_from_json_node (json_object_get_member (object, "outgoingLinks"),
                                           g_object_class_find_property (klass, "outgoing-links"),
                                           params);
  eknc_utils_append_gparam_from_json_node (json_object_get_member (object, "tableOfContents"),
                                           g_object_class_find_property (klass, "table-of-contents"),
                                           params);
  g_type_class_unref (klass);
}

/**
 * eknc_article_object_model_get_authors:
 * @self: the model
 *
 * Get the models authors.
 *
 * Returns: (transfer none): the resources GVariant
 */
GVariant *
eknc_article_object_model_get_authors (EkncArticleObjectModel *self)
{
  g_return_val_if_fail (EKNC_IS_ARTICLE_OBJECT_MODEL (self), NULL);

  EkncArticleObjectModelPrivate *priv = eknc_article_object_model_get_instance_private (self);
  return priv->authors;
}

/**
 * eknc_article_object_model_get_temporal_coverage:
 * @self: the model
 *
 * Get the temporal coverage over the article.
 *
 * Since: 2
 * Returns: (transfer none): the resources GVariant
 */
GVariant *
eknc_article_object_model_get_temporal_coverage (EkncArticleObjectModel *self)
{
  g_return_val_if_fail (EKNC_IS_ARTICLE_OBJECT_MODEL (self), NULL);

  EkncArticleObjectModelPrivate *priv = eknc_article_object_model_get_instance_private (self);
  return priv->temporal_coverage;
}

/**
 * eknc_article_object_model_get_outgoing_links:
 * @self: the model
 *
 * Get the models outgoing_links.
 *
 * Returns: (transfer none): the resources GVariant
 */
GVariant *
eknc_article_object_model_get_outgoing_links (EkncArticleObjectModel *self)
{
  g_return_val_if_fail (EKNC_IS_ARTICLE_OBJECT_MODEL (self), NULL);

  EkncArticleObjectModelPrivate *priv = eknc_article_object_model_get_instance_private (self);
  return priv->outgoing_links;
}

/**
 * eknc_article_object_model_get_table_of_contents:
 * @self: the model
 *
 * Get the models table of contents.
 *
 * Returns: (transfer none): the resources GVariant
 */
GVariant *
eknc_article_object_model_get_table_of_contents (EkncArticleObjectModel *self)
{
  g_return_val_if_fail (EKNC_IS_ARTICLE_OBJECT_MODEL (self), NULL);

  EkncArticleObjectModelPrivate *priv = eknc_article_object_model_get_instance_private (self);
  return priv->table_of_contents;
}

/**
 * eknc_article_object_model_new_from_json_node:
 * @node: a json node with the model metadata
 *
 * Instantiates a #EkncArticleObjectModel from a JsonNode of object metadata.
 * Outside of testing this metadata is usually retrieved from a shard.
 *
 * Returns: The newly created #EkncArticleObjectModel.
 */
EkncContentObjectModel *
eknc_article_object_model_new_from_json_node (JsonNode *node)
{
  GArray *params = g_array_new (FALSE, TRUE, sizeof (GParameter));
  eknc_article_object_model_add_json_to_params (node, params);
  EkncArticleObjectModel *model = g_object_newv (EKNC_TYPE_ARTICLE_OBJECT_MODEL,
                                               params->len,
                                               (GParameter *)params->data);
  eknc_utils_free_gparam_array (params);
  return EKNC_CONTENT_OBJECT_MODEL (model);
}
