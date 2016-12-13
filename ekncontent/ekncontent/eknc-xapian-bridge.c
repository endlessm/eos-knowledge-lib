/* Copyright 2016 Endless Mobile, Inc. */

#include "eknc-xapian-bridge.h"

/**
 * SECTION:xapian-bridge
 * @title: Xapian Bridge
 * @short_description: Communicate with the xapian http server
 *
 * The Xapian Bridge class allows you to make queries to the xapian http server
 * using #QueryObject and get a json response back.
 */
struct _EkncXapianBridge
{
  GObject parent_instance;

  gchar *host;
  guint port;
  gchar *language;
};

G_DEFINE_TYPE (EkncXapianBridge,
               eknc_xapian_bridge,
               G_TYPE_OBJECT)

enum {
  PROP_0,
  PROP_HOST,
  PROP_PORT,
  PROP_LANGUAGE,
  NPROPS
};

static GParamSpec *eknc_xapian_bridge_props [NPROPS] = { NULL, };

static void
eknc_xapian_bridge_get_property (GObject    *object,
                                guint       prop_id,
                                GValue     *value,
                                GParamSpec *pspec)
{
  EkncXapianBridge *self = EKNC_XAPIAN_BRIDGE (object);

  switch (prop_id)
    {
    case PROP_HOST:
      g_value_set_string (value, self->host);
      break;

    case PROP_PORT:
      g_value_set_uint (value, self->port);
      break;

    case PROP_LANGUAGE:
      g_value_set_string (value, self->language);
      break;

    default:
      G_OBJECT_WARN_INVALID_PROPERTY_ID (object, prop_id, pspec);
    }
}

static void
eknc_xapian_bridge_set_property (GObject *object,
                                        guint prop_id,
                                        const GValue *value,
                                        GParamSpec *pspec)
{
  EkncXapianBridge *self = EKNC_XAPIAN_BRIDGE (object);

  switch (prop_id)
    {
    case PROP_HOST:
      g_clear_pointer (&self->host, g_free);
      self->host = g_value_dup_string (value);
      break;

    case PROP_PORT:
      self->port = g_value_get_uint (value);
      break;

    case PROP_LANGUAGE:
      g_clear_pointer (&self->language, g_free);
      self->language = g_value_dup_string (value);
      break;

    default:
      G_OBJECT_WARN_INVALID_PROPERTY_ID (object, prop_id, pspec);
    }
}

static void
eknc_xapian_bridge_finalize (GObject *object)
{
  EkncXapianBridge *self = EKNC_XAPIAN_BRIDGE (object);

  g_clear_pointer (&self->host, g_free);
  g_clear_pointer (&self->language, g_free);
}

static void
eknc_xapian_bridge_class_init (EkncXapianBridgeClass *klass)
{
  GObjectClass *object_class = G_OBJECT_CLASS (klass);

  object_class->get_property = eknc_xapian_bridge_get_property;
  object_class->set_property = eknc_xapian_bridge_set_property;
  object_class->finalize = eknc_xapian_bridge_finalize;

  /**
   * EkncXapianBridge:host:
   *
   * The hostname of the xapian bridge. You generally don't
   * need to set this.
   */
  // FIXME: the default should just be localhost, but libsoup has a bug
  // whereby it does not resolve localhost when it is offline:
  // https://bugzilla.gnome.org/show_bug.cgi?id=692291
  // Once this bug is fixed, we should change this to be localhost.
  eknc_xapian_bridge_props[PROP_HOST] =
    g_param_spec_string ("host", "Hostname",
      "HTTP hostname for the xapian bridge service",
      "127.0.0.1", G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);

  /**
   * EkncXapianBridge:port:
   *
   * The port of the xapian bridge. You generally don't need
   * to set this.
   */
  eknc_xapian_bridge_props[PROP_PORT] =
    g_param_spec_uint ("port", "Port",
      "The port of the xapian bridge service",
      0, 65535, 3004, G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);

  /**
   * EkncXapianBridge:language:
   *
   * The ISO639 language code which will be used for various search
   * features, such as term stemming and spelling correction.
   */
  eknc_xapian_bridge_props[PROP_LANGUAGE] =
    g_param_spec_string ("language", "Language",
      "ISO639 locale code to be used in search",
      "127.0.0.1", G_PARAM_READWRITE | G_PARAM_CONSTRUCT | G_PARAM_STATIC_STRINGS);

  g_object_class_install_properties (object_class,
                                     NPROPS,
                                     eknc_xapian_bridge_props);
}

static void
eknc_xapian_bridge_init (EkncXapianBridge *self)
{
}
