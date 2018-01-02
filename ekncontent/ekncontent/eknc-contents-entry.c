/* Copyright 2018 Endless Mobile, Inc. */

#include "eknc-contents.h"

/**
 * SECTION:contents
 * @title: Table of Contents
 * @short_description: Representation of a table of contents
 *
 * A #EkncContents represents the table of contents for a document.
 */

// FIXME: make public and boxed
typedef struct _EkncContentsEntry
{
  unsigned index;
  char *index_label;
  char *label;
  char *content;
} EkncContentsEntry;

void
eknc_contents_entry_clear (EkncContentsEntry *entry)
{
  entry->index = 0;
  g_clear_pointer (&entry->index_label, g_free);
  g_clear_pointer (&entry->label, g_free);
  g_clear_pointer (&entry->content, g_free);
}

// FIXME: need to implement hasParent (and therefore pick a different data
// structure.) Check if there's a GTK-independent version of GtkTreeModel.
// grepping: table_of_contents, hasParent, hasIndex, hasLabel, hasContent

gboolean
eknc_contents_entry_fill_from_json_node (EkncContentsEntry *entry,
                                         JsonNode *node)
{
  if (!JSON_NODE_HOLDS_OBJECT (node))
    {
      g_critical ("Expected JSON object");
      return FALSE;
    }

  JsonObject *object = json_node_get_object (node);
  JsonNode *node;

  node = json_object_get_member (object, "hasIndex");
  if (!JSON_NODE_HOLDS_INT (node))
    {
      g_critical ("Expected integer for hasIndex key");
      return FALSE;
    }
  entry->index = json_node_get_int (node);

  node = json_object_get_member (object, "hasIndexLabel");
  if (!JSON_NODE_HOLDS_STRING (node))
    {
      g_critical ("Expected string for hasIndexLabel key");
      return FALSE;
    }
  entry->index_label = json_node_dup_string (node);

  node = json_object_get_member (object, "hasLabel");
  if (!JSON_NODE_HOLDS_STRING (node))
    {
      g_critical ("Expected string for hasLabel key");
      eknc_contents_entry_clear (entry);
      return FALSE;
    }
  entry->label = json_node_dup_string (node);

  node = json_object_get_member (object, "hasContent");
  if (!JSON_NODE_HOLDS_STRING (node))
    {
      g_critical ("Expected string for hasContent key");
      eknc_contents_entry_clear (entry);
      return FALSE;
    }
  entry->content = json_node_dup_string (node);

  return TRUE;
}

typedef struct {
  size_t len;
  EkncContentsEntry *entries;
} EkncContentObjectModelPrivate;

G_DEFINE_TYPE_WITH_PRIVATE (EkncContents, eknc_contents, G_TYPE_OBJECT)

static void
eknc_content_object_model_finalize (GObject *object)
{
  EkncContents *self = EKNC_CONTENTS (object);
  EkncContentsPrivate *priv = eknc_contents_get_instance_private (self);

  for (size_t ix = 0; ix < priv->len; ix++)
    eknc_contents_entry_clear (priv->entries[ix]);

  g_slice_free (EkncContentsEntry, priv->entries);

  G_OBJECT_CLASS (eknc_contents_parent_class)->finalize (object);
}

static void
eknc_contents_class_init (EkncContentsClass *klass)
{
  GObjectClass *object_class = G_OBJECT_CLASS (klass);

  object_class->finalize = eknc_content_object_model_finalize;
}

static void
eknc_contents_init (EkncContents *self)
{
}

/**
 * eknc_contents_new_from_json_node:
 * @node: a JSON node with the table of contents
 * @error: return location for an error
 *
 * Instantiates a #EkncContents from a JsonNode of table of contents data.
 * Outside of testing this metadata is usually retrieved from a shard.
 *
 * Returns: (transfer full): The newly created #EkncContents.
 */
EkncContents *
eknc_contents_new_from_json_node (JsonNode *node)
{
  if (!JSON_NODE_HOLDS_ARRAY (node))
    {
      g_critical ("Expected JSON array");
      return NULL;
    }

  JsonArray *array = json_node_get_array (node);
  unsigned n_elements = json_array_get_length (array);

  EkncContents *self = g_object_new (EKNC_TYPE_CONTENTS, NULL);
  EkncContentsPrivate *priv = eknc_contents_get_instance_private (self);
  priv->len = n_elements;
  priv->entries = g_slice_new0 (EkncContentsEntry, n_elements);

  for (unsigned ix = 0; ix < n_elements; ix++)
    {
      if (!eknc_contents_entry_fill_from_json_node (priv->entries[ix],
                                                    json_array_get_element (array, ix)))
        {
          g_object_unref (self);
          return NULL;
        }
    }

  return self;
}

/**
 * eknc_contents_get_index:
 * @self: the table of contents
 * @entry: the index of the entry
 *
 * FIXME is this always going to be monotonically increasing, or are gaps allowed?
 */
size_t
eknc_contents_get_index (EkncContents *self,
                         size_t entry)
{
  EkncContentsPrivate *priv = eknc_contents_get_instance_private (self);
  return priv->entries[entry]->index;
}

/**
 * eknc_contents_get_index_label:
 * @self: the table of contents
 * @entry: the index of the entry
 *
 * Returns: FIXME what is this
 */
const char *
eknc_contents_get_index_label (EkncContents *self,
                               size_t entry)
{
  EkncContentsPrivate *priv = eknc_contents_get_instance_private (self);
  return priv->entries[entry]->index_label;
}

/**
 * eknc_contents_get_label:
 * @self: the table of contents
 * @entry: the index of the entry
 *
 * Returns: FIXME what is this
 */
const char *
eknc_contents_get_label (EkncContents *self,
                         size_t entry)
{
  EkncContentsPrivate *priv = eknc_contents_get_instance_private (self);
  return priv->entries[entry]->label;
}

/**
 * eknc_contents_get_content:
 * @self: the table of contents
 * @entry: the index of the entry
 *
 * Returns: FIXME what is this
 */
const char *
eknc_contents_get_content (EkncContents *self,
                           size_t entry)
{
  EkncContentsPrivate *priv = eknc_contents_get_instance_private (self);
  return priv->entries[entry]->content;
}
