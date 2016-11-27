/* -*- mode: C; c-file-style: "gnu"; indent-tabs-mode: nil; -*- */

/* Copyright 2015 Endless Mobile, Inc. */

#ifndef EKNC_SUBTREE_DISPATCHER_H
#define EKNC_SUBTREE_DISPATCHER_H

#include <gio/gio.h>

#define EKNC_TYPE_SUBTREE_DISPATCHER               (eknc_subtree_dispatcher_get_type ())
#define EKNC_SUBTREE_DISPATCHER(obj)                               (G_TYPE_CHECK_INSTANCE_CAST ((obj), EKNC_TYPE_SUBTREE_DISPATCHER, EkncSubtreeDispatcher))
#define EKNC_SUBTREE_DISPATCHER_CLASS(klass)                       (G_TYPE_CHECK_CLASS_CAST ((klass),  EKNC_TYPE_SUBTREE_DISPATCHER, EkncSubtreeDispatcherClass))
#define EKNC_IS_SUBTREE_DISPATCHER(obj)         (G_TYPE_CHECK_INSTANCE_TYPE ((obj), EKNC_TYPE_SUBTREE_DISPATCHER))
#define EKNC_IS_SUBTREE_DISPATCHER_CLASS(klass) (G_TYPE_CHECK_CLASS_TYPE ((klass),  EKNC_TYPE_SUBTREE_DISPATCHER))
#define EKNC_SUBTREE_DISPATCHER_GET_CLASS(obj)                     (G_TYPE_INSTANCE_GET_CLASS ((obj),  EKNC_TYPE_SUBTREE_DISPATCHER, EkncSubtreeDispatcherClass))

typedef struct _EkncSubtreeDispatcher        EkncSubtreeDispatcher;
typedef struct _EkncSubtreeDispatcherClass   EkncSubtreeDispatcherClass;

struct _EkncSubtreeDispatcher
{
  GObject parent;
};

struct _EkncSubtreeDispatcherClass
{
  GObjectClass parent_class;
};

GType eknc_subtree_dispatcher_get_type (void) G_GNUC_CONST;

void eknc_subtree_dispatcher_register (EkncSubtreeDispatcher *dispatcher,
                                       GDBusConnection        *connection,
                                       const char             *subtree_path);

void eknc_subtree_dispatcher_unregister (EkncSubtreeDispatcher *dispatcher);

#endif /* EKNC_SUBTREE_DISPATCHER_H */
