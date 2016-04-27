/* -*- mode: C; c-file-style: "gnu"; indent-tabs-mode: nil; -*- */
/* Copyright (C) 2014-2016 Endless Mobile, Inc. */

#include "ekn-types.h"

/**
 * SECTION:enums
 * @short_description: Enumeration constants
 * @title: Enums
 * @include: eosknowledge/eosknowledge.h
 *
 * This section includes various enumerations.
 */

EKN_DEFINE_ENUM_TYPE (EknLoadingAnimationType, ekn_loading_animation,
                      EKN_ENUM_VALUE (EKN_LOADING_ANIMATION_TYPE_NONE, none)
                      EKN_ENUM_VALUE (EKN_LOADING_ANIMATION_TYPE_FORWARDS_NAVIGATION, forwards-navigation)
                      EKN_ENUM_VALUE (EKN_LOADING_ANIMATION_TYPE_BACKWARDS_NAVIGATION, backwards-navigation)
                      EKN_ENUM_VALUE (EKN_LOADING_ANIMATION_TYPE_MULTI_FORWARDS_NAVIGATION, multi-forwards-navigation)
                      EKN_ENUM_VALUE (EKN_LOADING_ANIMATION_TYPE_MULTI_BACKWARDS_NAVIGATION, multi-backwards-navigation))

EKN_DEFINE_ENUM_TYPE (EknTextTransformType, ekn_text_transform,
                      EKN_ENUM_VALUE (EKN_TEXT_TRANSFORM_NONE, none)
                      EKN_ENUM_VALUE (EKN_TEXT_TRANSFORM_CAPITALIZE, capitalize)
                      EKN_ENUM_VALUE (EKN_TEXT_TRANSFORM_UPPERCASE, uppercase)
                      EKN_ENUM_VALUE (EKN_TEXT_TRANSFORM_LOWERCASE, lowercase)
                      EKN_ENUM_VALUE (EKN_TEXT_TRANSFORM_FULL_WIDTH, full-width))

EKN_DEFINE_ENUM_TYPE (EknTreeNodeColumn, ekn_tree_node_column,
                      EKN_ENUM_VALUE (EKN_TREE_NODE_COLUMN_LABEL, label)
                      EKN_ENUM_VALUE (EKN_TREE_NODE_COLUMN_INDEX_LABEL, index-label)
                      EKN_ENUM_VALUE (EKN_TREE_NODE_COLUMN_CONTENT, content)
                      EKN_ENUM_VALUE (EKN_TREE_NODE_COLUMN_NUM_COLUMNS, num-columns))
