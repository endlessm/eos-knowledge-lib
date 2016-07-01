/* -*- mode: C; c-file-style: "gnu"; indent-tabs-mode: nil; -*- */
/* Copyright 2014 Endless Mobile, Inc. */

#ifndef EKN_ENUMS_H
#define EKN_ENUMS_H

#if !(defined(_EKN_INSIDE_EOSKNOWLEDGE_H) || defined(COMPILING_EOS_KNOWLEDGE))
#error "Please do not include this header file directly."
#endif

#include "ekn-version.h"

#include <glib.h>
#include <glib-object.h>

G_BEGIN_DECLS

/* Shared typedefs for enumerations */

#define EKN_TYPE_TREE_NODE_COLUMN   (ekn_tree_node_column_get_type ())
#define EKN_TYPE_TEXT_TRANSFORM     (ekn_text_transform_get_type ())

/**
 * EknTreeNodeColumn:
 * @EKN_TREE_NODE_COLUMN_LABEL: displayable string describing the node's content
 * @EKN_TREE_NODE_COLUMN_INDEX_LABEL: displayable string representing this
 * node's index, order notwithstanding
 * @EKN_TREE_NODE_COLUMN_CONTENT: URI for the #EknContentObjectModel that this
 * node refers to
 * @EKN_TREE_NODE_COLUMN_NUM_COLUMNS: total number of columns in the tree model
 *
 * Constants referring to column indices in the #GtkTreeModel returned by
 * ekn_tree_model_from_tree_node().
 * All columns are #G_TYPE_STRING columns, even though the 'content' parameter
 * refers to a document.
 *
 * This API deals with loading an RDF TreeNode document and turning it into a
 * #GtkTreeModel.
 * Most of the API is in a Javascript override; see the Javascript overrides
 * documentation.
 */
typedef enum
{
  EKN_TREE_NODE_COLUMN_LABEL,
  EKN_TREE_NODE_COLUMN_INDEX_LABEL,
  EKN_TREE_NODE_COLUMN_CONTENT,
  EKN_TREE_NODE_COLUMN_NUM_COLUMNS
} EknTreeNodeColumn;

/**
 * EknTextTransform:
 * @EKN_TEXT_TRANSFORM_NONE: no formatting change
 * @EKN_TEXT_TRANSFORM_CAPITALIZE: capitalize the first letter of each word
 * @EKN_TEXT_TRANSFORM_UPPERCASE: capitalize every letter
 * @EKN_TEXT_TRANSFORM_LOWERCASE: force every letter to be lowercase
 * @EKN_TEXT_TRANSFORM_FULL_WIDTH: force every letter to be written inside a
 * full-width square, allowing them to be aligned with East Asian scripts (not
 * supported)
 *
 * Constants referring to different capitalization operations, modeled after the
 * `text-transform` CSS property.
 *
 * Since: 0.4
 */
typedef enum
{
  EKN_TEXT_TRANSFORM_NONE,
  EKN_TEXT_TRANSFORM_CAPITALIZE,
  EKN_TEXT_TRANSFORM_UPPERCASE,
  EKN_TEXT_TRANSFORM_LOWERCASE,
  EKN_TEXT_TRANSFORM_FULL_WIDTH,
} EknTextTransform;

EKN_AVAILABLE_IN_0_0
GType ekn_tree_node_column_get_type  (void) G_GNUC_CONST;

EKN_AVAILABLE_IN_0_4
GType ekn_text_transform_get_type    (void) G_GNUC_CONST;

G_END_DECLS

#endif /* EKN_ENUMS_H */
