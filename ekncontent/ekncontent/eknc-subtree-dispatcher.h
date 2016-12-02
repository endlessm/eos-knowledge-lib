/* -*- mode: C; c-file-style: "gnu"; indent-tabs-mode: nil; -*- */

/* Copyright 2015 Endless Mobile, Inc. */

#pragma once

#include <gio/gio.h>

G_BEGIN_DECLS

#define EKNC_TYPE_SUBTREE_DISPATCHER eknc_subtree_dispatcher_get_type ()
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

G_END_DECLS
