/* -*- mode: C; c-file-style: "gnu"; indent-tabs-mode: nil; -*- */

/* Copyright 2015 Endless Mobile, Inc. */

#ifndef EKNS_SUBTREE_DISPATCHER_H
#define EKNS_SUBTREE_DISPATCHER_H

#include <gio/gio.h>

#define EKNS_TYPE_SUBTREE_DISPATCHER               (ekns_subtree_dispatcher_get_type ())
#define EKNS_SUBTREE_DISPATCHER(obj)                               (G_TYPE_CHECK_INSTANCE_CAST ((obj), EKNS_TYPE_SUBTREE_DISPATCHER, EknsSubtreeDispatcher))
#define EKNS_SUBTREE_DISPATCHER_CLASS(klass)                       (G_TYPE_CHECK_CLASS_CAST ((klass),  EKNS_TYPE_SUBTREE_DISPATCHER, EknsSubtreeDispatcherClass))
#define EKNS_IS_SUBTREE_DISPATCHER(obj)         (G_TYPE_CHECK_INSTANCE_TYPE ((obj), EKNS_TYPE_SUBTREE_DISPATCHER))
#define EKNS_IS_SUBTREE_DISPATCHER_CLASS(klass) (G_TYPE_CHECK_CLASS_TYPE ((klass),  EKNS_TYPE_SUBTREE_DISPATCHER))
#define EKNS_SUBTREE_DISPATCHER_GET_CLASS(obj)                     (G_TYPE_INSTANCE_GET_CLASS ((obj),  EKNS_TYPE_SUBTREE_DISPATCHER, EknsSubtreeDispatcherClass))

typedef struct _EknsSubtreeDispatcher        EknsSubtreeDispatcher;
typedef struct _EknsSubtreeDispatcherClass   EknsSubtreeDispatcherClass;

struct _EknsSubtreeDispatcher
{
  GObject parent;
};

struct _EknsSubtreeDispatcherClass
{
  GObjectClass parent_class;
};

GType ekns_subtree_dispatcher_get_type (void) G_GNUC_CONST;

void ekns_subtree_dispatcher_register (EknsSubtreeDispatcher *dispatcher,
                                       GDBusConnection        *connection,
                                       const char             *subtree_path);

void ekns_subtree_dispatcher_unregister (EknsSubtreeDispatcher *dispatcher);

#endif /* EKNS_SUBTREE_DISPATCHER_H */
