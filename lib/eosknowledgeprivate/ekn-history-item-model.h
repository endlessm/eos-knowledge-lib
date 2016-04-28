/* -*- mode: C; c-file-style: "gnu"; indent-tabs-mode: nil; -*- */

/* Copyright (C) 2014-2016 Endless Mobile, Inc. */

#ifndef EKN_HISTORY_ITEM_MODEL_H
#define EKN_HISTORY_ITEM_MODEL_H

#if !(defined(_EKN_INSIDE_EOSKNOWLEDGE_H) || defined(COMPILING_EOS_KNOWLEDGE))
#error "Please do not include this header file directly."
#endif

#include "ekn-types.h"

#include <glib-object.h>

G_BEGIN_DECLS

#define EKN_TYPE_HISTORY_ITEM_MODEL ekn_history_item_model_get_type()

#define EKN_HISTORY_ITEM_MODEL(obj) \
  (G_TYPE_CHECK_INSTANCE_CAST ((obj), \
  EKN_TYPE_HISTORY_ITEM_MODEL, EknHistoryItemModel))

#define EKN_IS_HISTORY_ITEM_MODEL(obj) \
  (G_TYPE_CHECK_INSTANCE_TYPE ((obj), \
  EKN_TYPE_HISTORY_ITEM_MODEL))

#define EKN_HISTORY_ITEM_MODEL_GET_INTERFACE(obj) \
  (G_TYPE_INSTANCE_GET_INTERFACE ((obj), \
  EKN_TYPE_HISTORY_ITEM_MODEL, EknHistoryItemModelInterface))

/* EknHistoryItemModel isn't backed by a struct */
/**
 * EknHistoryItemModel:
 *
 * This instance structure contains no public members.
 */
typedef struct _EknHistoryItemModel EknHistoryItemModel;
/**
 * EknHistoryItemModelInterface:
 *
 * This interface vtable contains no public function slots.
 */
typedef struct _EknHistoryItemModelInterface EknHistoryItemModelInterface;

struct _EknHistoryItemModelInterface
{
  /*< private >*/
  GTypeInterface parent_interface;
};

EKN_AVAILABLE_IN_0_0
GType  ekn_history_item_model_get_type  (void) G_GNUC_CONST;

EKN_AVAILABLE_IN_0_0
gchar *ekn_history_item_model_get_title (EknHistoryItemModel *self);

G_END_DECLS

#endif /* EKN_HISTORY_ITEM_MODEL_H */
