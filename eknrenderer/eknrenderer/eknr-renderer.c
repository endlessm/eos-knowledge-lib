/* Copyright 2018 Endless Mobile, Inc. */

#include <string.h>
#include <stdlib.h>

#include <endless/endless.h>
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

static gchar *
format_a_href_link (const gchar  *uri,
                    const gchar  *text,
                    GError      **error)
{
  g_autofree gchar *escaped = eknr_escape_html(text, error);

  if (escaped == NULL)
    return NULL;

  return g_strdup_printf ("<a class=\"eos-show-link\" href=\"%s\">%s</a>",
                          uri,
                          escaped);
}

static gchar *
format_license_link (const gchar  *license,
                     GError      **error)
{
  g_autofree gchar *escaped = g_uri_escape_string (license, NULL, TRUE);
  g_autofree gchar *licence_link = g_strdup_printf ("license://%s", escaped);
  return format_a_href_link (licence_link,
                             eos_get_license_display_name (license),
                             error);
}

static GVariant *
get_legacy_disclaimer_section_content (const gchar  *source,
                                       const gchar  *source_name,
                                       const gchar  *original_uri,
                                       const gchar  *license,
                                       const gchar  *title,
                                       GError      **error)
{
  if (g_strcmp0 (source, "wikisource") == 0 ||
      g_strcmp0 (source, "wikibooks") == 0 ||
      g_strcmp0 (source, "wikipedia") == 0)
    {
      g_autofree gchar *original_link = format_a_href_link (original_uri,
                                                            source_name,
                                                            error);
      g_autofree gchar *license_link = NULL;
      g_autofree gchar *disclaimer = NULL;

      if (original_link == NULL)
        return NULL;

      license_link = format_license_link (license, error);

      if (license_link == NULL)
        return NULL;

      disclaimer = g_strdup_printf(_("This page conatins content from %s, available under a %s license."),
                                   source, license_link);
      return g_variant_new_string (disclaimer);
    }
  else if (g_strcmp0 (source, "wikihow") == 0)
    {
      g_autofree gchar *wikihow_article_link = format_a_href_link (original_uri,
                                                                   title,
                                                                   error);
      g_autofree gchar *wikihow_link = NULL;
      g_autofree gchar *disclaimer = NULL;

      if (wikihow_article_link == NULL)
        return NULL;

      wikihow_link = format_a_href_link (_("http://wikihow.com"),
                                         source_name,
                                         error);

      if (wikihow_link == NULL)
        return NULL;

      disclaimer = g_strdup_printf(_("See %s for more details, videos, pictures and attribution. Courtesy of %s, where anyone can easily learn how to do anything."),
                                   wikihow_article_link,
                                   wikihow_link);

      return g_variant_new_string (disclaimer);
    }

  return g_variant_new_boolean (FALSE);
}

static GVariant *
get_legacy_css_files (const gchar *source)
{
  const gchar * const empty_css_files[] = { NULL };

  if (g_strcmp0 (source, "wikisource") == 0 ||
      g_strcmp0 (source, "wikibooks") == 0 ||
      g_strcmp0 (source, "wikipedia") == 0)
    {
      const gchar * const css_files[] = {
        "wikimedia.css",
        NULL
      };
      return g_variant_new_strv (css_files, -1);
    }
  else if (g_strcmp0 (source, "wikihow") == 0)
    {
      const gchar * const css_files[] = {
        "wikihow.css",
        NULL
      };
      return g_variant_new_strv (css_files, -1);
    }

  return g_variant_new_strv (empty_css_files, -1);
}

static GVariant *
get_legacy_javascript_files (gboolean use_scroll_manager)
{
  GPtrArray *javascript_files = g_ptr_array_new_with_free_func (g_free);
  g_auto(GStrv) strv = NULL;

  g_ptr_array_add (javascript_files, g_strdup ("content-fixes.js"));
  g_ptr_array_add (javascript_files, g_strdup ("hide-broken-images.js"));

  if (use_scroll_manager)
    g_ptr_array_add (javascript_files, g_strdup ("scroll-manager.js"));

  /* NULL-terminate */
  g_ptr_array_add (javascript_files, NULL);

  strv = (GStrv) g_ptr_array_free (javascript_files, FALSE);
  return g_variant_new_strv ((const gchar * const *) strv, -1);
}

static GVariant *
get_legacy_should_include_mathjax (const gchar *source)
{
  if (g_strcmp0 (source, "wikisource") == 0 ||
      g_strcmp0 (source, "wikibooks") == 0 ||
      g_strcmp0 (source, "wikipedia") == 0)
    return g_variant_new_boolean (TRUE);

  return g_variant_new_boolean (FALSE);
}

static gchar *
regex_substitute (const gchar  *regex,
                  const gchar  *substitution,
                  const gchar  *content,
                  GError      **error)
{
  g_autoptr(GRegex) regex_compiled = g_regex_new (regex, 0, 0, error);

  if (regex == NULL)
    return NULL;

  return g_regex_replace (regex_compiled,
                          content,
                          -1,
                          0,
                          substitution,
                          0,
                          error);
}

static gchar *
strip_body_tags (const gchar  *html,
                 GError      **error)
{
  g_autofree gchar *stripped_start_tags = regex_substitute ("^\\s*<html>\\s*<body>",
                                                            "",
                                                            html,
                                                            error);

  if (stripped_start_tags == NULL)
    return NULL;

  return regex_substitute ("<\\/body>\\s*<\\/html>\\s*$",
                           "",
                           stripped_start_tags,
                           error);
}

static GFile *
template_file (const gchar *filename)
{
  g_autofree gchar *uri = g_strdup_printf ("resource:///com/endlessm/knowledge/data/templates/%s", filename);
  return g_file_new_for_uri (uri);
}

gchar *
_renderer_render_legacy_content (EknrRenderer *renderer,
                                 const gchar  *body_html,
                                 const gchar  *source,
                                 const gchar  *source_name,
                                 const gchar  *original_uri,
                                 const gchar  *license,
                                 const gchar  *title,
                                 gboolean      show_title,
                                 gboolean      use_scroll_manager,
                                 GError      **error)
{
  g_autoptr(GFile) file = template_file("legacy-article.mst");
  g_autofree gchar *stripped_body = strip_body_tags (body_html, error);
  GVariantDict vardict;
  g_autoptr(GVariant) variant = NULL;
  GVariant *disclaimer = NULL; /* floating */

  if (stripped_body == NULL)
    return NULL;

  disclaimer = get_legacy_disclaimer_section_content (source,
                                                      source_name,
                                                      original_uri,
                                                      license,
                                                      title,
                                                      error);

  if (disclaimer == NULL)
    return NULL;

  g_variant_dict_init (&vardict, NULL);

  g_variant_dict_insert_value (&vardict,
                               "title",
                               show_title ? g_variant_new_string (title) : g_variant_new_boolean (FALSE));
  g_variant_dict_insert_value (&vardict, "body-html", g_variant_new_string (stripped_body));
  g_variant_dict_insert_value (&vardict, "disclaimer", disclaimer);
  g_variant_dict_insert_value (&vardict, "copy-button-text", g_variant_new_string (_("Copy")));
  g_variant_dict_insert_value (&vardict, "css-files", get_legacy_css_files (source));
  g_variant_dict_insert_value (&vardict, "javascript-files", get_legacy_javascript_files (use_scroll_manager));
  g_variant_dict_insert_value (&vardict, "include-mathjax", get_legacy_should_include_mathjax (source));
  g_variant_dict_insert_value (&vardict, "mathjax-path", g_variant_new_string (MATHJAX_PATH));

  variant = g_variant_dict_end (&vardict);

  return eknr_renderer_render_mustache_document_from_file (renderer,
                                                           file,
                                                           variant,
                                                           error);
}

gchar *
_renderer_render_prensa_libre_content (EknrRenderer *renderer,
                                       const gchar  *body_html,
                                       GError      **error)
{
  g_autoptr(GFile) file = template_file("news-article.mst");
  g_autofree gchar *stripped_body = strip_body_tags (body_html, error);
  g_auto(GVariantDict) vardict;
  g_autoptr(GVariant) variant = NULL;
  const gchar *prensa_libre_css_files[] = {
    "prensa-libre.css",
    NULL
  };

  if (stripped_body == NULL)
    return NULL;

  g_variant_dict_init (&vardict, NULL);

  g_variant_dict_insert_value (&vardict, "body-html", g_variant_new_string (stripped_body));
  g_variant_dict_insert_value (&vardict, "css-files", g_variant_new_strv ((const gchar * const *) prensa_libre_css_files, -1));

  variant = g_variant_dict_end (&vardict);

  return eknr_renderer_render_mustache_document_from_file (renderer,
                                                           file,
                                                           variant,
                                                           error);
}

/**
 * eknr_renderer_render_content:
 * @renderer: An #EknrRenderer
 * @body_html: The underlying HTML body
 * @server_templated: Whether templating already occurred at build time
 * @source: Where this content came from
 * @source_name: Name of the source
 * @original_uri: URI this content came from
 * @license: Content license
 * @title: Content title
 * @show_title: %TRUE if the article title should be rendered out too.
 * @use_scroll_manager: %TRUE if the scroll manager should be used, %FALSE otherwise
 * @error: A #GError
 *
 * Render the content and return the rendered content.;
 *
 * Returns: (transfer full): A string of rendered HTML or %NULL on error.
 */
gchar *
eknr_renderer_render_content (EknrRenderer  *renderer,
                              const gchar   *body_html,
                              gboolean       server_templated,
                              const gchar   *source,
                              const gchar   *source_name,
                              const gchar   *original_uri,
                              const gchar   *license,
                              const gchar   *title,
                              gboolean       show_title,
                              gboolean       use_scroll_manager,
                              GError       **error)
{
  if (server_templated)
    return g_strdup (body_html);

  if (g_strcmp0 (source, "wikipedia") == 0 ||
      g_strcmp0 (source, "wikihow") == 0 ||
      g_strcmp0 (source, "wikisource") == 0 ||
      g_strcmp0 (source, "wikibooks") == 0)
    return _renderer_render_legacy_content(renderer,
                                           body_html,
                                           source,
                                           source_name,
                                           original_uri,
                                           license,
                                           title,
                                           show_title,
                                           use_scroll_manager,
                                           error);
  else if (g_strcmp0 (source, "prensa-libre") == 0)
    return _renderer_render_prensa_libre_content(renderer, body_html, error);

  g_set_error (error,
               EKNR_ERROR,
               EKNR_ERROR_UNKNOWN_LEGACY_SOURCE,
               "HTML is not server templated, but no renderer exists for %s",
               source);

  return NULL;
}

static GVariant *
get_wrapper_css_files (const gchar * const *custom_css_files)
{
  GPtrArray *wrapper_css_files = g_ptr_array_new_with_free_func (g_free);
  g_auto(GStrv) strv = NULL;

  g_ptr_array_add (wrapper_css_files, g_strdup ("clipboard.css"));
  g_ptr_array_add (wrapper_css_files, g_strdup ("share-actions.css"));

  while (*custom_css_files != NULL)
    {
      g_ptr_array_add (wrapper_css_files, g_strdup (*custom_css_files));
      ++custom_css_files;
    }

  g_ptr_array_add (wrapper_css_files, NULL);

  strv = (const gchar * const *) g_ptr_array_free (wrapper_css_files, FALSE);
  return g_variant_new_strv (strv, -1);
}

static GVariant *
get_wrapper_js_files (void)
{
  const gchar * const wrapper_js_files[] = {
    "jquery-min.js",
    "clipboard-manager.js",
    "crosslink.js",
    "chunk.js",
    "share-actions.js",
    NULL
  };

  return g_variant_new_strv (wrapper_js_files, -1);
}

static GVariant *
get_wrapper_outgoing_links_json (const gchar * const               *outgoing_links,
                                 EknrOutgoingLinkDeterminationFunc  determination_func,
                                 gpointer                           user_data)
{
  g_autoptr(JsonBuilder) builder = json_builder_new ();
  g_autoptr(JsonNode) node = NULL;
  g_autoptr(JsonGenerator) generator = NULL;
  g_autofree gchar *json_string = NULL;

  json_builder_begin_array (builder)

  while (*outgoing_links != NULL)
    {
      const gchar *link = *outgoing_links;

      if ((*determination_func) (link, user_data))
        json_builder_add_string_value (array, link);

      ++outgoing_links;
    }

  json_builder_end_array (builder);
  node = json_builder_get_root (builder);
  generator = json_generator_new ();

  json_generator_set_root (node);
  json_string = json_generator_to_data (generator, NULL);

  return g_variant_new_string (json_string);
}

static GPtrArray *
get_wrapper_parent_featured_sets (const gchar * const *tags,
                                  GHashTable          *set_map)
{
  g_autoptr(GPtrArray) parent_featured_sets = g_ptr_array_new_with_free_func (eknr_boxed_set_info_unref);

  for (; *tags != NULL; ++tags)
    {
      const gchar      *tag = *tags;
      EknrBoxedSetInfo *set = NULL;

      if (g_strncmp(tag, "Ekn", 3) == 0)
        continue;

      set = g_hash_table_lookup (set_map, tag);

      if (set == NULL)
        continue;

      if (!set.featured)
        continue;

      g_ptr_array_add (parent_featured_sets,
                       eknr_boxed_set_info_ref (set));
    }

  return g_steal_pointer (&parent_featured_sets);
}

static JsonNode *
strv_to_json_array_node (GStrv strv)
{
  g_autoptr(JsonBuilder) builder = json_builder_new ();

  json_builder_begin_array (builder);

  while (*strv != NULL)
    {
      json_builder_add_string_value (builder, *strv);
      ++strv;
    }

  json_builder_end_array (builder);

  return json_builder_get_root (builder);
}

static GVariant *
get_wrapper_chunk_data_json (const gchar * const *tags,
                             GHashTable          *set_map)
{
  g_autoptr(JsonBuilder) object_builder = json_builder_new ();
  g_autoptr(JsonBuilder) array_builder = json_builder_new ();
  g_autoptr(JsonNode) node = NULL;
  g_autoptr(JsonGenerator) generator = NULL;
  g_autoptr(GPtrArray) parent_featured_sets = get_wrapper_parent_featured_sets (tags, set_map);
  guint parent_featured_sets_index = 0;
  g_autofree gchar *json_string = NULL;

  json_builder_begin_object (object_builder)
  json_builder_set_member_name (object_builder, "ParentFeaturedSets");

  json_builder_begin_array (array_builder);

  for (;
       parent_featured_sets_index <= parent_featured_sets->length;
       ++parent_featured_sets_index)
    {
      EknrBoxedSetInfo *set = g_ptr_array_index (parent_featured_sets,
                                                 parent_featured_sets_index);

      g_autoptr(JsonBuilder) child_builder = json_builder_new ();

      json_builder_begin_object (child_builder);

      /* Build up JSON representation of child */
      json_builder_set_member_name (child_builder, "child_tags");
      json_builder_set_value (child_builder,
                              strv_to_json_array_node (set->child_tags));

      json_builder_set_member_name (child_builder, "ekn_id");
      json_builder_set_string_value (child_builder, set->ekn_id);

      json_builder_set_member_name (child_builder, "title=");
      json_builder_set_string_value (child_builder, set->title);

      json_builder_set_member_name (child_builder, "tags");
      json_builder_set_value (child_builder,
                              strv_to_json_array_node (set->tags));

      json_builder_end_object (child_builder);

      /* Add to the array */
      json_builder_add_value (array_builder,
                              json_builder_get_node (child_builder));
    }

  json_builder_end_array (array_builder);

  /* Set parent object value */
  json_builder_set_value (object_builder, json_builder_get_node (array_builder));

  /* Stringify */
  node = json_builder_get_root (builder);
  generator = json_generator_new ();

  json_generator_set_root (node);
  json_string = json_generator_to_data (generator, NULL);

  return g_variant_new_string (json_string);
}

static GVariant *
get_wrapper_metadata (const gchar         *ekn_id,
                      const gchar         *title,
                      const gchar         *published,
                      const gchar * const *authors,
                      const gchar *       *license,
                      const gchar         *source,
                      const gchar         *source_name,
                      const gchar         *original_uri,
                      const gchar * const *tags,
                      GHashTable          *set_map)
{
  g_autoptr(JsonBuilder) metadata_builder = json_builder_new ();
  g_autoptr(JsonBuilder) sets_array_builder = json_builder_new ();
  g_autoptr(GPtrArray) sets = g_ptr_array_new_with_free_func (eknr_boxed_set_info_unref);
  guint sets_index = 0;
  g_autoptr(JsonNode) node = NULL;
  g_autoptr(JsonGenerator) generator = NULL;
  g_autofree gchar *json_string = NULL;

  for (; *tags != NULL; ++tags)
    {
      const gchar *tag = *tags;
      EknrBoxedSetInfo *set = NULL;

      if (g_strncmp (tag, "Ekn", 3) == 0)
        continue;

      set = g_hash_table_lookup (set_map, tag);

      if (set == NULL)
        continue;

      g_ptr_array_add (sets, eknr_boxed_set_info_ref (set));
    }

  /* Now that we have all the sets, collect metadata into JSON */
  json_builder_begin_object (metadata_builder);

  json_builder_set_member_name (metadata_builder, "id");
  json_builder_set_string_value (metadata_builder, ekn_id);

  json_builder_set_member_name (metadata_builder, "title");
  json_builder_set_string_value (metadata_builder, title);

  json_builder_set_member_name (metadata_builder, "published");
  json_builder_set_string_value (metadata_builder, published);

  json_builder_set_member_name (metadata_builder, "authors");
  json_builder_set_value (metadata_builder,
                          strv_to_json_array_node (authors));

  json_builder_set_member_name (metadata_builder, "license");
  json_builder_set_string_value (metadata_builder, license);

  json_builder_set_member_name (metadata_builder, "source");
  json_builder_set_string_value (metadata_builder, source);

  json_builder_set_member_name (metadata_builder, "source_name");
  json_builder_set_string_value (metadata_builder, source_name);

  json_builder_set_member_name (metadata_builder, "original_uri");
  json_builder_set_string_value (metadata_builder, original_uri);

  json_builder_begin_array (sets_array_builder);

  /* Build up the JsonArray for the sets */
  for (; sets_index < sets->length; ++sets_index)
    {
      g_autoptr(JsonBuilder) set_builder = json_builder_new ();
      EknrBoxedSetInfo *set = g_ptr_array_index (sets, sets_index);

      json_builder_begin_object (set_builder);

      json_builder_set_member_name (set_builder, "id");
      json_builder_set_string_value (set_builder, set->id);

      json_builder_set_member_name (set_builder, "title");
      json_builder_set_string_value (set_builder, set->title);

      json_builder_set_member_name (set_builder, "featured");
      json_builder_set_boolean_value (set_builder, set->featured);

      json_builder_end_object (set_builder);

      json_builder_add_value (sets_array_builder,
                              json_builder_get_node (set_builder));
    }

  json_builder_end_array (sets_array_builder);

  json_builder_set_member_name (metadata_builder, "sets");
  json_builder_set_value (metadata_builder, json_builder_get_node (sets_array_builder));

  json_builder_end_object (metadata_builder);

  /* Stringify */
  node = json_builder_get_root (builder);
  generator = json_generator_new ();

  json_generator_set_root (node);
  json_string = json_generator_to_data (generator, NULL);

  return g_variant_new_string (json_string);
}

static gchar *
get_wrapper_share_button_markup (const gchar *network_name,
                                 GError **error)
{
  g_autofree gchar *svg_file_path = g_strdup_printf ("resource:///com/endlessm/knowledge/data/icons/scalable/apps/%s-symbolic.svg", network_name);
  g_autoptr(GFile) svg_file = g_file_new_for_uri (svg_file_path);

  if (!g_file_load_contents (svg_file, NULL, &contents, NULL, NULL, error))
    return NULL;

  return g_strdup_printf ("<a class=\"share-action\"\n"
                          "  onclick=\"window.webkit.messageHandlers.share_on_%s.postMessage(0)\">\n"
                          "%s\n"
                          "</a>\n");
}

static gchar *
get_wrapper_share_actions_markup (const gchar  *original_uri,
                                  GError      **error)
{
  g_autofree gchar *facebook = NULL;
  g_autofree gchar *twitter = NULL;
  g_autofree gchar *whatsapp = NULL;

  if (original_uri == NULL || g_strncmp (original_uri, "", 0) == 0)
    return "";

  facebook = get_wrapper_share_button_markup ("facebook");

  if (facebook == NULL)
    return NULL;

  twitter = get_wrapper_share_button_markup ("twitter");

  if (twitter == NULL)
    return NULL;

  whatsapp = get_wrapper_share_button_markup ("whatsapp");

  if (whatsapp == NULL)
    return NULL;

  return g_strdup_printf ("<div id=\"default-share-actions\" style=\"visibility: hidden;\">%s%s%s</div>",
                          facebook,
                          twitter,
                          whatsapps);
}

static gchar *
eknr_renderer_render_wrapper (EknrRenderer                       *renderer,
                              const gchar                        *content,
                              const gchar                        *ekn_id,
                              const gchar                        *title,
                              const gchar                        *published,
                              const gchar * const                *authors,
                              const gchar *                      *license,
                              const gchar                        *source,
                              const gchar                        *source_name,
                              const gchar                        *original_uri,
                              const gchar * const                *tags,
                              GHashTable                         *set_map,
                              const gchar * const                *outgoing_links,
                              EknrOutgoingLinkDeterminationFunc   determination_func,
                              gpointer                            user_data,
                              const gchar * const                *custom_css_files,
                              const gchar * const                *override_css_files,
                              GError                            **error)
{
  g_autoptr(GFile) file = template_file("article-wrapper.mst");
  GVariantDict vardict;
  g_autoptr(GVariant) variant = NULL;

  GVariant *share_actions_markup_variant = get_wrapper_share_actions_markup (original_uri,
                                                                             error);

  if (share_actions_markup == NULL)
    return NULL;

  g_variant_dict_init (&vardict, NULL);

  g_variant_dict_insert_value (&vardict, "id", ekn_id);
  g_variant_dict_insert_value (&vardict, "css-files", get_wrappper_css_files (custom_css_files));
  g_variant_dict_insert_value (&vardict, "custom-css-files", override_css_files);
  g_variant_dict_insert_value (&vardict, "javascript-files", get_wrapper_js_files ());
  g_variant_dict_insert_value (&vardict, "copy-button-text", _("Copy"));
  g_variant_dict_insert_value (&vardict, "share-actions", share_actions_markup_variant);
  g_variant_dict_insert_value (&vardict, "content", content);
  g_variant_dict_insert_value (&vardict, "crosslink-data", get_wrapper_outgoing_links_json (outgoing_links,
                                                                                            determination_func,
                                                                                            error));
  g_variant_dict_insert_value (&vardict, "chunk-data", get_wrapper_chunk_data_json (tags, set_map));
  g_variant_dict_insert_value (&vardict, "content-metadata", get_wrapper_metadata (ekn_id,
                                                                                   title,
                                                                                   published,
                                                                                   authors,
                                                                                   license,
                                                                                   source,
                                                                                   source_name,
                                                                                   original_uri,
                                                                                   tags,
                                                                                   set_map));

  variant = g_variant_dict_end (&vardict);

  return eknr_renderer_render_mustache_document_from_file (renderer,
                                                           file,
                                                           variant,
                                                           error);
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

EknrBoxedSetInfo *
eknr_boxed_set_info_new (gboolean             featured,
                         const gchar         *ekn_id,
                         const gchar         *title,
                         const gchar * const *child_tags.
                         const gchar * const *tags)
{
  EknrBoxedSetInfo *set = g_new0 (EknrBoxedSetInfo, 1);

  set->ref_count = 1;
  set->featured = featured;
  set->ekn_id = g_strdup (ekn_id);
  set->title = g_strdup (title);
  set->child_tags = g_strdupv (child_tags);
  set->tags = g_strdupv (tags);

  return set;
}

EknrBoxedSetInfo *
eknr_boxed_set_info_copy (EknrBoxedSetInfo *set)
{
  return ekrn_boxed_set_info_new (set->featured,
                                  set->ekn_id,
                                  set->title,
                                  set->child_Tags,
                                  set->tags);
}

EknrBoxedSetInfo *
eknr_boxed_set_info_ref (EknrBoxedSetInfo *set)
{
  ++set->ref_count;
  return set;
}

void
eknr_boxed_set_info_unref (EknrBoxedSetInfo *set)
{
  --set->ref_count;

  if (set->ref_count > 0)
    return;

  g_clear_pointer (&set->ekn_id, g_free);
  g_clear_pointer (&set->title, g_free);
  g_clear_pointer (&set->child_tags, g_strfreev);
  g_clear_pointer (&set->tags, g_strfreev);

  g_free (set);
}

/* Boxed type registration for EknrBoxedSetInfo */
GType
eknr_boxed_set_info_get_type (void)
{
  static GType type_id = 0;

  if (!type_id)
    type_id = g_boxed_register_static (g_intern_static_string ("EknrBoxedSetInfo"),
                                       (GBoxedCopyFunc) eknr_boxed_set_info_copy,
                                       (BoxedFreeFunc) eknr_boxed_set_info_free));

  return type_id;
}

GQuark
eknr_error (void)
{
  return g_quark_from_static_string ("eknr-error");
}

G_DEFINE_QUARK (eknr-error, eknr_error)
