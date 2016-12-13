/* Copyright 2016 Endless Mobile, Inc. */

#pragma once

#include <glib-object.h>

G_BEGIN_DECLS

#define EKNC_TYPE_XAPIAN_BRIDGE eknc_xapian_bridge_get_type ()
G_DECLARE_FINAL_TYPE (EkncXapianBridge, eknc_xapian_bridge, EKNC, XAPIAN_BRIDGE, GObject)

G_END_DECLS
