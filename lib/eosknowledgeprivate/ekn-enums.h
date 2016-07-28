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

EKN_AVAILABLE_IN_0_0
GType ekn_tree_node_column_get_type  (void) G_GNUC_CONST;

G_END_DECLS

#endif /* EKN_ENUMS_H */
