/* Copyright 2016 Endless Mobile, Inc. */

#pragma once

#include "eknc-content-object-model.h"

#include <gio/gio.h>
#include <json-glib/json-glib.h>

G_BEGIN_DECLS

#define EKNC_TYPE_ARTICLE_OBJECT_MODEL eknc_article_object_model_get_type ()
G_DECLARE_DERIVABLE_TYPE (EkncArticleObjectModel, eknc_article_object_model, EKNC, ARTICLE_OBJECT_MODEL, EkncContentObjectModel)

struct _EkncArticleObjectModelClass
{
  EkncContentObjectModelClass parent_class;

  gpointer padding[8];
};

GVariant *
eknc_article_object_model_get_authors (EkncArticleObjectModel *self);

GVariant *
eknc_article_object_model_get_temporal_coverage (EkncArticleObjectModel *self);

GVariant *
eknc_article_object_model_get_outgoing_links (EkncArticleObjectModel *self);

GVariant *
eknc_article_object_model_get_table_of_contents (EkncArticleObjectModel *self);

EkncContentObjectModel *
eknc_article_object_model_new_from_json_node (JsonNode *node);

G_END_DECLS
