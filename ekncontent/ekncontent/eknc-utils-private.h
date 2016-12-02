/* Copyright 2016 Endless Mobile, Inc. */

#pragma once

#include <gio/gio.h>
#include <json-glib/json-glib.h>

G_BEGIN_DECLS

void
eknc_utils_append_gparam_from_json_node (JsonNode *node,
                                         GParamSpec *pspec,
                                         GArray *params);

void
eknc_utils_free_gparam_array (GArray *params);

G_END_DECLS
