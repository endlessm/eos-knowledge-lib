/* Copyright 2016 Endless Mobile, Inc. */

#pragma once

#include <glib-object.h>

G_BEGIN_DECLS

#define EKNC_TYPE_QUERY_OBJECT eknc_query_object_get_type ()
G_DECLARE_FINAL_TYPE (EkncQueryObject, eknc_query_object, EKNC, QUERY_OBJECT, GObject)

/**
 * EkncQueryObjectMode:
 * @EKNC_QUERY_OBJECT_MODE_INCREMENTAL: Queries will match partially typed words.
 *   For example a query for 'dragonba' will match the Dragonball article.
 * @EKNC_QUERY_OBJECT_MODE_DELIMITED: Queries will be assumed to be entire words.
 *
 * Enumeration for different query modes.
 */
typedef enum {
  EKNC_QUERY_OBJECT_MODE_INCREMENTAL,
  EKNC_QUERY_OBJECT_MODE_DELIMITED,
} EkncQueryObjectMode;

/**
 * EkncQueryObjectMatch:
 * @EKNC_QUERY_OBJECT_MATCH_ONLY_TITLE: Only article titles will match against
 *   the query string.
 * @EKNC_QUERY_OBJECT_MATCH_TITLE_SYNOPSIS: Article titles and synopsis will
 *   match the query string.
 *
 * Enumeration of what to match in the source document.
 */
typedef enum {
  EKNC_QUERY_OBJECT_MATCH_ONLY_TITLE,
  EKNC_QUERY_OBJECT_MATCH_TITLE_SYNOPSIS,
} EkncQueryObjectMatch;

/**
 * EkncQueryObjectSort:
 * @EKNC_QUERY_OBJECT_SORT_RELEVANCE: Use xapian relevance ranking to sort
 *   articles. Exact title matches will be weighted most heavily.
 * @EKNC_QUERY_OBJECT_SORT_SEQUENCE_NUMBER: Uses the article page rank to sort
 *   results.
 * @EKNC_QUERY_OBJECT_SORT_DATE: Uses the article date to sort the results.
 *
 * Enumeration for different ways to sort query results.
 */
typedef enum {
  EKNC_QUERY_OBJECT_SORT_RELEVANCE,
  EKNC_QUERY_OBJECT_SORT_SEQUENCE_NUMBER,
  EKNC_QUERY_OBJECT_SORT_DATE,
} EkncQueryObjectSort;

/**
 * EkncQueryObjectOrder:
 * @EKNC_QUERY_OBJECT_ORDER_ASCENDING: Return articles in ascending order.
 * @EKNC_QUERY_OBJECT_ORDER_DESCENDING: Return articles in descending order.
 *
 * Enumeration for different ways to order sorted query (e.g. ascending).
 */
typedef enum {
  EKNC_QUERY_OBJECT_ORDER_ASCENDING,
  EKNC_QUERY_OBJECT_ORDER_DESCENDING,
} EkncQueryObjectOrder;

GVariant *
eknc_query_object_get_tags_match_all (EkncQueryObject *self);

GVariant *
eknc_query_object_get_tags_match_any (EkncQueryObject *self);

GVariant *
eknc_query_object_get_ids (EkncQueryObject *self);

GVariant *
eknc_query_object_get_excluded_ids (EkncQueryObject *self);

GVariant *
eknc_query_object_get_excluded_tags (EkncQueryObject *self);

const char *
eknc_query_object_get_query (EkncQueryObject *self);

char *
eknc_query_object_get_query_string (EkncQueryObject *self);

char *
eknc_query_object_get_corrected_query_string (EkncQueryObject *self);

char *
eknc_query_object_get_filter_string (EkncQueryObject *self);

char *
eknc_query_object_get_filter_out_string (EkncQueryObject *self);

const gchar *
eknc_query_object_get_query_parser_strings (EkncQueryObject *self,
                                            const gchar **filter,
                                            const gchar **filterout);

guint
eknc_query_object_get_cutoff (EkncQueryObject *self);

gint
eknc_query_object_get_sort_value (EkncQueryObject *self);

gboolean
eknc_query_object_is_match_all (EkncQueryObject *self);

EkncQueryObject *
eknc_query_object_new_from_object (EkncQueryObject *source,
                                   const gchar     *first_property_name,
                                   ...);

G_END_DECLS
