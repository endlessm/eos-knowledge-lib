/* -*- mode: C; c-file-style: "gnu"; indent-tabs-mode: nil; -*- */
/* Copyright 2014-2015 Endless Mobile, Inc. */

#include "ekn-types.h"

/**
 * SECTION:enums
 * @short_description: Enumeration constants
 * @title: Enums
 * @include: eosknowledge/eosknowledge.h
 *
 * This section includes various enumerations.
 */

EKN_DEFINE_ENUM_TYPE (EknTreeNodeColumn, ekn_tree_node_column,
                      EKN_ENUM_VALUE (EKN_TREE_NODE_COLUMN_LABEL, label)
                      EKN_ENUM_VALUE (EKN_TREE_NODE_COLUMN_INDEX_LABEL, index-label)
                      EKN_ENUM_VALUE (EKN_TREE_NODE_COLUMN_CONTENT, content)
                      EKN_ENUM_VALUE (EKN_TREE_NODE_COLUMN_NUM_COLUMNS, num-columns))
