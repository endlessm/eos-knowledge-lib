/* -*- mode: C; c-file-style: "gnu"; indent-tabs-mode: nil; -*- */

/* Copyright 2014 Endless Mobile, Inc. */

#ifndef EKN_HISTORY_MODEL_H
#define EKN_HISTORY_MODEL_H

#if !(defined(_EKN_INSIDE_EOSKNOWLEDGE_H) || defined(COMPILING_EOS_KNOWLEDGE))
#error "Please do not include this header file directly."
#endif

#include "ekn-types.h"
#include "ekn-history-item-model.h"

#include <glib-object.h>
#include <gio/gio.h>

G_BEGIN_DECLS

#define EKN_TYPE_HISTORY_MODEL ekn_history_model_get_type()

#define EKN_HISTORY_MODEL(obj) \
  (G_TYPE_CHECK_INSTANCE_CAST ((obj), \
  EKN_TYPE_HISTORY_MODEL, EknHistoryModel))

#define EKN_HISTORY_MODEL_CLASS(klass) \
  (G_TYPE_CHECK_CLASS_CAST ((klass), \
  EKN_TYPE_HISTORY_MODEL, EknHistoryModelClass))

#define EKN_IS_HISTORY_MODEL(obj) \
  (G_TYPE_CHECK_INSTANCE_TYPE ((obj), \
  EKN_TYPE_HISTORY_MODEL))

#define EKN_IS_HISTORY_MODEL_CLASS(klass) \
  (G_TYPE_CHECK_CLASS_TYPE ((klass), \
  EKN_TYPE_HISTORY_MODEL))

#define EKN_HISTORY_MODEL_GET_CLASS(obj) \
  (G_TYPE_INSTANCE_GET_CLASS ((obj), \
  EKN_TYPE_HISTORY_MODEL, EknHistoryModelClass))

/**
 * EknHistoryModel:
 *
 * This instance structure contains no public members.
 */
typedef struct _EknHistoryModel EknHistoryModel;
/**
 * EknHistoryModelClass:
 *
 * This class structure contains no public members.
 */
typedef struct _EknHistoryModelClass EknHistoryModelClass;

struct _EknHistoryModel
{
  /*< private >*/
  GObject parent;
};

struct _EknHistoryModelClass
{
  /*< private >*/
  GObjectClass parent_class;
};

EKN_AVAILABLE_IN_0_0
GType                ekn_history_model_get_type           (void) G_GNUC_CONST;

EKN_AVAILABLE_IN_0_0
EknHistoryModel     *ekn_history_model_new                (void);

EKN_AVAILABLE_IN_0_0
void                 ekn_history_model_clear              (EknHistoryModel     *self);

EKN_AVAILABLE_IN_0_0
void                 ekn_history_model_go_back            (EknHistoryModel     *self);

EKN_AVAILABLE_IN_0_0
void                 ekn_history_model_go_forward         (EknHistoryModel     *self);

EKN_AVAILABLE_IN_0_0
EknHistoryItemModel *ekn_history_model_get_item           (EknHistoryModel     *self,
                                                           gint                 index);

EKN_AVAILABLE_IN_0_0
GSList              *ekn_history_model_get_back_list      (EknHistoryModel     *self);

EKN_AVAILABLE_IN_0_0
GSList              *ekn_history_model_get_forward_list   (EknHistoryModel     *self);

EKN_AVAILABLE_IN_0_0
gboolean             ekn_history_model_get_can_go_back    (EknHistoryModel     *self);

EKN_AVAILABLE_IN_0_0
gboolean             ekn_history_model_get_can_go_forward (EknHistoryModel     *self);

EKN_AVAILABLE_IN_0_0
EknHistoryItemModel *ekn_history_model_get_current_item   (EknHistoryModel     *self);

EKN_AVAILABLE_IN_0_0
void                 ekn_history_model_set_current_item   (EknHistoryModel     *self,
                                                           EknHistoryItemModel *item);

G_END_DECLS

#endif /* EKN_HISTORY_MODEL_H */
