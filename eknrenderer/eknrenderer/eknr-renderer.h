/* Copyright 2018 Endless Mobile, Inc. */

#pragma once

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
 *
 * Error codes for the %EKNR_ERROR error domain
 */
typedef enum {
  EKNR_ERROR_SUBSTITUTION_FAILED
} EknrError;

gchar * eknr_renderer_render_mustache_document (EknrRenderer *renderer,
                                                const gchar  *tmpl_text,
                                                GVariant     *variables,
                                                GError      **error);

EknrRenderer * eknr_renderer_new (void);

G_END_DECLS
