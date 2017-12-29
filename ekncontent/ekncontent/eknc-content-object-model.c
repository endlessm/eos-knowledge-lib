/* Copyright 2016 Endless Mobile, Inc. */

#include "eknc-content-object-model.h"
#include "eknc-content-object-model-private.h"

#include <string.h>
#include "eknc-utils-private.h"

/**
 * SECTION:content-object-model
 * @title: Content Object Model
 * @short_description: Access content object metadata
 *
 * A #EkncContentObjectModel is the base class for all content objects in the
 * knowledge app.
 */
typedef struct {
  gchar *ekn_id;
  gchar *title;
  gchar *original_title;
  gchar *original_uri;
  gchar *thumbnail_uri;
  gchar *language;
  gchar *copyright_holder;
  gchar *source_uri;
  gchar *content_type;
  gchar *synopsis;
  gchar *last_modified_date;
  gchar *license;
  gboolean featured;
  char **tags;
  char **resources;
  GVariant *discovery_feed_content;
} EkncContentObjectModelPrivate;

G_DEFINE_TYPE_WITH_PRIVATE (EkncContentObjectModel,
                            eknc_content_object_model,
                            G_TYPE_OBJECT)

enum {
  PROP_0,
  PROP_EKN_ID,
  PROP_TITLE,
  PROP_ORIGINAL_TITLE,
  PROP_ORIGINAL_URI,
  PROP_THUMBNAIL_URI,
  PROP_LANGUAGE,
  PROP_COPYRIGHT_HOLDER,
  PROP_SOURCE_URI,
  PROP_CONTENT_TYPE,
  PROP_SYNOPSIS,
  PROP_LAST_MODIFIED_DATE,
  PROP_LICENSE,
  PROP_FEATURED,
  PROP_TAGS,
  PROP_RESOURCES,
  PROP_DISCOVERY_FEED_CONTENT,
  NPROPS
};

static GParamSpec *eknc_content_object_model_props [NPROPS] = { NULL, };

static void
eknc_content_object_model_get_property (GObject    *object,
                                        guint       prop_id,
                                        GValue     *value,
                                        GParamSpec *pspec)
{
  EkncContentObjectModel *self = EKNC_CONTENT_OBJECT_MODEL (object);
  EkncContentObjectModelPrivate *priv = eknc_content_object_model_get_instance_private (self);

  switch (prop_id)
    {
    case PROP_EKN_ID:
      g_value_set_string (value, priv->ekn_id);
      break;

    case PROP_TITLE:
      g_value_set_string (value, priv->title);
      break;

    case PROP_ORIGINAL_TITLE:
      g_value_set_string (value, priv->original_title);
      break;

    case PROP_ORIGINAL_URI:
      g_value_set_string (value, priv->original_uri);
      break;

    case PROP_THUMBNAIL_URI:
      g_value_set_string (value, priv->thumbnail_uri);
      break;

    case PROP_LANGUAGE:
      g_value_set_string (value, priv->language);
      break;

    case PROP_COPYRIGHT_HOLDER:
      g_value_set_string (value, priv->copyright_holder);
      break;

    case PROP_SOURCE_URI:
      g_value_set_string (value, priv->source_uri);
      break;

    case PROP_CONTENT_TYPE:
      g_value_set_string (value, priv->content_type);
      break;

    case PROP_SYNOPSIS:
      g_value_set_string (value, priv->synopsis);
      break;

    case PROP_LAST_MODIFIED_DATE:
      g_value_set_string (value, priv->last_modified_date);
      break;

    case PROP_LICENSE:
      g_value_set_string (value, priv->license);
      break;

    case PROP_FEATURED:
      g_value_set_boolean (value, priv->featured);
      break;

    case PROP_TAGS:
      g_value_set_boxed (value, priv->tags);
      break;

    case PROP_RESOURCES:
      g_value_set_boxed (value, priv->resources);
      break;

    case PROP_DISCOVERY_FEED_CONTENT:
      g_value_set_variant (value, priv->discovery_feed_content);
      break;

    default:
      G_OBJECT_WARN_INVALID_PROPERTY_ID (object, prop_id, pspec);
    }
}

static void
eknc_content_object_model_set_property (GObject *object,
                                        guint prop_id,
                                        const GValue *value,
                                        GParamSpec *pspec)
{
  EkncContentObjectModel *self = EKNC_CONTENT_OBJECT_MODEL (object);
  EkncContentObjectModelPrivate *priv = eknc_content_object_model_get_instance_private (self);

  switch (prop_id)
    {
    case PROP_EKN_ID:
      g_clear_pointer (&priv->ekn_id, g_free);
      priv->ekn_id = g_value_dup_string (value);
      break;

    case PROP_TITLE:
      g_clear_pointer (&priv->title, g_free);
      priv->title = g_value_dup_string (value);
      break;

    case PROP_ORIGINAL_TITLE:
      g_clear_pointer (&priv->original_title, g_free);
      priv->original_title = g_value_dup_string (value);
      break;

    case PROP_ORIGINAL_URI:
      g_clear_pointer (&priv->original_uri, g_free);
      priv->original_uri = g_value_dup_string (value);
      break;

    case PROP_THUMBNAIL_URI:
      g_clear_pointer (&priv->thumbnail_uri, g_free);
      priv->thumbnail_uri = g_value_dup_string (value);
      break;

    case PROP_LANGUAGE:
      g_clear_pointer (&priv->language, g_free);
      priv->language = g_value_dup_string (value);
      break;

    case PROP_COPYRIGHT_HOLDER:
      g_clear_pointer (&priv->copyright_holder, g_free);
      priv->copyright_holder = g_value_dup_string (value);
      break;

    case PROP_SOURCE_URI:
      g_clear_pointer (&priv->source_uri, g_free);
      priv->source_uri = g_value_dup_string (value);
      break;

    case PROP_CONTENT_TYPE:
      g_clear_pointer (&priv->content_type, g_free);
      priv->content_type = g_value_dup_string (value);
      break;

    case PROP_SYNOPSIS:
      g_clear_pointer (&priv->synopsis, g_free);
      priv->synopsis = g_value_dup_string (value);
      break;

    case PROP_LAST_MODIFIED_DATE:
      g_clear_pointer (&priv->last_modified_date, g_free);
      priv->last_modified_date = g_value_dup_string (value);
      break;

    case PROP_LICENSE:
      g_clear_pointer (&priv->license, g_free);
      priv->license = g_value_dup_string (value);
      break;

    case PROP_FEATURED:
      priv->featured = g_value_get_boolean (value);
      break;

    case PROP_TAGS:
      g_clear_pointer (&priv->tags, g_strfreev);
      priv->tags = g_value_dup_boxed (value);
      break;

    case PROP_RESOURCES:
      g_clear_pointer (&priv->resources, g_strfreev);
      priv->resources = g_value_dup_boxed (value);
      break;

    case PROP_DISCOVERY_FEED_CONTENT:
      g_clear_pointer (&priv->discovery_feed_content, g_variant_unref);
      priv->discovery_feed_content = g_value_dup_variant (value);
      break;

    default:
      G_OBJECT_WARN_INVALID_PROPERTY_ID (object, prop_id, pspec);
    }
}

static void
eknc_content_object_model_constructed (GObject *object)
{
  EkncContentObjectModel *self = EKNC_CONTENT_OBJECT_MODEL (object);
  EkncContentObjectModelPrivate *priv = eknc_content_object_model_get_instance_private (self);

  if (g_strcmp0 (priv->ekn_id, "") == 0)
    {
      // Note: This is only for ensuring the invariant of "each model has an
      // EKN ID" in tests. It is illegal to create a model in production code
      // with no EKN ID.
      g_autofree gchar *sum = NULL;
      static guint64 MOCKED_OBJECTS = 0;
      sum = g_compute_checksum_for_data (G_CHECKSUM_SHA1,
                                         (guchar *) &MOCKED_OBJECTS,
                                         sizeof (MOCKED_OBJECTS));
      MOCKED_OBJECTS++;
      g_free (priv->ekn_id);
      priv->ekn_id = g_strconcat ("ekn:///", sum, NULL);
    }
}

static void
eknc_content_object_model_finalize (GObject *object)
{
  EkncContentObjectModel *self = EKNC_CONTENT_OBJECT_MODEL (object);
  EkncContentObjectModelPrivate *priv = eknc_content_object_model_get_instance_private (self);

  g_clear_pointer (&priv->ekn_id, g_free);
  g_clear_pointer (&priv->title, g_free);
  g_clear_pointer (&priv->original_title, g_free);
  g_clear_pointer (&priv->original_uri, g_free);
  g_clear_pointer (&priv->thumbnail_uri, g_free);
  g_clear_pointer (&priv->language, g_free);
  g_clear_pointer (&priv->copyright_holder, g_free);
  g_clear_pointer (&priv->source_uri, g_free);
  g_clear_pointer (&priv->content_type, g_free);
  g_clear_pointer (&priv->synopsis, g_free);
  g_clear_pointer (&priv->last_modified_date, g_free);
  g_clear_pointer (&priv->license, g_free);
  g_clear_pointer (&priv->tags, g_strfreev);
  g_clear_pointer (&priv->resources, g_strfreev);
  g_clear_pointer (&priv->discovery_feed_content, g_variant_unref);

  G_OBJECT_CLASS (eknc_content_object_model_parent_class)->finalize (object);
}

static void
eknc_content_object_model_class_init (EkncContentObjectModelClass *klass)
{
  GObjectClass *object_class = G_OBJECT_CLASS (klass);

  object_class->get_property = eknc_content_object_model_get_property;
  object_class->set_property = eknc_content_object_model_set_property;
  object_class->constructed = eknc_content_object_model_constructed;
  object_class->finalize = eknc_content_object_model_finalize;

  /**
   * EkncContentObjectModel:ekn-id:
   *
   * Unique ID of the model
   *
   * This is an internal ID assigned by EKN.
   * If none is provided, the model will generate its own id.
   */
  eknc_content_object_model_props[PROP_EKN_ID] =
    g_param_spec_string ("ekn-id", "Object's ID",
      "The ID of a document or media object",
      "", G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);
  /**
   * EkncContentObjectModel:title:
   *
   * A string with the title of the content object.
   */
  eknc_content_object_model_props[PROP_TITLE] =
    g_param_spec_string ("title", "Title",
      "The title of a document or media object",
      "", G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);
  /**
   * EkncContentObjectModel:original-title:
   *
   * A string with the original title of the content object.
   */
  eknc_content_object_model_props[PROP_ORIGINAL_TITLE] =
    g_param_spec_string ("original-title", "Original Title",
      "The original title (wikipedia title) of a document or media object",
      "", G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);
  /**
   * EkncContentObjectModel:original-uri:
   *
   * URI where the original version of this content can be downloaded
   *
   * This property is distinct from source-uri, which represents the URI
   * where the article was downloaded from during database build.
   *
   * However, on an #ArticleObjectModel with source equal to
   * "wikipedia", "wikihow", "wikisource", or "wikibooks", it will be
   * set to the value of source-uri if it is not present in the
   * database, for backwards compatibility reasons.
   */
  eknc_content_object_model_props[PROP_ORIGINAL_URI] =
    g_param_spec_string ("original-uri", "Original URI",
      "URI where the original version of this content can be downloaded",
      "", G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);
  /**
   * EkncContentObjectModel:thumbnail-uri:
   *
   * URI of the thumbnail image
   *
   * Usually the EKN ID of an #ImageObjectModel.
   */
  eknc_content_object_model_props[PROP_THUMBNAIL_URI] =
    g_param_spec_string ("thumbnail-uri", "Thumbnail URI",
       "URI of the thumbnail image",
      "", G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);
  /**
   * EkncContentObjectModel:language:
   *
   * The language for this content object.
   */
  eknc_content_object_model_props[PROP_LANGUAGE] =
    g_param_spec_string ("language", "Language",
      "Language of the document or media object",
      "", G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);
  /**
   * EkncContentObjectModel:copyright-holder:
   *
   * The copyright holder for this content object.
   */
  eknc_content_object_model_props[PROP_COPYRIGHT_HOLDER] =
    g_param_spec_string ("copyright-holder", "Copyright Holder",
      "The copyright holder of the object",
      "", G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);
  /**
   * EkncContentObjectModel:source-uri:
   *
   * URI where this content was downloaded from during database build
   *
   * TODO Should we check to always have a value for source-uri?
   * Don't use this property for user-visible things.
   * It is only used internally.
   */
  eknc_content_object_model_props[PROP_SOURCE_URI] =
    g_param_spec_string ("source-uri", "Source URL",
      "URI where this content was downloaded from during database build",
      "", G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);
  /**
   * EkncContentObjectModel:content-type:
   *
   * The source content's mimetype
   */
  eknc_content_object_model_props[PROP_CONTENT_TYPE] =
    g_param_spec_string ("content-type", "Object Content Type",
      "Mimetype of the source content",
      "", G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);
  /**
   * EkncContentObjectModel:synopsis:
   *
   * The synopsis for this content object.
   */
  eknc_content_object_model_props[PROP_SYNOPSIS] =
    g_param_spec_string ("synopsis", "Synopsis",
      "Synopsis of the document or media object",
      "", G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);
  /**
   * EkncContentObjectModel:last-modified-date:
   *
   * The date of last modification for this content object. It treats dates
   * according to the ISO8601 standard.
   */
  eknc_content_object_model_props[PROP_LAST_MODIFIED_DATE] =
    g_param_spec_string ("last-modified-date", "Last Modified Date",
      "Last Modified Date of the document or media object",
      "", G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);
  /**
   * EkncContentObjectModel:license:
   *
   * The license for this content object.
   */
  eknc_content_object_model_props[PROP_LICENSE] =
    g_param_spec_string ("license", "License",
      "License of the document or media object",
      "", G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);
  /**
   * EkncContentObjectModel:featured:
   *
   * Whether this content should be given priority in the UI
   */
  eknc_content_object_model_props[PROP_FEATURED] =
    g_param_spec_boolean ("featured", "Featured",
      "Whether this content should be given priority in the UI",
      FALSE, G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);
  /**
   * EkncContentObjectModel:tags:
   *
   * A list of tag strings associated with the model.
   */
  eknc_content_object_model_props[PROP_TAGS] =
    g_param_spec_boxed ("tags", "Tags",
      "A list of tag strings associated with the model.",
      G_TYPE_STRV,
      G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);
  /**
   * EkncContentObjectModel:resources:
   *
   * A list of ekn ids of resources belonging to the model.
   */
  eknc_content_object_model_props[PROP_RESOURCES] =
    g_param_spec_boxed ("resources", "Resources",
      "A list of ekn ids of resources belonging to the model.",
      G_TYPE_STRV,
      G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);

  /**
   * EkncContentObjectModel:discovery-feed-content:
   *
   * Content which is specific to the discovery-feed.
   *
   * This is effectively meant to be opaque to content applications
   * and is parsed only by eos-knowledge-services when it generates the
   * discovery feed.
   */
  eknc_content_object_model_props[PROP_DISCOVERY_FEED_CONTENT] =
    g_param_spec_variant ("discovery-feed-content", "Discovery Feed Content",
      "Content to be used by the Discovery Feed",
      G_VARIANT_TYPE ("a{sv}"), NULL,
      G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);

  g_object_class_install_properties (object_class,
                                     NPROPS,
                                     eknc_content_object_model_props);
}

static void
eknc_content_object_model_init (EkncContentObjectModel *self)
{
}

/**
 * eknc_content_object_model_add_json_to_params: (skip)
 * @node: a json node
 * @params: a caller owned array a gparams
 *
 * Private function. Appends GParameters to the array with EkncContentObjectModel
 * property values parsed from the json node metadata.
 */
void
eknc_content_object_model_add_json_to_params (JsonNode *node,
                                              GArray *params)
{
  if (!JSON_NODE_HOLDS_OBJECT (node))
    {
      g_critical ("Trying to instantiate a EkncContentObjectModel from a non json object.");
      return;
    }

  JsonObject *object = json_node_get_object (node);
  GObjectClass *klass = g_type_class_ref (EKNC_TYPE_CONTENT_OBJECT_MODEL);

  eknc_utils_append_gparam_from_json_node (json_object_get_member (object, "@id"),
                                           g_object_class_find_property (klass, "ekn-id"),
                                           params);
  eknc_utils_append_gparam_from_json_node (json_object_get_member (object, "contentType"),
                                           g_object_class_find_property (klass, "content-type"),
                                           params);
  eknc_utils_append_gparam_from_json_node (json_object_get_member (object, "title"),
                                           g_object_class_find_property (klass, "title"),
                                           params);
  eknc_utils_append_gparam_from_json_node (json_object_get_member (object, "originalTitle"),
                                           g_object_class_find_property (klass, "original-title"),
                                           params);
  eknc_utils_append_gparam_from_json_node (json_object_get_member (object, "originalURI"),
                                           g_object_class_find_property (klass, "original-uri"),
                                           params);
  eknc_utils_append_gparam_from_json_node (json_object_get_member (object, "language"),
                                           g_object_class_find_property (klass, "language"),
                                           params);
  eknc_utils_append_gparam_from_json_node (json_object_get_member (object, "copyrightHolder"),
                                           g_object_class_find_property (klass, "copyright-holder"),
                                           params);
  eknc_utils_append_gparam_from_json_node (json_object_get_member (object, "sourceURI"),
                                           g_object_class_find_property (klass, "source-uri"),
                                           params);
  eknc_utils_append_gparam_from_json_node (json_object_get_member (object, "synopsis"),
                                           g_object_class_find_property (klass, "synopsis"),
                                           params);
  eknc_utils_append_gparam_from_json_node (json_object_get_member (object, "lastModifiedDate"),
                                           g_object_class_find_property (klass, "last-modified-date"),
                                           params);
  eknc_utils_append_gparam_from_json_node (json_object_get_member (object, "license"),
                                           g_object_class_find_property (klass, "license"),
                                           params);
  eknc_utils_append_gparam_from_json_node (json_object_get_member (object, "thumbnail"),
                                           g_object_class_find_property (klass, "thumbnail-uri"),
                                           params);
  eknc_utils_append_gparam_from_json_node (json_object_get_member (object, "featured"),
                                           g_object_class_find_property (klass, "featured"),
                                           params);
  eknc_utils_append_gparam_from_json_node (json_object_get_member (object, "tags"),
                                           g_object_class_find_property (klass, "tags"),
                                           params);
  eknc_utils_append_gparam_from_json_node (json_object_get_member (object, "resources"),
                                           g_object_class_find_property (klass, "resources"),
                                           params);
  eknc_utils_append_gparam_from_json_node (json_object_get_member (object, "discoveryFeedContent"),
                                           g_object_class_find_property (klass, "discovery-feed-content"),
                                           params);
  g_type_class_unref (klass);
}

/**
 * eknc_content_object_model_get_tags:
 * @self: the model
 *
 * Get the model's tags.
 *
 * Returns: (transfer none) (array zero-terminated=1): an array of strings
 */
char * const *
eknc_content_object_model_get_tags (EkncContentObjectModel *self)
{
  g_return_val_if_fail (EKNC_IS_CONTENT_OBJECT_MODEL (self), NULL);

  EkncContentObjectModelPrivate *priv = eknc_content_object_model_get_instance_private (self);
  return priv->tags;
}

/**
 * eknc_content_object_model_get_resources:
 * @self: the model
 *
 * Get the model's resources.
 *
 * Returns: (transfer none) (array zero-terminated=1): an array of strings
 */
char * const *
eknc_content_object_model_get_resources (EkncContentObjectModel *self)
{
  g_return_val_if_fail (EKNC_IS_CONTENT_OBJECT_MODEL (self), NULL);

  EkncContentObjectModelPrivate *priv = eknc_content_object_model_get_instance_private (self);
  return priv->resources;
}

/**
 * eknc_content_object_model_get_content_stream:
 * @self: the model
 * @error: set if an error occurred while loading the content
 *
 * Get a stream for the model's content.
 *
 * Returns: (transfer full): a GFileInputStream for the content
 */
GFileInputStream *
eknc_content_object_model_get_content_stream (EkncContentObjectModel *self,
                                              GError **error)
{
  g_return_val_if_fail (EKNC_IS_CONTENT_OBJECT_MODEL (self), NULL);

  EkncContentObjectModelPrivate *priv = eknc_content_object_model_get_instance_private (self);
  g_autoptr (GFile) file = g_file_new_for_uri (priv->ekn_id);
  return g_file_read (file, NULL, error);
}

/**
 * eknc_content_object_model_new_from_json_node:
 * @node: a json node with the model metadata
 *
 * Instantiates a #EkncContentObjectModel from a JsonNode of object metadata.
 * Outside of testing this metadata is usually retrieved from a shard.
 *
 * Returns: The newly created #EkncContentObjectModel.
 */
EkncContentObjectModel *
eknc_content_object_model_new_from_json_node (JsonNode *node)
{
G_GNUC_BEGIN_IGNORE_DEPRECATIONS
  GArray *params = g_array_new (FALSE, TRUE, sizeof (GParameter));
  eknc_content_object_model_add_json_to_params (node, params);
  EkncContentObjectModel *model = g_object_newv (EKNC_TYPE_CONTENT_OBJECT_MODEL,
                                                 params->len,
                                                 (GParameter *)params->data);
  eknc_utils_free_gparam_array (params);
G_GNUC_END_IGNORE_DEPRECATIONS
  return model;
}
