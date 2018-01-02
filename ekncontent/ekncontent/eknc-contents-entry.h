/* Copyright 2018 Endless Mobile, Inc. */

#pragma once

#include <glib-object.h>
#include <json-glib/json-glib.h>

G_BEGIN_DECLS

#define EKNC_TYPE_CONTENTS eknc_contents_get_type ()
G_DECLARE_BOXED_TYPE (EkncContents, eknc_contents, EKNC, CONTENTS, GObject)

struct _EkncContentsClass
{
  GObjectClass parent_class;

  gpointer padding[8];
};

EkncContents *eknc_contents_new_from_json_node (JsonNode *node);

size_t eknc_contents_get_index (EkncContents *self, size_t entry);
const char *eknc_contents_get_index_label (EkncContents *self, size_t entry);
const char *eknc_contents_get_label (EkncContents *self, size_t entry);
const char *eknc_contents_get_content (EkncContents *self, size_t entry);

G_END_DECLS
