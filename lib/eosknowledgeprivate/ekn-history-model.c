/* -*- mode: C; c-file-style: "gnu"; indent-tabs-mode: nil; -*- */

/* Copyright (C) 2014-2016 Endless Mobile, Inc. */

#include "ekn-history-model.h"
#include "ekn-history-item-model.h"

#include <glib.h>

/**
 * SECTION:history-model
 * @short_description: List of pages that a history control keeps track of
 * @title: History model
 * @include: eosknowledge/eosknowledge.h
 *
 * This model keeps track of "pages" or items that a user visits, in order to
 * populate a history control such as a browser's back button, or a breadcrumb.
 *
 * The most important operation is to set the #EknHistoryModel:current-item
 * property.
 * This is used to navigate to a new page.
 * If the new page's #EknHistoryItemModel is identical to an item model already
 * in the history model, then it navigates back or forward through the list
 * instead.
 * (Note, that means the objects are the same, rather than having their
 * properties equal.)
 */

typedef struct
{
  GSList *back_list;
  GSList *forward_list;

  EknHistoryItemModel *current;
} EknHistoryModelPrivate;

G_DEFINE_TYPE_WITH_PRIVATE (EknHistoryModel, ekn_history_model, G_TYPE_OBJECT);

enum {
  PROP_0,
  PROP_CAN_GO_BACK,
  PROP_CAN_GO_FORWARD,
  PROP_CURRENT_ITEM,
  PROP_BACK_LIST,
  PROP_FORWARD_LIST,
  NPROPS
};

static GParamSpec *ekn_history_model_props[NPROPS] = { NULL, };

static void
ekn_history_model_get_property (GObject    *object,
                                guint       property_id,
                                GValue     *value,
                                GParamSpec *pspec)
{
  EknHistoryModel *self = EKN_HISTORY_MODEL (object);
  switch (property_id)
    {
    case PROP_CAN_GO_BACK:
      g_value_set_boolean (value, ekn_history_model_get_can_go_back (self));
      break;

    case PROP_CAN_GO_FORWARD:
      g_value_set_boolean (value, ekn_history_model_get_can_go_forward (self));
      break;

    case PROP_CURRENT_ITEM:
      g_value_set_object (value, ekn_history_model_get_current_item (self));
      break;

    case PROP_BACK_LIST:
      g_value_set_pointer (value, ekn_history_model_get_back_list (self));
      break;

    case PROP_FORWARD_LIST:
      g_value_set_pointer (value, ekn_history_model_get_forward_list (self));
      break;

    default:
      G_OBJECT_WARN_INVALID_PROPERTY_ID (object, property_id, pspec);
    }
}

static void
ekn_history_model_set_property (GObject      *object,
                                guint         property_id,
                                const GValue *value,
                                GParamSpec   *pspec)
{
  EknHistoryModel *self = EKN_HISTORY_MODEL (object);
  switch (property_id)
    {
    case PROP_CURRENT_ITEM:
      ekn_history_model_set_current_item (self, g_value_get_object (value));
      break;

    default:
      G_OBJECT_WARN_INVALID_PROPERTY_ID (object, property_id, pspec);
    }
}

/* Unref a list of GObjects and make it NULL (the empty list) */
static void
clear_list (GSList **listp)
{
  g_slist_free_full (*listp, g_object_unref);
  *listp = NULL;
}

static void
ekn_history_model_dispose (GObject *object)
{
  EknHistoryModel *self = EKN_HISTORY_MODEL (object);
  EknHistoryModelPrivate *priv = ekn_history_model_get_instance_private (self);

  g_clear_object (&priv->current);
  clear_list (&priv->back_list);
  clear_list (&priv->forward_list);

  G_OBJECT_CLASS (ekn_history_model_parent_class)->dispose (object);
}

static void
ekn_history_model_class_init (EknHistoryModelClass *klass)
{
  GObjectClass *object_class = G_OBJECT_CLASS (klass);
  object_class->get_property = ekn_history_model_get_property;
  object_class->set_property = ekn_history_model_set_property;
  object_class->dispose = ekn_history_model_dispose;

  /**
   * EknHistoryModel:can-go-back:
   *
   * %TRUE if there are any pages to go back to.
   * This property and #EknHistoryModel:can-go-forward can be bound to the
   * #GtkWidget:sensitive property of a back or forward button, for example.
   */
  ekn_history_model_props[PROP_CAN_GO_BACK] =
    g_param_spec_boolean ("can-go-back", "Can go back",
                          "Whether there is a previous item to navigate backwards to",
                          FALSE,
                          G_PARAM_READABLE | G_PARAM_STATIC_STRINGS);

  /**
   * EknHistoryModel:can-go-forward:
   *
   * %TRUE if there are any pages to go forward to.
   * See also #EknHistoryModel:can-go-back.
   */
  ekn_history_model_props[PROP_CAN_GO_FORWARD] =
    g_param_spec_boolean ("can-go-forward", "Can go forward",
                          "Whether there is a next item to navigate forwards to",
                          FALSE,
                          G_PARAM_READABLE | G_PARAM_STATIC_STRINGS);

  /**
   * EknHistoryModel:current-item:
   *
   * The #EknHistoryItemModel for the page currently displaying.
   * Users of this API can listen to changes on this property using
   * #GObject::notify and update their views accordingly.
   *
   * Setting this property navigates to a new page.
   * If the given item model is in the back or forward list (that is, the same
   * object), navigates back or forward until that item is the current item.
   * If the given item model is not in the back or forward list (even if another
   * item model with the same content is!), this sets the given item model to be
   * the current item, moves the old value of the current item to the back list,
   * and clears the forward list.
   *
   * Although %NULL is the initial value as with all object-type properties, it
   * is not valid to set this property to %NULL.
   * It is up to you to determine what a %NULL value for this property means, in
   * terms of user interface.
   */
  ekn_history_model_props[PROP_CURRENT_ITEM] =
    g_param_spec_object ("current-item", "Current item",
                         "The current item that has been navigated to",
                         G_TYPE_OBJECT,
                         G_PARAM_READWRITE | G_PARAM_STATIC_STRINGS);

  /* This doc comment won't show up in the documentation, because Gtk-Doc
  doesn't parse the annotation. Instead you will see the property blurb. See
  bug: https://bugzilla.gnome.org/show_bug.cgi?id=727778 */
  /**
   * EknHistoryModel:back-list: (type GSList(EknHistoryItemModel)):
   *
   * List of #EknHistoryItemModel objects representing pages that can be
   * navigated backwards to.
   *
   * > ## Note ##
   * > This property has a pointer type, but it refers to a #GList with
   * > #EknHistoryItemModel objects in its @data fields.
   */
  ekn_history_model_props[PROP_BACK_LIST] =
    g_param_spec_pointer ("back-list", "Back list",
                          "List of items that can be navigated backwards to",
                          G_PARAM_READABLE | G_PARAM_STATIC_STRINGS);

  /* See comment on :back-list above */
  /**
   * EknHistoryModel:forward-list: (type GSList(EknHistoryItemModel)):
   *
   * List of #EknHistoryItemModel objects representing pages that can be
   * navigated forwards to.
   *
   * > ## Note ##
   * > This property has a pointer type, but it refers to a #GList with
   * > #EknHistoryItemModel objects in its @data fields.
   */
  ekn_history_model_props[PROP_FORWARD_LIST] =
    g_param_spec_pointer ("forward-list", "Forward list",
                          "List of items that can be navigated forwards to",
                          G_PARAM_READABLE | G_PARAM_STATIC_STRINGS);

  g_object_class_install_properties (object_class, NPROPS,
                                     ekn_history_model_props);
}

static void
ekn_history_model_init (EknHistoryModel *self)
{
}

/* Helper function: navigate backwards by n steps, used internally in both
go_back() and set_current_item() */
static void
go_back_n_steps (EknHistoryModel *self,
                 gint             nsteps)
{
  EknHistoryModelPrivate *priv = ekn_history_model_get_instance_private (self);
  gboolean could_go_forward = ekn_history_model_get_can_go_forward (self);

  priv->forward_list = g_slist_prepend (priv->forward_list, priv->current);
  for (; nsteps > 1; nsteps--)
    {
      EknHistoryItemModel *to_move = priv->back_list->data;
      priv->back_list = g_slist_remove_link (priv->back_list, priv->back_list);
      priv->forward_list = g_slist_prepend (priv->forward_list, to_move);
    }
  priv->current = priv->back_list->data;
  priv->back_list = g_slist_remove_link (priv->back_list, priv->back_list);

  if (!ekn_history_model_get_can_go_back (self))
    g_object_notify (G_OBJECT (self), "can-go-back");
  if (!could_go_forward)
    g_object_notify (G_OBJECT (self), "can-go-forward");
  g_object_notify (G_OBJECT (self), "back-list");
  g_object_notify (G_OBJECT (self), "forward-list");
  g_object_notify (G_OBJECT (self), "current-item");
}

/* Helper function: navigate forwards by n steps, used internally in both
go_forward() and set_current_item() */
static void
go_forward_n_steps (EknHistoryModel *self,
                    gint             nsteps)
{
  EknHistoryModelPrivate *priv = ekn_history_model_get_instance_private (self);
  gboolean could_go_back = ekn_history_model_get_can_go_back (self);

  priv->back_list = g_slist_prepend (priv->back_list, priv->current);
  for (; nsteps > 1; nsteps--)
    {
      EknHistoryItemModel *to_move = priv->forward_list->data;
      priv->forward_list = g_slist_remove_link (priv->forward_list,
                                                priv->forward_list);
      priv->back_list = g_slist_prepend (priv->back_list, to_move);
    }
  priv->current = priv->forward_list->data;
  priv->forward_list = g_slist_remove_link (priv->forward_list,
                                            priv->forward_list);

  if (!could_go_back)
    g_object_notify (G_OBJECT (self), "can-go-back");
  if (!ekn_history_model_get_can_go_forward (self))
    g_object_notify (G_OBJECT (self), "can-go-forward");
  g_object_notify (G_OBJECT (self), "back-list");
  g_object_notify (G_OBJECT (self), "forward-list");
  g_object_notify (G_OBJECT (self), "current-item");
}

/* PUBLIC API */

/**
 * ekn_history_model_new:
 *
 * Convenience API for creating a new #EknHistoryModel in C.
 * The new object's state is equal to just having called
 * ekn_history_model_clear() on an existing #EknHistoryModel.
 *
 * Returns: (transfer full): the newly created history model.
 */
EknHistoryModel *
ekn_history_model_new (void)
{
  return g_object_new (EKN_TYPE_HISTORY_MODEL, NULL);
}

/**
 * ekn_history_model_clear:
 * @self: the history model
 *
 * Removes all item models from the history model, and sets the
 * #EknHistoryModel:current-item to %NULL.
 */
void
ekn_history_model_clear (EknHistoryModel *self)
{
  g_return_if_fail (self != NULL && EKN_IS_HISTORY_MODEL (self));

  EknHistoryModelPrivate *priv = ekn_history_model_get_instance_private (self);

  if (priv->current == NULL)
    return;

  gboolean could_go_back = ekn_history_model_get_can_go_back (self);
  gboolean could_go_forward = ekn_history_model_get_can_go_forward (self);

  clear_list (&priv->back_list);
  clear_list (&priv->forward_list);
  g_clear_object (&priv->current);

  if (could_go_back)
    {
      g_object_notify (G_OBJECT (self), "can-go-back");
      g_object_notify (G_OBJECT (self), "back-list");
    }
  if (could_go_forward)
    {
      g_object_notify (G_OBJECT (self), "can-go-forward");
      g_object_notify (G_OBJECT (self), "forward-list");
    }
  g_object_notify (G_OBJECT (self), "current-item");
}

/**
 * ekn_history_model_go_back:
 * @self: the history model
 *
 * Navigates backwards by one step, to the previous page in the history.
 * That is, the most recent item from the #EknHistoryModel:back-list becomes the
 * #EknHistoryModel:current-item, and the #EknHistoryModel:current-item is added
 * to the #EknHistoryModel:forward-list.
 *
 * If no item is available to go back to, this method does nothing.
 *
 * It is an error to call this method if the #EknHistoryModel:current-item
 * is set to %NULL.
 */
void
ekn_history_model_go_back (EknHistoryModel *self)
{
  g_return_if_fail (self != NULL && EKN_IS_HISTORY_MODEL (self));

  EknHistoryModelPrivate *priv = ekn_history_model_get_instance_private (self);

  g_return_if_fail (priv->current != NULL);

  if (!ekn_history_model_get_can_go_back (self))
    return;

  go_back_n_steps (self, 1);
}

/**
 * ekn_history_model_go_forward:
 * @self: the history model
 *
 * Navigates forwards by one step, to the previous page in the history.
 * That is, the earliest item from the #EknHistoryModel:forward-list becomes the
 * #EknHistoryModel:current-item, and the #EknHistoryModel:current-item is added
 * to the #EknHistoryModel:back-list.
 *
 * If no item is available to go forward to, this method does nothing.
 *
 * It is an error to call this method if the #EknHistoryModel:current-item
 * is set to %NULL.
 */
void
ekn_history_model_go_forward (EknHistoryModel *self)
{
  g_return_if_fail (self != NULL && EKN_IS_HISTORY_MODEL (self));

  EknHistoryModelPrivate *priv = ekn_history_model_get_instance_private (self);

  g_return_if_fail (priv->current != NULL);

  if (!ekn_history_model_get_can_go_forward (self))
    return;

  go_forward_n_steps (self, 1);
}

/**
 * ekn_history_model_get_item:
 * @self: the history model
 * @index: index of the item to get; 0 for current, negative for back, or
 * positive for forward.
 *
 * Retrieves a history model item from the history model.
 * The @index is relative to the current item; negative for going backwards, or
 * positive for going forwards.
 *
 * You can set the #EknHistoryModel:current-item property to the item retrieved
 * with this function in order to navigate forwards or backwards by more than
 * one step.
 *
 * Returns: (transfer none): the requested #EknHistoryItemModel.
 * This object is owned by the #EknHistoryModel and should not be freed.
 */
EknHistoryItemModel *
ekn_history_model_get_item (EknHistoryModel *self,
                            gint             index)
{
  g_return_val_if_fail (self != NULL && EKN_IS_HISTORY_MODEL (self), NULL);

  EknHistoryModelPrivate *priv = ekn_history_model_get_instance_private (self);

  /* g_slist_nth_data() returns NULL if the index is off the end of the list, so
  we don't need to check that here */

  if (index == 0)
    return priv->current;
  if (index < 0)
    return g_slist_nth_data (priv->back_list, -index - 1);
  return g_slist_nth_data (priv->forward_list, index - 1);
}

/**
 * ekn_history_model_get_back_list:
 * @self: the history model
 *
 * Retrieves the list of pages that can be navigated backwards to.
 * See #EknHistoryModel:back-list.
 *
 * The list may be empty, which for a #GSList is equivalent to returning %NULL.
 *
 * Returns: (transfer container) (element-type EknHistoryItemModel): a list of
 * #EknHistoryItemModel objects.
 * The item models are owned by #EknHistoryModel.
 * Do not free them.
 */
GSList *
ekn_history_model_get_back_list (EknHistoryModel *self)
{
  g_return_val_if_fail (self != NULL && EKN_IS_HISTORY_MODEL (self), NULL);

  EknHistoryModelPrivate *priv = ekn_history_model_get_instance_private (self);
  return g_slist_copy (priv->back_list);
}

/**
 * ekn_history_model_get_forward_list:
 * @self: the history model
 *
 * Retrieves the list of pages that can be navigated forwards to.
 * See #EknHistoryModel:forward-list.
 *
 * The list may be empty, which for a #GSList is equivalent to returning %NULL.
 *
 * Returns: (transfer container) (element-type EknHistoryItemModel): a list of
 * #EknHistoryItemModel objects.
 * The item models are owned by #EknHistoryModel.
 * Do not free them.
 */
GSList *
ekn_history_model_get_forward_list (EknHistoryModel *self)
{
  g_return_val_if_fail (self != NULL && EKN_IS_HISTORY_MODEL (self), NULL);

  EknHistoryModelPrivate *priv = ekn_history_model_get_instance_private (self);
  return g_slist_copy (priv->forward_list);
}

/**
 * ekn_history_model_get_can_go_back:
 * @self: the history model
 *
 * See #EknHistoryModel:can-go-back.
 *
 * Returns: %TRUE if there are any pages to go back to, %FALSE otherwise.
 */
gboolean
ekn_history_model_get_can_go_back (EknHistoryModel *self)
{
  g_return_val_if_fail (self != NULL && EKN_IS_HISTORY_MODEL (self), FALSE);

  EknHistoryModelPrivate *priv = ekn_history_model_get_instance_private (self);
  return priv->back_list != NULL;
}

/**
 * ekn_history_model_get_can_go_forward:
 * @self: the history model
 *
 * See #EknHistoryModel:can-go-forward.
 *
 * Returns: %TRUE if there are any pages to go forward to, %FALSE otherwise.
 */
gboolean
ekn_history_model_get_can_go_forward (EknHistoryModel *self)
{
  g_return_val_if_fail (self != NULL && EKN_IS_HISTORY_MODEL (self), FALSE);

  EknHistoryModelPrivate *priv = ekn_history_model_get_instance_private (self);
  return priv->forward_list != NULL;
}

/**
 * ekn_history_model_get_current_item:
 * @self: the history model
 *
 * See #EknHistoryModel:current-item.
 *
 * Returns: (allow-none) (transfer none): the #EknHistoryItemModel object
 * representing the page that is currently being viewed, or %NULL if there is
 * none.
 */
EknHistoryItemModel *
ekn_history_model_get_current_item (EknHistoryModel *self)
{
  g_return_val_if_fail (self != NULL && EKN_IS_HISTORY_MODEL (self), NULL);

  EknHistoryModelPrivate *priv = ekn_history_model_get_instance_private (self);
  return priv->current;
}

/**
 * ekn_history_model_set_current_item:
 * @self: the history model
 * @item: an #EknHistoryItemModel object representing a page to navigate to.
 *
 * See #EknHistoryModel:current-item.
 */
void
ekn_history_model_set_current_item (EknHistoryModel     *self,
                                    EknHistoryItemModel *item)
{
  g_return_if_fail (self != NULL && EKN_IS_HISTORY_MODEL (self));
  g_return_if_fail (item != NULL && EKN_IS_HISTORY_ITEM_MODEL (item));

  EknHistoryModelPrivate *priv = ekn_history_model_get_instance_private (self);

  if (item == priv->current)
    return;

  gboolean could_go_back = ekn_history_model_get_can_go_back (self);
  gboolean could_go_forward = ekn_history_model_get_can_go_forward (self);
  gint index;

  /* If the item model is already in the back list, jump backwards */
  if (could_go_back && (index = g_slist_index (priv->back_list, item)) != -1)
    {
      go_back_n_steps (self, index + 1);
      return;
    }

  /* If the item model is already in the forward list, jump forwards */
  if (could_go_forward
      && (index = g_slist_index (priv->forward_list, item)) != -1)
    {
      go_forward_n_steps (self, index + 1);
      return;
    }

  /* It's a new item model, so navigate to it and clear the forward list */
  if (priv->current != NULL)
    {
      priv->back_list = g_slist_prepend (priv->back_list, priv->current);
      if (!could_go_back)
        g_object_notify (G_OBJECT (self), "can-go-back");
      g_object_notify (G_OBJECT (self), "back-list");
    }
  priv->current = g_object_ref (item);

  clear_list (&priv->forward_list);
  if (could_go_forward)
    {
      g_object_notify (G_OBJECT (self), "can-go-forward");
      g_object_notify (G_OBJECT (self), "forward-list");
    }

  g_object_notify (G_OBJECT (self), "current-item");
}
