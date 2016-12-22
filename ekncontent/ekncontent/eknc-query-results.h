/* Copyright 2016 Endless Mobile, Inc. */

#pragma once

#include <glib-object.h>

G_BEGIN_DECLS

#define EKNC_TYPE_QUERY_RESULTS eknc_query_results_get_type ()
G_DECLARE_FINAL_TYPE (EkncQueryResults, eknc_query_results, EKNC, QUERY_RESULTS, GObject)

GSList *
eknc_query_results_get_models (EkncQueryResults *self);

gint
eknc_query_results_get_upper_bound (EkncQueryResults *self);

EkncQueryResults *
eknc_query_results_new_for_testing (GSList *models);

G_END_DECLS
