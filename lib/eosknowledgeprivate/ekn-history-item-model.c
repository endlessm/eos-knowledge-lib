/* -*- mode: C; c-file-style: "gnu"; indent-tabs-mode: nil; -*- */

/* Copyright (C) 2014-2016 Endless Mobile, Inc. */

#include "config.h"
#include "ekn-history-item-model.h"

#include <glib.h>

/**
 * SECTION:history-item-model
 * @short_description: Interface for items stored in a history control
 * @title: History item model
 * @include: eosknowledge/eosknowledge.h
 *
 * Use #EknHistoryModel to store previously visited pages, in a browser-type
 * situation.
 * Each page is represented by an object that must implement the
 * #EknHistoryItemModel interface, and can add methods and properties of its
 * own.
 *
 * The following is an example history item model that also adds a timestamp
 * representing when the page was last visited:
 *
 * |[
 * const MyBrowserHistoryItemModel = new Lang.Class({
 *     Name: 'MyBrowserHistoryItemModel',
 *     Extends: GObject.Object,
 *     Implements: [ EosKnowledge.HistoryItemModel ],
 *     Properties: {
 *         'title': GObject.ParamSpec.override('title',
 *              EosKnowledge.HistoryItemModel),
 *         'last-visited': GObject.ParamSpec.int64('last-visited', 'Last visited',
 *             'Time last visited',
 *              GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE,
 *              -1, GLib.MAXINT64, -1)
 *     }
 * });
 * ]|
 */

G_DEFINE_INTERFACE (EknHistoryItemModel, ekn_history_item_model, G_TYPE_INVALID);

static void
ekn_history_item_model_default_init (EknHistoryItemModelInterface *iface)
{
  /**
   * EknHistoryItemModel:title:
   *
   * A human-readable name for the document that this history item represents.
   * It will be displayed in the GUI, for example in a menu or a breadcrumb
   * control.
   */
  g_object_interface_install_property (iface,
                                       g_param_spec_string ("title", "Title",
                                                            "Display title of the history item model",
                                                            "",
                                                            G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS));
}

/**
 * ekn_history_item_model_get_title:
 * @self: the history item model
 *
 * Retrieves this item's display title. For more information, see
 * #EknHistoryItemModel:title.
 *
 * Returns: the display title as a string.
 * Free with g_free() when done.
 */
gchar *
ekn_history_item_model_get_title (EknHistoryItemModel *self)
{
  g_return_val_if_fail (EKN_IS_HISTORY_ITEM_MODEL (self), NULL);

  gchar *retval;

  g_object_get (self,
                "title", &retval,
                NULL);
  return retval;
}
