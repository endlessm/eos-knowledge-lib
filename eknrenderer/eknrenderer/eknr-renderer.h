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
  EKNR_ERROR_HTML_ESCAPE_FAILED,
  EKNR_ERROR_UNKNOWN_LEGACY_SOURCE
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
                              GError       **error);

typedef gboolean (*EknrOutgoingLinkDeterminationFunc) (const gchar *outgoing_link,
                                                       gpointer     user_data);

typedef struct _EknrBoxedSetInfo {
  guint    ref_count;
  gboolean featured;
  gchar    *ekn_id;
  gchar    *title;
  GStrv    child_tags;
  GStrv    tags;
} EknrBoxedSetInfo;

EknrRenderer * eknr_renderer_new (void);

G_END_DECLS
