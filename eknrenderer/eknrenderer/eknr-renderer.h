/* Copyright 2018 Endless Mobile, Inc. */

#pragma once

#include <gio/gio.h>
#include <glib-object.h>

G_BEGIN_DECLS

#define EKNR_TYPE_RENDERER eknr_renderer_get_type ()
G_DECLARE_FINAL_TYPE (EknrRenderer, eknr_renderer, EKNR, RENDERER, GObject)

/**
 * EKNR_ERROR:
 *
 * Error doamin for Eknr.
 */
#define EKNR_ERROR (eknr_error ())

GQuark eknr_error (void);

/**
 * EknrError:
 * @EKNR_ERROR_SUBSTITUTION_FAILED: Template substitution failed
 * @EKNR_ERROR_HTML_ESCAPE_FAILED: HTML escaping failed
 *
 * Error codes for the %EKNR_ERROR error domain
 */
typedef enum {
  EKNR_ERROR_SUBSTITUTION_FAILED,
  EKNR_ERROR_HTML_ESCAPE_FAILED
} EknrError;

gchar * eknr_renderer_render_mustache_document (EknrRenderer *renderer,
                                                const gchar  *tmpl_text,
                                                GVariant     *variables,
                                                GError      **error);

gchar *
eknr_renderer_render_mustache_document_from_file (EknrRenderer *renderer,
                                                  GFile        *file,
                                                  GVariant     *variables,
                                                  GError      **error);

gchar * eknr_escape_html (const gchar  *html,
                          GError      **error);

gboolean eknr_mustache_template_compiles (const gchar  *tmpl_text,
                                          GError      **error);

EknrRenderer * eknr_renderer_new (void);

G_END_DECLS
