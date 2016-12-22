/* Copyright 2016 Endless Mobile, Inc. */

#include "eknc-query-results.h"
#include "eknc-content-object-model.h"

/**
 * SECTION:query-results
 * @title: Query Results
 * @short_description: Results and metadata from Xapian
 *
 * The #QueryResults class is returned from search operations.
 * It provides a list of search results, as well as metadata about the search,
 * such as the number of total search results.
 *
 * This class has no functionality, but is just a bag of properties.
 * Instances are immutable after creation and all properties must be passed in
 * on construction.
 *
 * You are not intended to create instances of this class; it is returned as
 * a result of search operations.
 */
struct _EkncQueryResults
{
  GObject parent_instance;

  GSList *models;
  gint upper_bound;  /* One would think guint, but Xapian::doccount == int */
};

G_DEFINE_TYPE (EkncQueryResults, eknc_query_results, G_TYPE_OBJECT)

enum {
  PROP_0,
  PROP_MODELS,
  PROP_UPPER_BOUND,
  NPROPS
};

static GParamSpec *eknc_query_results_props[NPROPS] = { NULL, };


static void
eknc_query_results_get_property (GObject    *object,
                                 guint       prop_id,
                                 GValue     *value,
                                 GParamSpec *pspec)
{
  EkncQueryResults *self = EKNC_QUERY_RESULTS (object);

  switch (prop_id)
    {
    case PROP_MODELS:
      g_value_set_pointer (value, self->models);
      break;

    case PROP_UPPER_BOUND:
      g_value_set_int (value, self->upper_bound);
      break;

    default:
      G_OBJECT_WARN_INVALID_PROPERTY_ID (object, prop_id, pspec);
    }
}


static void
eknc_query_results_set_property (GObject      *object,
                                 guint         prop_id,
                                 const GValue *value,
                                 GParamSpec   *pspec)
{
  EkncQueryResults *self = EKNC_QUERY_RESULTS (object);

  switch (prop_id)
    {
    case PROP_MODELS:
      g_assert(self->models == NULL);
      self->models = g_slist_copy_deep (g_value_get_pointer (value),
                                        (GCopyFunc) g_object_ref, NULL);
      break;

    case PROP_UPPER_BOUND:
      self->upper_bound = g_value_get_int (value);
      break;

    default:
      G_OBJECT_WARN_INVALID_PROPERTY_ID (object, prop_id, pspec);
    }
}

static void
eknc_query_results_finalize (GObject *object)
{
  EkncQueryResults *self = EKNC_QUERY_RESULTS (object);

  g_slist_free_full (self->models, g_object_unref);
}


static void
eknc_query_results_class_init (EkncQueryResultsClass *klass)
{
  GObjectClass *object_class = G_OBJECT_CLASS (klass);

  object_class->get_property = eknc_query_results_get_property;
  object_class->set_property = eknc_query_results_set_property;
  object_class->finalize = eknc_query_results_finalize;

  /**
   * EkncQueryResults:models: (type GSList(EkncContentObjectModel))
   *
   * A list of the content object models making up the batch of search results
   * returned from a search operation.
   */
  eknc_query_results_props[PROP_MODELS] =
    g_param_spec_pointer ("models", "Models",
      "Batch of content object models in search results",
      G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);

  /**
   * EkncQueryObject:upper-bound:
   *
   * An upper bound on the total number of results for the query.
   * (This is often different from the number of results in
   * #EkncQueryObject:results, since the results can be paginated.)
   */
  eknc_query_results_props[PROP_UPPER_BOUND] =
    g_param_spec_int ("upper-bound", "Upper bound",
      "Upper bound on total number of results",
      G_MININT, G_MAXINT, 0,
      G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY | G_PARAM_STATIC_STRINGS);

  g_object_class_install_properties (object_class, NPROPS,
                                     eknc_query_results_props);
}

static void
eknc_query_results_init (EkncQueryResults *self)
{
}

/**
 * eknc_query_results_get_models:
 * @self: the #EkncQueryResults
 *
 * See #EkncQueryResults:models.
 *
 * Returns: (element-type EkncContentObjectModel) (transfer none): list of models
 */
GSList *
eknc_query_results_get_models (EkncQueryResults *self)
{
  g_return_val_if_fail (EKNC_IS_QUERY_RESULTS (self), NULL);
  return self->models;
}

/**
 * eknc_query_results_get_upper_bound:
 * @self: the #EkncQueryResults
 *
 * See #EkncQueryResults:upper-bound.
 *
 * Returns: the upper bound on the number of results
 */
gint
eknc_query_results_get_upper_bound (EkncQueryResults *self)
{
  g_return_val_if_fail (EKNC_IS_QUERY_RESULTS (self), 0);
  return self->upper_bound;
}

/**
 * eknc_query_results_new_for_testing:
 * @models: (element-type EkncContentObjectModel) (transfer none):
 *
 * For testing within eos-knowledge-content only.
 *
 * Returns: (transfer full):
 */
EkncQueryResults *
eknc_query_results_new_for_testing (GSList *models)
{
  return EKNC_QUERY_RESULTS (g_object_new (EKNC_TYPE_QUERY_RESULTS,
                                           "upper-bound", 42,
                                           "models", models,
                                           NULL));

}
