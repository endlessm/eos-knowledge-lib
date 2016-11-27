/* -*- mode: C; c-file-style: "gnu"; indent-tabs-mode: nil; -*- */

/* Copyright 2015 Endless Mobile, Inc. */

#include "eknc-subtree-dispatcher.h"

/**
 * SECTION:subtree-dispatcher
 * @title: Subtree Dispatcher
 * @short_description: Endless Knowledge Content Subtree Dispatcher
 *
 * The #EkncSubtreeDispatcher is for use with the knowledge content global
 * search provider in eos-knowledge-serivces.
 */

struct _EkncSubtreeDispatcherPrivate
{
  GDBusConnection *connection;
  guint registration_id;

  GDBusInterfaceInfo *interface_info;
};
typedef struct _EkncSubtreeDispatcherPrivate EkncSubtreeDispatcherPrivate;

enum {
  PROP_0,
  PROP_INTERFACE_INFO,
  NUM_PROPS,
};
static GParamSpec *obj_props[NUM_PROPS];

enum {
  DISPATCH_SUBTREE,
  NUM_SIGNALS,
};
static guint signals[NUM_SIGNALS];

G_DEFINE_TYPE_WITH_PRIVATE (EkncSubtreeDispatcher, eknc_subtree_dispatcher, G_TYPE_OBJECT);

static void
eknc_subtree_dispatcher_get_property (GObject    *object,
                                        guint       prop_id,
                                        GValue     *value,
                                        GParamSpec *pspec)
{
  EkncSubtreeDispatcher *dispatcher = EKNC_SUBTREE_DISPATCHER (object);
  EkncSubtreeDispatcherPrivate *priv = eknc_subtree_dispatcher_get_instance_private (dispatcher);

  switch (prop_id)
    {
    case PROP_INTERFACE_INFO:
      g_value_set_boxed (value, priv->interface_info);
      break;

    default:
      G_OBJECT_WARN_INVALID_PROPERTY_ID (object, prop_id, pspec);
    }
}

static void
eknc_subtree_dispatcher_set_property (GObject      *object,
                                        guint         prop_id,
                                        const GValue *value,
                                        GParamSpec   *pspec)
{
  EkncSubtreeDispatcher *dispatcher = EKNC_SUBTREE_DISPATCHER (object);
  EkncSubtreeDispatcherPrivate *priv = eknc_subtree_dispatcher_get_instance_private (dispatcher);

  switch (prop_id)
    {
    case PROP_INTERFACE_INFO:
      priv->interface_info = g_value_dup_boxed (value);
      break;

    default:
      G_OBJECT_WARN_INVALID_PROPERTY_ID (object, prop_id, pspec);
    }
}

static void
eknc_subtree_dispatcher_dispose (GObject *object)
{
  EkncSubtreeDispatcher *dispatcher = EKNC_SUBTREE_DISPATCHER (object);
  EkncSubtreeDispatcherPrivate *priv = eknc_subtree_dispatcher_get_instance_private (dispatcher);

  G_OBJECT_CLASS (eknc_subtree_dispatcher_parent_class)->dispose (object);

  g_clear_pointer (&priv->interface_info, g_dbus_interface_info_unref);

  if (priv->registration_id > 0)
    {
      eknc_subtree_dispatcher_unregister (dispatcher);
      g_warning ("EkncSubtreeDispatcher was disposed while it was registered");
    }
}

static void
eknc_subtree_dispatcher_class_init (EkncSubtreeDispatcherClass *klass)
{
  GObjectClass *object_class = G_OBJECT_CLASS (klass);

  object_class->dispose = eknc_subtree_dispatcher_dispose;
  object_class->get_property = eknc_subtree_dispatcher_get_property;
  object_class->set_property = eknc_subtree_dispatcher_set_property;

  /**
   * EkncSubtreeDispatcher:interface-info:
   *
   * A #GDBusInterfaceInfo containing the interface of all the children
   * subobjects of this tree.
   */
  obj_props[PROP_INTERFACE_INFO] = g_param_spec_boxed ("interface-info",
                                                       "Interface Info",
                                                       "The interface info of the children subobjects",
                                                       G_TYPE_DBUS_INTERFACE_INFO,
                                                       G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);
  g_object_class_install_properties (object_class, NUM_PROPS, obj_props);

  /**
   * EkncSubtreeDispatcher::dispatch-subtree:
   * @dispatcher: the dispatcher
   * @object_path: The object path to dispatch for.
   *
   * The dispatch-subtree signal.
   *
   * Returns: (transfer none): A #GDBusInterfaceSkeleton that implements
   * the object you want.
   */
  signals[DISPATCH_SUBTREE] = g_signal_new ("dispatch-subtree",
                                            G_TYPE_FROM_CLASS (klass),
                                            G_SIGNAL_RUN_LAST,
                                            0,
                                            g_signal_accumulator_first_wins, NULL, NULL,
                                            G_TYPE_DBUS_INTERFACE_SKELETON,
                                            1, G_TYPE_STRING);
}

static void
eknc_subtree_dispatcher_init (EkncSubtreeDispatcher *dispatcher)
{
}

/* It doesn't matter what we pass back for children,
 * since DISPATCH_TO_UNENUMERATED_NODES will save us */
static char **
subtree_enumerate (GDBusConnection *connection,
                   const char      *sender,
                   const char      *object_path,
                   gpointer         user_data)
{
  return NULL;
}

static GDBusInterfaceInfo **
subtree_introspect (GDBusConnection *connection,
                    const char      *sender,
                    const char      *object_path,
                    const char      *node,
                    gpointer         user_data)
{
  EkncSubtreeDispatcher *dispatcher = EKNC_SUBTREE_DISPATCHER (user_data);
  EkncSubtreeDispatcherPrivate *priv = eknc_subtree_dispatcher_get_instance_private (dispatcher);

  /* Root has no interfaces. */
  if (node == NULL)
    return NULL;

  GPtrArray *ptr_array = g_ptr_array_new ();
  g_ptr_array_add (ptr_array, g_dbus_interface_info_ref (priv->interface_info));
  g_ptr_array_add (ptr_array, NULL);
  return (GDBusInterfaceInfo **) g_ptr_array_free (ptr_array, FALSE);
}

static const GDBusInterfaceVTable *
subtree_dispatch (GDBusConnection *connection,
                  const gchar     *sender,
                  const gchar     *object_path,
                  const gchar     *interface_name,
                  const gchar     *node,
                  gpointer        *out_user_data,
                  gpointer         user_data)
{
  EkncSubtreeDispatcher *dispatcher = EKNC_SUBTREE_DISPATCHER (user_data);
  GDBusInterfaceSkeleton *skeleton;

  g_signal_emit (dispatcher, signals[DISPATCH_SUBTREE], 0, node, &skeleton);

  if (!G_IS_DBUS_INTERFACE_SKELETON (skeleton))
    {
      g_warning ("Did not get skeleton for node %s", node);
      return NULL;
    }

  *out_user_data = skeleton;
  /* XXX: How do we get the hooked vtable? */
  return g_dbus_interface_skeleton_get_vtable (skeleton);
}

const GDBusSubtreeVTable subtree_vtable = {
  .enumerate  = subtree_enumerate,
  .introspect = subtree_introspect,
  .dispatch   = subtree_dispatch,
};

/**
 * eknc_subtree_dispatcher_register:
 * @dispatcher: the subtree dispatcher
 * @connection: the dbus connection
 * @subtree_path: a subtree path to register with
 *
 * Register the dispatcher.
 */
void
eknc_subtree_dispatcher_register (EkncSubtreeDispatcher *dispatcher,
                                  GDBusConnection       *connection,
                                  const char            *subtree_path)
{
  EkncSubtreeDispatcherPrivate *priv = eknc_subtree_dispatcher_get_instance_private (dispatcher);

  if (priv->registration_id == 0)
    {
      GError *error = NULL;

      priv->registration_id = g_dbus_connection_register_subtree (connection, subtree_path, &subtree_vtable,
                                                                  G_DBUS_SUBTREE_FLAGS_DISPATCH_TO_UNENUMERATED_NODES,
                                                                  dispatcher, NULL, &error);
      if (error != NULL)
        {
          g_warning ("Eknc failed to register subtree: %s\n", error->message);
          g_error_free (error);
          return;
        }

      priv->connection = g_object_ref (connection);
    }
}

/**
 * eknc_subtree_dispatcher_unregister:
 * @dispatcher: the subtree dispatcher
 *
 * Unregister the dispatcher.
 */
void
eknc_subtree_dispatcher_unregister (EkncSubtreeDispatcher *dispatcher)
{
  EkncSubtreeDispatcherPrivate *priv = eknc_subtree_dispatcher_get_instance_private (dispatcher);

  if (priv->registration_id > 0)
    {
      g_dbus_connection_unregister_subtree (priv->connection, priv->registration_id);
      priv->registration_id = 0;

      g_clear_object (&priv->connection);
    }
}
