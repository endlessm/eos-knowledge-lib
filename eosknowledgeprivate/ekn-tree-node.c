/* Copyright 2014 Endless Mobile, Inc. */

#include "ekn-types.h"

/**
 * SECTION:tree-node
 * @short_description: Dealing with RDF TreeNodes
 * @title: TreeNode
 * @include: eosknowledge/eosknowledge.h
 *
 * This API deals with loading an RDF TreeNode document and turning it into a
 * #GtkTreeModel.
 * Most of the API is in a Javascript override; see the Javascript overrides
 * documentation.
 */

EKN_DEFINE_ENUM_TYPE (EknTreeNodeColumn, ekn_tree_node_column,
                      EKN_ENUM_VALUE (EKN_TREE_NODE_COLUMN_LABEL, label)
                      EKN_ENUM_VALUE (EKN_TREE_NODE_COLUMN_INDEX_LABEL, index-label)
                      EKN_ENUM_VALUE (EKN_TREE_NODE_COLUMN_CONTENT, content)
                      EKN_ENUM_VALUE (EKN_TREE_NODE_COLUMN_NUM_COLUMNS, num-columns))
