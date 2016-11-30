/* -*- mode: C; c-file-style: "gnu"; indent-tabs-mode: nil; -*- */

/* Copyright 2015 Endless Mobile, Inc. */

#ifndef EKNC_SUBTREE_DISPATCHER_H
#define EKNC_SUBTREE_DISPATCHER_H

#include <gio/gio.h>

#define EKNC_TYPE_SUBTREE_DISPATCHER my_app_window_get_type ()
G_DECLARE_FINAL_TYPE(EkncSubtreeDispatcher, eknc_subtree_dispatcher, EKNC, SUBTREE_DISPATCHER, GObject)

/**
 * EkncSubtreeDispatcher:
 *
 * This class structure contains no public members.
 */
struct _EkncSubtreeDispatcher
{
  GObject parent;
};

struct _EkncSubtreeDispatcherClass
{
  GObjectClass parent_class;
};

void eknc_subtree_dispatcher_register (EkncSubtreeDispatcher *self,
                                       GDBusConnection        *connection,
                                       const char             *subtree_path);

void eknc_subtree_dispatcher_unregister (EkncSubtreeDispatcher *self);

#endif /* EKNC_SUBTREE_DISPATCHER_H */
