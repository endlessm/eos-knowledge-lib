/* Copyright 2018 Endless Mobile, Inc. */

#include <string.h>
#include <stdlib.h>

#include <mustache.h>
#include <libintl.h>

#include "eknr-renderer.h"

#define _(String) gettext (String)
#define gettext_noop(String) String
#define N_(String) gettext_noop (String)

/**
 * SECTION:renderer
 * @title: Renderer
 * @short_description: A post-processing renderer for HTML article content
 *
 * The renderer is responsible for adding some final postprocessing to
 * articles on the client side before it is displayed to the user. What
 * postprocessing happens depends on the article's source.
 */
struct _EknrRenderer
{
  GObject parent_instance;
};

typedef struct _EknrRendererPrivate
{
  GHashTable *cache;
} EknrRendererPrivate;

G_DEFINE_TYPE_WITH_PRIVATE (EknrRenderer,
                            eknr_renderer,
                            G_TYPE_OBJECT)

enum {
  PROP_0,
  NPROPS
};

static GParamSpec *eknr_renderer_props [NPROPS] = { NULL, };

static mustache_str_ctx *
_renderer_mustache_str_ctx_new (gchar *string)
{
  mustache_str_ctx *ctx = g_new0 (mustache_str_ctx, 1);
  ctx->string = string;
  ctx->offset = 0;

  return ctx;
}

static void
_renderer_mustache_str_ctx_free (mustache_str_ctx *ctx)
{
  g_clear_pointer (&ctx->string, g_free);
  g_free (ctx);
}

G_DEFINE_AUTOPTR_CLEANUP_FUNC (mustache_str_ctx, _renderer_mustache_str_ctx_free);

typedef struct _RendererMustacheData {
  GVariantDict  *variables;
  GError       **error; /* non-owned */

  mustache_str_ctx input;
  mustache_str_ctx output;

  const gchar *section_variable;
} RendererMustacheData;

static RendererMustacheData *
renderer_mustache_data_new (GVariantDict  *variables,
                            GError       **error,
                            const gchar   *input)
{
  RendererMustacheData *data = g_new0 (RendererMustacheData, 1);
  data->variables = variables;
  data->error = error;
  data->input.string = (gchar *) input;
  data->input.offset = 0;
  data->output.string = NULL;
  data->output.offset = 0;

  return data;
}

static void
renderer_mustache_data_free (RendererMustacheData *data)
{
  g_clear_pointer (&data->variables, g_variant_dict_unref);
  g_clear_pointer (&data->output.string, free);
  g_free (data);
}

G_DEFINE_AUTOPTR_CLEANUP_FUNC (RendererMustacheData,
                               renderer_mustache_data_free);

static void
free_mustache_template(mustache_template_t *template)
{
  mustache_api_t api = {
    .freedata = NULL
  };

  mustache_free (&api, template);
}


G_DEFINE_AUTOPTR_CLEANUP_FUNC (mustache_template_t, free_mustache_template);

static uintmax_t
_renderer_read_from_closure (mustache_api_t *api,
                             void           *userdata,
                             char           *buffer,
                             uintmax_t       buffer_size)
{
  RendererMustacheData *data = userdata;
  return mustache_std_strread (api, (void *) &data->input, buffer, buffer_size);
}

static uintmax_t
_renderer_write_to_closure (mustache_api_t *api,
                            void           *userdata,
                            const char     *buffer,
                            uintmax_t       buffer_size)
{
  RendererMustacheData *data = userdata;
  return mustache_std_strwrite (api, (void *) &data->output, (char *) buffer, buffer_size);
}

static gchar *
_lookup_in_gvariant_dict (RendererMustacheData *data,
                          const gchar          *text,
                          mustache_api_t       *api)
{
  g_autoptr(GVariant) value_v = g_variant_dict_lookup_value (data->variables, text, G_VARIANT_TYPE ("s"));
  const gchar *value = NULL;

  if (value_v == NULL)
    {
      g_autofree gchar *msg = g_strdup_printf ("No such variable %s", text);
      (*api->error) (api, data, __LINE__, msg);
      return NULL;
    }

  return g_variant_dup_string (value_v, NULL);
}

static const gchar *
html_entity_for_char (char matched_ent)
{
  switch (matched_ent) {
    case '&':
      return "&amp;";
    case '<':
      return "&lt;";
    case '>':
      return "&gt;";
    case '"':
      return "&quot;";
    case '\'':
      return "&#39;";
    case '/':
      return "&#x2F;";
    default:
      return NULL;
  }
}

static gboolean
escape_value_eval_callback (const GMatchInfo *match_info,
                            GString          *result,
                            gpointer          user_data)
{
  /* Faster to just use if statements here */
  char matched_ent = g_match_info_fetch (match_info, 0)[0];
  const gchar *html_entity = html_entity_for_char (matched_ent);

  if (html_entity == NULL)
    return TRUE;

  g_string_append (result, html_entity);

  /* From the documentation, FALSE to continue to the replacement process,
   * TRUE to stop it. It isn't entirely clear, but it seems that prematurely
   * stopping the replacement process is an error case. */
  return FALSE;
}

/**
 * eknr_escape_html:
 * @html: The string to escape
 * @error: A #GError
 *
 * Escape HTML, replacing characters with HTML entities.
 *
 * Returns: (transfer full): The escaped HTML document, or %NULL on error.
 */
gchar *
eknr_escape_html (const gchar  *html,
                  GError      **error)
{
  g_autoptr(GRegex) regex = NULL;
  g_autofree gchar *escaped = NULL;

  /* First, use a regex to pick out the relevant entities that
   * need to be escaped.*/
  regex = g_regex_new ("[&<>\"'\\/]", 0, 0, error);

  if (regex == NULL)
    return NULL;;

  escaped = g_regex_replace_eval (regex,
                                  html,
                                  strlen (html),
                                  0,
                                  0,
                                  escape_value_eval_callback,
                                  NULL,
                                  error);

  if (escaped == NULL)
    return NULL;

  return g_steal_pointer (&escaped);
}

/**
 * maybe_escape_value:
 * @value: (transfer full): The string to escape
 * @is_escaped: Whether or not to apply escaping
 * @api: A #mustache_api_t, used for error reporting
 *
 * Based on what mustache.js does to escape HTML.
 *
 * Uses a regex to pick out offending characters, then replaces with
 * HTML entities.
 *
 * Returns: %NULL on failure, an escaped value on success.
 */
static gchar *
maybe_escape_value (gchar          *value,
                    gboolean        is_escaped,
                    mustache_api_t *api,
                    void           *api_closure)
{
  g_autoptr(GError) error = NULL;
  g_autofree gchar *unescaped = NULL;
  g_autofree gchar *escaped = NULL;

  if (!is_escaped)
    return value;

  /* Take an autofree reference to unescaped, it will be freed
   * when the function returns. */
  unescaped = value;
  escaped = eknr_escape_html (unescaped, &error);

  if (escaped == NULL)
    {
      (*api->error) (api, api_closure, __LINE__, error->message);
      return NULL;
    }

  return g_steal_pointer (&escaped);
}

static uintmax_t
_renderer_var_from_ht (mustache_api_t            *api,
                       void                      *userdata,
                       mustache_token_variable_t *token)
{
  RendererMustacheData *data = userdata;
  g_autofree gchar *value = NULL;

  /* First, if we're in a section in the value is ".", then we
   * need to replace it with the section name. */
  if (data->section_variable != NULL && token->text[0] == '.')
    value = g_strdup (data->section_variable);
  else
    value = _lookup_in_gvariant_dict (data, token->text, api);

  if (value == NULL)
    return 0;

  value = maybe_escape_value (g_steal_pointer (&value),
                              token->escaped == 1,
                              api,
                              userdata);

  /* Error would have been set in API. */
  if (value == NULL)
    return 0;

  (*api->write) (api, userdata, value, strlen(value));
  return 1;
}

static uintmax_t
_renderer_strv_sect_from_ht (mustache_api_t           *api,
                             void                     *userdata,
                             mustache_token_section_t *token,
                             GVariant                 *variant)
{
  RendererMustacheData *data = userdata;
  g_autofree const gchar **strv = g_variant_get_strv (variant, NULL);
  const gchar **iter = strv;

  /* Keep track of the current section variable, then pop it once we're
   * done */
  const gchar *last_section_variable = data->section_variable;

  /* Need to render each sub-template from here */
  while (*iter != NULL)
    {
      uintmax_t rv = 0;
      data->section_variable = *iter;

      if (!mustache_render (api, userdata, token->section))
        {
          data->section_variable = last_section_variable;
          return 0;
        }

      iter++;
    }

  data->section_variable = last_section_variable;
  return 1;
}

static uintmax_t
_renderer_bool_sect_from_ht (mustache_api_t           *api,
                             void                     *userdata,
                             mustache_token_section_t *token,
                             GVariant                 *variant)
{
  RendererMustacheData *data = userdata;

  /* Need to render each sub-template from here */
  if (g_variant_get_boolean (variant))
    return mustache_render (api, userdata, token->section);

  /* Nothing to do */
  return 1;
}

static uintmax_t
_renderer_str_sect_from_ht (mustache_api_t           *api,
                            void                     *userdata,
                            mustache_token_section_t *token,
                            GVariant                 *variant)
{
  RendererMustacheData *data = userdata;
  uintmax_t rv = 0;
  const gchar *last_section_variable = data->section_variable;

  data->section_variable = g_variant_get_string (variant, NULL);

  /* Need to render each sub-template from here */
  rv = mustache_render (api, userdata, token->section);

  data->section_variable = last_section_variable;

  return rv;
}

static uintmax_t
_renderer_section_from_ht_variant (GVariant                 *variant,
                                   mustache_api_t           *api,
                                   void                     *userdata,
                                   mustache_token_section_t *token)
{
  g_autofree gchar *msg = NULL;
  const gchar *vt = g_variant_get_type_string (variant);

  if (g_strcmp0 (vt, "as") == 0)
    return _renderer_strv_sect_from_ht (api, userdata, token, variant);
  else if (g_strcmp0 (vt, "b") == 0)
    return _renderer_bool_sect_from_ht (api, userdata, token, variant);
  else if (g_strcmp0 (vt, "s") == 0)
    return _renderer_str_sect_from_ht (api, userdata, token, variant);

  msg = g_strdup_printf ("No handler for section type %s on token %s", vt, token->name);
  (*api->error) (api, userdata, __LINE__, msg);
  return 1;
}

static uintmax_t
_renderer_sect_from_ht (mustache_api_t           *api,
                        void                     *userdata,
                        mustache_token_section_t *token)
{
  RendererMustacheData *data = userdata;
  g_autoptr(GVariant) value = g_variant_dict_lookup_value (data->variables,
                                                           token->name,
                                                           NULL);
  g_autofree const gchar **strv = NULL;
  const gchar **iter = NULL;
  const gchar *last_section_variable = NULL;

  if (value == NULL)
    {
      g_autofree gchar *msg = g_strdup_printf ("No such section %s", token->name);
      (*api->error) (api, data, __LINE__, msg);
      return 0;
    }

  if (!_renderer_section_from_ht_variant (value, api, userdata, token))
    return 0;

  return 1;
}

static void
_renderer_set_error (mustache_api_t *api,
                     void           *userdata,
                     uintmax_t       lineno,
                     const char     *msg)
{
  RendererMustacheData *data = userdata;

  g_set_error (data->error,
               EKNR_ERROR,
               EKNR_ERROR_SUBSTITUTION_FAILED,
               "Failed to perform template substitution: %s",
               msg);
}

gchar *
_renderer_render_mustache_document_internal (mustache_template_t  *tmpl,
                                             GVariant             *variables,
                                             GError              **error)
{
  mustache_api_t api = {
    .read = &_renderer_read_from_closure,
    .write = &_renderer_write_to_closure,
    .varget = &_renderer_var_from_ht,
    .sectget = &_renderer_sect_from_ht,
    .error = &_renderer_set_error
  };
  g_autoptr(RendererMustacheData) data = renderer_mustache_data_new (g_variant_dict_new (variables),
                                                                     error,
                                                                     NULL);

  if (!mustache_render (&api, (void *) data, tmpl))
    return NULL;

  return g_steal_pointer (&data->output.string);
}

/**
 * eknr_renderer_render_mustache_document_from_file:
 * @renderer: An #EknrRenderer
 * @file: A #GFile specifying the location of the template file
 * @variables: The variables and sections to use when rendering.
 * @error: A #GError
 *
 * Use mustache_c to render a document, similar to
 * eknr_renderer_render_mustache_document, but read the template
 * from the file specified at @file. If that file has already been
 * read, its contents will be read from the internal cache.
 *
 * Returns: The renderered document on success, %NULL on error.
 */
gchar *
eknr_renderer_render_mustache_document_from_file (EknrRenderer *renderer,
                                                  GFile        *file,
                                                  GVariant     *variables,
                                                  GError      **error)
{
  g_autofree gchar *path = g_file_get_uri (file);
  EknrRendererPrivate *priv = eknr_renderer_get_instance_private (renderer);
  mustache_template_t *tmpl = g_hash_table_lookup (priv->cache, path);
  g_autofree gchar *contents = NULL;
  mustache_api_t api = {
    .read = &_renderer_read_from_closure,
    .write = &_renderer_write_to_closure,
    .varget = &_renderer_var_from_ht,
    .sectget = &_renderer_sect_from_ht,
    .error = &_renderer_set_error
  };
  g_autoptr(RendererMustacheData) data = NULL;

  if (tmpl != NULL)
    return _renderer_render_mustache_document_internal (tmpl, variables, error);

  if (!g_file_load_contents (file, NULL, &contents, NULL, NULL, error))
    return NULL;

  data = renderer_mustache_data_new (NULL,
                                     error,
                                     contents);
  tmpl = mustache_compile (&api, (gchar *) data);

  if (tmpl == NULL)
    return NULL;

  g_hash_table_replace (priv->cache, g_steal_pointer (&path), tmpl);

  return _renderer_render_mustache_document_internal (tmpl, variables, error);
}

/**
 * eknr_renderer_render_mustache_document:
 * @renderer: An #EknrRenderer
 * @tmpl_text: The template to render
 * @variables: The variables and sections to use when rendering.
 * @error: A #GError
 *
 * Use mustache_c to render a document. The provided @variables variant
 * is used as substitutions. The variant should be of type
 * 'a{sv}' and each child node should be either 's' or a variable subsitution
 * 'as' for a section substitution.
 *
 * Returns: The renderered document on success, %NULL on error.
 */
gchar *
eknr_renderer_render_mustache_document (EknrRenderer *renderer,
                                        const gchar  *tmpl_text,
                                        GVariant     *variables,
                                        GError      **error)
{
  mustache_api_t api = {
    .read = &_renderer_read_from_closure,
    .write = &_renderer_write_to_closure,
    .varget = &_renderer_var_from_ht,
    .sectget = &_renderer_sect_from_ht,
    .error = &_renderer_set_error
  };
  g_autoptr(RendererMustacheData) data = renderer_mustache_data_new (g_variant_dict_new (variables),
                                                                     error,
                                                                     tmpl_text);
  g_autoptr(mustache_template_t) tmpl = mustache_compile (&api,
                                                          (gchar *) data);

  if (!tmpl)
    return NULL;

  return _renderer_render_mustache_document_internal (tmpl, variables, error);
}

/**
 * eknr_mustache_template_compiles:
 * @tmpl_text: The template to render
 * @error: A #GError
 *
 * Attempt to compile a mustache template.
 *
 * Returns: The %TRUE on success, %FALSE on error.
 */
gboolean
eknr_mustache_template_compiles (const gchar  *tmpl_text,
                                 GError      **error)
{
  mustache_api_t api = {
    .read = &_renderer_read_from_closure,
    .write = &_renderer_write_to_closure,
    .varget = &_renderer_var_from_ht,
    .sectget = &_renderer_sect_from_ht,
    .error = &_renderer_set_error
  };
  g_autoptr(RendererMustacheData) data = renderer_mustache_data_new (NULL,
                                                                     error,
                                                                     tmpl_text);
  g_autoptr(mustache_template_t) tmpl = mustache_compile (&api,
                                                          (gchar *) data);

  if (!tmpl)
    return FALSE;

  return TRUE;
}

static void
eknr_renderer_get_property (GObject    *object,
                            guint       prop_id,
                            GValue     *value,
                            GParamSpec *pspec)
{
  EknrRenderer *self = EKNR_RENDERER (object);

  switch (prop_id)
    {
    default:
      G_OBJECT_WARN_INVALID_PROPERTY_ID (object, prop_id, pspec);
    }
}

static void
eknr_renderer_set_property (GObject *object,
                            guint prop_id,
                            const GValue *value,
                            GParamSpec *pspec)
{
  EknrRenderer *self = EKNR_RENDERER (object);

  switch (prop_id)
    {
    default:
      G_OBJECT_WARN_INVALID_PROPERTY_ID (object, prop_id, pspec);
    }
}

static void
eknr_renderer_finalize (GObject *object)
{
  EknrRenderer *self = EKNR_RENDERER (object);
  EknrRendererPrivate *priv = eknr_renderer_get_instance_private (self);

  g_hash_table_unref (priv->cache);

  G_OBJECT_CLASS (eknr_renderer_parent_class)->finalize (object);
}

static void
eknr_renderer_class_init (EknrRendererClass *klass)
{
  GObjectClass *object_class = G_OBJECT_CLASS (klass);

  object_class->get_property = eknr_renderer_get_property;
  object_class->set_property = eknr_renderer_set_property;
  object_class->finalize = eknr_renderer_finalize;
}

static void
eknr_renderer_init (EknrRenderer *self)
{
  EknrRendererPrivate *priv = eknr_renderer_get_instance_private (self);
  priv->cache = g_hash_table_new_full (g_str_hash,
                                       g_str_equal,
                                       g_free,
                                       (GDestroyNotify) free_mustache_template);
}

EknrRenderer *
eknr_renderer_new (void)
{
  return EKNR_RENDERER (g_object_new (EKNR_TYPE_RENDERER, NULL));
}

GQuark
eknr_error (void)
{
  return g_quark_from_static_string ("eknr-error");
}

G_DEFINE_QUARK (eknr-error, eknr_error)
