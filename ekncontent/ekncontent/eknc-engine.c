/* Copyright 2016 Endless Mobile, Inc. */

#include "eknc-engine.h"

#include "eknc-domain.h"
#include "eknc-domain-private.h"
#include "eknc-xapian-bridge.h"
#include "eknc-utils.h"

/**
 * SECTION:engine
 * @title: Engine
 * @short_description: Grab content for a specific application
 *
 * The knowledge content engine is the main portal for query and fetching
 * content for knowledge applications. Usually you will be using this to fetch
 * content for a single application, in which case you should set the
 * #EkncEngine:default-app-id property.
 */
struct _EkncEngine
{
  GObject parent_instance;

  gchar *default_app_id;
  gchar *language;
  EkncXapianBridge *xapian_bridge;
  // Hash table with app id string keys, EkncDomain values
  GHashTable *domains;
};

G_DEFINE_TYPE (EkncEngine,
               eknc_engine,
               G_TYPE_OBJECT)

enum {
  PROP_0,
  PROP_DEFAULT_APP_ID,
  PROP_LANGUAGE,
  NPROPS
};

static GParamSpec *eknc_engine_props [NPROPS] = { NULL, };

static void
eknc_engine_get_property (GObject    *object,
                          guint       prop_id,
                          GValue     *value,
                          GParamSpec *pspec)
{
  EkncEngine *self = EKNC_ENGINE (object);

  switch (prop_id)
    {
    case PROP_DEFAULT_APP_ID:
      g_value_set_string (value, self->default_app_id);
      break;

    case PROP_LANGUAGE:
      g_value_set_string (value, self->language);
      break;

    default:
      G_OBJECT_WARN_INVALID_PROPERTY_ID (object, prop_id, pspec);
    }
}

static void
eknc_engine_set_property (GObject *object,
                          guint prop_id,
                          const GValue *value,
                          GParamSpec *pspec)
{
  EkncEngine *self = EKNC_ENGINE (object);

  switch (prop_id)
    {
    case PROP_DEFAULT_APP_ID:
      g_clear_pointer (&self->default_app_id, g_free);
      self->default_app_id = g_value_dup_string (value);
      break;

    case PROP_LANGUAGE:
      g_clear_pointer (&self->language, g_free);
      self->language = g_value_dup_string (value);
      g_object_set (G_OBJECT (self->xapian_bridge), "language", self->language, NULL);
      break;

    default:
      G_OBJECT_WARN_INVALID_PROPERTY_ID (object, prop_id, pspec);
    }
}

static void
eknc_engine_finalize (GObject *object)
{
  EkncEngine *self = EKNC_ENGINE (object);

  g_clear_pointer (&self->default_app_id, g_free);
  g_clear_pointer (&self->language, g_free);
  g_clear_pointer (&self->domains, g_hash_table_unref);
  g_clear_object (&self->xapian_bridge);

  G_OBJECT_CLASS (eknc_engine_parent_class)->finalize (object);
}

static void
eknc_engine_class_init (EkncEngineClass *klass)
{
  GObjectClass *object_class = G_OBJECT_CLASS (klass);

  object_class->get_property = eknc_engine_get_property;
  object_class->set_property = eknc_engine_set_property;
  object_class->finalize = eknc_engine_finalize;

  /**
   * EkncEngine:default-app-id:
   *
   * The default application the engine should serve up content for.
   */
  eknc_engine_props[PROP_DEFAULT_APP_ID] =
    g_param_spec_string ("default-app-id", "Default Application ID",
      "Default Application ID",
      "", G_PARAM_READWRITE | G_PARAM_CONSTRUCT | G_PARAM_STATIC_STRINGS);

  /**
   * EkncEngine:language:
   *
   * The ISO639 language code which will be used for various search features,
   * such as term stemming and spelling correction.
   */
  eknc_engine_props[PROP_LANGUAGE] =
    g_param_spec_string ("language", "Language",
      "The language to use",
      "", G_PARAM_READWRITE | G_PARAM_CONSTRUCT | G_PARAM_STATIC_STRINGS);

  g_object_class_install_properties (object_class,
                                     NPROPS,
                                     eknc_engine_props);
}

static void
eknc_engine_init (EkncEngine *self)
{
  self->xapian_bridge = g_object_new (EKNC_TYPE_XAPIAN_BRIDGE,
                                      "language", self->language,
                                      NULL);
  self->domains = g_hash_table_new_full (g_str_hash, g_str_equal, g_free, g_object_unref);
}

/**
 * eknc_engine_test_link:
 * @self: the engine
 * @link: the ekn id of link to check for
 * @error: #GError for error reporting.
 *
 * Attempts to determine if the given link corresponds to content within
 * the default domain.
 *
 * Returns: Returns an EKN URI to that content if so, and NULL otherwise.
 */
const gchar *
eknc_engine_test_link (EkncEngine *self,
                       const gchar *link,
                       GError **error)
{
  g_return_val_if_fail (EKNC_IS_ENGINE (self), NULL);

  return eknc_engine_test_link_for_app (self, link, self->default_app_id, error);
}

/**
 * eknc_engine_test_link_for_app:
 * @self: the engine
 * @link: the ekn id of link to check for
 * @app_id: the id of the application to load the object from
 * @error: #GError for error reporting.
 *
 * Attempts to determine if the given link corresponds to content within
 * the domain for the given application id.
 *
 * Returns: Returns an EKN URI to that content if so, and NULL otherwise.
 */
const gchar *
eknc_engine_test_link_for_app (EkncEngine *self,
                               const gchar *link,
                               const gchar *app_id,
                               GError **error)
{
  g_return_val_if_fail (EKNC_IS_ENGINE (self), NULL);
  g_return_val_if_fail (link && *link, NULL);
  g_return_val_if_fail (app_id && *app_id, NULL);
  g_return_val_if_fail (error == NULL || *error == NULL, NULL);

  EkncDomain *domain = eknc_engine_get_domain_for_app (self, app_id, error);
  if (domain == NULL)
    return NULL;
  return eknc_domain_test_link (domain, link, error);
}

/**
 * eknc_engine_get_object:
 * @self: the engine
 * @id: the ekn id of the object to load
 * @cancellable: (allow-none): optional #GCancellable object, %NULL to ignore.
 * @callback: (scope async): callback to call when the request is satisfied.
 * @user_data: (closure): the data to pass to callback function.
 *
 * Asynchronously fetches an object with ID for the default application.
 * Requires the default-app-id property to be set.
 */
void
eknc_engine_get_object (EkncEngine *self,
                        const gchar *id,
                        GCancellable *cancellable,
                        GAsyncReadyCallback callback,
                        gpointer user_data)
{
  g_return_if_fail (EKNC_IS_ENGINE (self));

  eknc_engine_get_object_for_app (self, id, self->default_app_id, cancellable, callback, user_data);
}

/**
 * eknc_engine_get_object_finish:
 * @self: the engine
 * @result: the #GAsyncResult that was provided to the callback.
 * @error: #GError for error reporting.
 *
 * Finish a eknc_engine_get_object call.
 *
 * Returns: (transfer full): the content object model that was fetched
 */
EkncContentObjectModel *
eknc_engine_get_object_finish (EkncEngine *self,
                               GAsyncResult *result,
                               GError **error)
{
  g_return_val_if_fail (EKNC_IS_ENGINE (self), NULL);
  g_return_val_if_fail (G_IS_TASK (result), NULL);
  g_return_val_if_fail (error == NULL || *error == NULL, NULL);

  return eknc_engine_get_object_for_app_finish (self, result, error);
}

static void
on_domain_object_finished (GObject *source,
                           GAsyncResult *result,
                           gpointer user_data)
{
  EkncDomain *domain = EKNC_DOMAIN (source);
  g_autoptr(GTask) task = user_data;
  GError *error = NULL;

  EkncContentObjectModel *model;
  if (!(model = eknc_domain_get_object_finish (domain, result, &error)))
    {
      g_task_return_error (task, error);
      return;
    }

  g_task_return_pointer (task, model, g_object_unref);
}

/**
 * eknc_engine_get_object_for_app:
 * @self: the engine
 * @id: the ekn id of the object to load
 * @app_id: the id of the application to load the object from
 * @cancellable: (allow-none): optional #GCancellable object, %NULL to ignore.
 * @callback: (scope async): callback to call when the request is satisfied.
 * @user_data: (closure): the data to pass to callback function.
 *
 * Asynchronously load an object model for the given ekn_id
 */
void
eknc_engine_get_object_for_app (EkncEngine *self,
                                const gchar *id,
                                const gchar *app_id,
                                GCancellable *cancellable,
                                GAsyncReadyCallback callback,
                                gpointer user_data)
{
  g_return_if_fail (EKNC_IS_ENGINE (self));
  g_return_if_fail (id != NULL);
  g_return_if_fail (G_IS_CANCELLABLE (cancellable) || cancellable == NULL);
  g_return_if_fail (app_id && *app_id);

  g_autoptr(GTask) task = g_task_new (self, cancellable, callback, user_data);
  GError *error = NULL;
  EkncDomain *domain;
  if (!(domain = eknc_engine_get_domain_for_app (self, app_id, &error)))
    {
      g_task_return_error (task, error);
      return;
    }

  eknc_domain_get_object (domain, id, cancellable, on_domain_object_finished, g_steal_pointer (&task));
}

/**
 * eknc_engine_get_object_for_app_finish:
 * @self: the engine
 * @result: the #GAsyncResult that was provided to the callback.
 * @error: #GError for error reporting.
 *
 * Finish a eknc_engine_get_object_for_app call.
 *
 * Returns: (transfer full): the content object model that was fetched
 */
EkncContentObjectModel *
eknc_engine_get_object_for_app_finish (EkncEngine *self,
                                       GAsyncResult *result,
                                       GError **error)
{
  g_return_val_if_fail (EKNC_IS_ENGINE (self), NULL);
  g_return_val_if_fail (G_IS_TASK (result), NULL);
  g_return_val_if_fail (error == NULL || *error == NULL, NULL);

  return g_task_propagate_pointer (G_TASK (result), error);
}

static void
on_domain_query_finished (GObject *source,
                          GAsyncResult *result,
                          gpointer user_data)
{
  EkncDomain *domain = EKNC_DOMAIN (source);
  g_autoptr(GTask) task = user_data;
  GError *error = NULL;

  EkncQueryResults *results;
  if (!(results = eknc_domain_query_finish (domain, result, &error)))
    {
      g_task_return_error (task, error);
      return;
    }

  g_task_return_pointer (task, results, g_object_unref);
}

static void
on_query_fixed_finished (GObject *source,
                         GAsyncResult *result,
                         gpointer user_data)
{
  EkncDomain *domain = EKNC_DOMAIN (source);
  g_autoptr(GTask) task = user_data;
  GCancellable *cancellable = g_task_get_cancellable (task);
  GError *error = NULL;

  g_autoptr(EkncQueryObject) query = NULL;
  if (!(query = eknc_domain_get_fixed_query_finish (domain, result, &error)))
    {
      g_task_return_error (task, error);
      return;
    }

  eknc_domain_query (domain, query, cancellable, on_domain_query_finished, g_steal_pointer (&task));
}

/**
 * eknc_engine_query:
 * @self: the engine
 * @query: the query object to fix
 * @cancellable: (allow-none): optional #GCancellable object, %NULL to ignore.
 * @callback: (scope async): callback to call when the request is satisfied.
 * @user_data: (closure): the data to pass to callback function.
 *
 * Asynchronously sends a request to xapian-bridge for a given #EkncQueryObject,
 * and return a list of matching #EkncContentObjectModel objects.
 */
void
eknc_engine_query (EkncEngine *self,
                   EkncQueryObject *query,
                   GCancellable *cancellable,
                   GAsyncReadyCallback callback,
                   gpointer user_data)
{
  g_return_if_fail (EKNC_IS_ENGINE (self));
  g_return_if_fail (EKNC_IS_QUERY_OBJECT (query));
  g_return_if_fail (G_IS_CANCELLABLE (cancellable) || cancellable == NULL);

  g_autofree gchar *query_app_id = NULL;
  g_object_get (G_OBJECT (query),
                "app_id", &query_app_id,
                NULL);
  gchar *app_id = self->default_app_id;
  if (query_app_id && *query_app_id)
    app_id = query_app_id;

  g_return_if_fail (app_id && *app_id);

  g_autoptr(GTask) task = g_task_new (self, cancellable, callback, user_data);
  GError *error = NULL;
  EkncDomain *domain;
  if (!(domain = eknc_engine_get_domain_for_app (self, app_id, &error)))
    {
      g_task_return_error (task, error);
      return;
    }

  g_autofree gchar *query_string = NULL;
  g_object_get (query, "query", &query_string, NULL);
  if (query_string && *query_string)
    {
      eknc_domain_get_fixed_query (domain, query, cancellable, on_query_fixed_finished, g_steal_pointer (&task));
      return;
    }

  /* We're searching for tags without a query string. */
  eknc_domain_query (domain, query, cancellable, on_domain_query_finished, g_steal_pointer (&task));
}

/**
 * eknc_engine_query_finish:
 * @self: the engine
 * @result: the #GAsyncResult that was provided to the callback.
 * @error: #GError for error reporting.
 *
 * Finishes a call to eknc_engine_query. Returns a #EkncQueryResults object.
 * Throws an error if one occurred.
 *
 * Returns: (transfer full): the results object
 */
EkncQueryResults *
eknc_engine_query_finish (EkncEngine *self,
                          GAsyncResult *result,
                          GError **error)
{
  g_return_val_if_fail (EKNC_IS_ENGINE (self), NULL);
  g_return_val_if_fail (G_IS_TASK (result), NULL);
  g_return_val_if_fail (error == NULL || *error == NULL, NULL);

  return g_task_propagate_pointer (G_TASK (result), error);
}

/**
 * eknc_engine_get_domain:
 * @self: the engine
 * @error: #GError for error reporting.
 *
 * Get a #EkncDomain object for the default-app-id. Requires the default-app-id
 * property to be set.
 *
 * Returns the domain if it has already been created, and synchronously creates
 * one if none exists. Returns an error if one occurred while initializing the
 * domain.
 *
 * Returns: (transfer none): the default domain
 */
EkncDomain *
eknc_engine_get_domain (EkncEngine *self,
                        GError **error)
{
  g_return_val_if_fail (EKNC_IS_ENGINE (self), NULL);

  return eknc_engine_get_domain_for_app (self, self->default_app_id, error);
}

/**
 * eknc_engine_get_domain_for_app:
 * @self: the engine
 * @app_id: the id of the application to load the object from
 * @error: #GError for error reporting.
 *
 * Get a #EkncDomain object for a given app id.
 *
 * Returns the domain if it has already been created, and synchronously creates
 * one if none exists. Returns an error if one occurred while initializing the
 * domain.
 *
 * Returns: (transfer none): the domain
 */
EkncDomain *
eknc_engine_get_domain_for_app (EkncEngine *self,
                                const gchar *app_id,
                                GError **error)
{
  g_return_val_if_fail (EKNC_IS_ENGINE (self), NULL);
  g_return_val_if_fail (app_id && *app_id, NULL);
  g_return_val_if_fail (error == NULL || *error == NULL, NULL);

  if (g_hash_table_contains (self->domains, app_id))
    return g_hash_table_lookup (self->domains, app_id);

  EkncDomain *domain;
  if (!(domain = eknc_domain_get_impl (app_id, NULL, self->xapian_bridge, NULL, error)))
    return NULL;
  // Hash table takes ownership of domain
  g_hash_table_insert (self->domains, g_strdup (app_id), domain);
  return domain;
}

/**
 * eknc_engine_add_domain_for_path:
 * @self: the engine
 * @app_id: the id of the application to load the object from
 * @path: the path to the content directory
 * @error: #GError for error reporting.
 *
 * Adds a domain for an specific content path
 */
void
eknc_engine_add_domain_for_path (EkncEngine *self,
                                 const gchar *app_id,
                                 const gchar *path,
                                 GError **error)
{
  EkncDomain *domain;

  g_return_if_fail (EKNC_IS_ENGINE (self));
  g_return_if_fail (app_id && *app_id);
  g_return_if_fail (path && *path);

  if (g_hash_table_contains (self->domains, app_id))
    return;

  domain = eknc_domain_get_impl (app_id, path, self->xapian_bridge, NULL, error);

  g_hash_table_insert (self->domains, g_strdup (app_id), domain);
}

/**
 * eknc_engine_get_default:
 *
 * Get the default engine object. Generally you should use this instead of
 * creating an engine object manually.
 *
 * Returns: (transfer none): the default engine
 */
EkncEngine *
eknc_engine_get_default (void)
{
  static EkncEngine *engine;

  if (g_once_init_enter (&engine))
    {
      const gchar *language = eknc_get_current_language ();
      g_once_init_leave (&engine, g_object_new (EKNC_TYPE_ENGINE, "language", language, NULL));
    }

  return engine;
}
