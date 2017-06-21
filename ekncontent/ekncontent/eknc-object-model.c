#include "eknc-object-model.h"

#include "eknc-audio-object-model.h"
#include "eknc-article-object-model.h"
#include "eknc-dictionary-object-model.h"
#include "eknc-set-object-model.h"
#include "eknc-media-object-model.h"
#include "eknc-image-object-model.h"
#include "eknc-utils.h"
#include "eknc-video-object-model.h"

#include <json-glib/json-glib.h>

/**
 * eknc_object_model_from_json_node:
 * @node: a JsonNode with object metadata
 * @error: an error if one occurred
 *
 * Creates an object model.
 *
 * Returns: (transfer full): The newly created #EkncContentObjectModel.
 */
EkncContentObjectModel *
eknc_object_model_from_json_node (JsonNode *node,
                                  GError **error)
{
  if (!JSON_NODE_HOLDS_OBJECT (node))
    {
      g_set_error (error, EKNC_CONTENT_OBJECT_ERROR, EKNC_CONTENT_OBJECT_ERROR_BAD_FORMAT,
                   "Trying to instantiate a object model from a non json object");
      return NULL;
    }

  JsonNode *type_node = json_object_get_member (json_node_get_object (node), "@type");

  if (type_node == NULL)
    {
      g_set_error (error, EKNC_CONTENT_OBJECT_ERROR, EKNC_CONTENT_OBJECT_ERROR_BAD_FORMAT,
                   "Object model json has no @type field");
      return NULL;
    }

  if (!JSON_NODE_HOLDS_VALUE (type_node) ||
      json_node_get_value_type (type_node) != G_TYPE_STRING)
    {
      g_set_error (error, EKNC_CONTENT_OBJECT_ERROR, EKNC_CONTENT_OBJECT_ERROR_BAD_FORMAT,
                   "Unexpected value type for @type field");
      return NULL;
    }


  const gchar *type = json_node_get_string (type_node);
  if (g_strcmp0 (type, "ekn://_vocab/ContentObject") == 0)
    {
      return eknc_content_object_model_new_from_json_node (node);
    }
  else if (g_strcmp0 (type, "ekn://_vocab/ArticleObject") == 0)
    {
      return eknc_article_object_model_new_from_json_node (node);
    }
  else if (g_strcmp0 (type, "ekn://_vocab/DictionaryObject") == 0)
    {
      return eknc_dictionary_object_model_new_from_json_node (node);
    }
  else if (g_strcmp0 (type, "ekn://_vocab/SetObject") == 0)
    {
      return eknc_set_object_model_new_from_json_node (node);
    }
  else if (g_strcmp0 (type, "ekn://_vocab/MediaObject") == 0)
    {
      return eknc_media_object_model_new_from_json_node (node);
    }
  else if (g_strcmp0 (type, "ekn://_vocab/ImageObject") == 0)
    {
      return eknc_image_object_model_new_from_json_node (node);
    }
  else if (g_strcmp0 (type, "ekn://_vocab/VideoObject") == 0)
    {
      return eknc_video_object_model_new_from_json_node (node);
    }
  else if (g_strcmp0 (type, "ekn://_vocab/AudioObject") == 0)
    {
      return eknc_audio_object_model_new_from_json_node (node);
    }
  else
    {
      g_set_error (error, EKNC_CONTENT_OBJECT_ERROR, EKNC_CONTENT_OBJECT_ERROR_BAD_FORMAT,
                   "Unknown value for @type field %s", type);
      return NULL;
    }
}
