/* -*- mode: C; c-file-style: "gnu"; indent-tabs-mode: nil; -*- */

/* Copyright 2014 Endless Mobile, Inc. */

#ifndef EKN_UTIL_H
#define EKN_UTIL_H

#if !(defined(_EKN_INSIDE_EOSKNOWLEDGE_H) || defined(COMPILING_EOS_KNOWLEDGE))
#error "Please do not include this header file directly."
#endif

#include <math.h>

#include <gtk/gtk.h>
#include <gdk/gdkpixbuf.h>
#include <webkit2/webkit2.h>

G_BEGIN_DECLS

GdkWindow *ekn_private_new_input_output_window (GtkWidget *widget);

gboolean ekn_param_spec_is_enum (GParamSpec *pspec);

gboolean ekn_param_spec_enum_value_from_string (GParamSpecEnum *pspec,
                                                const gchar *name,
                                                gint *value);

gint ekn_style_context_get_int (GtkStyleContext *context,
                                const gchar *name,
                                GtkStateFlags state);

gfloat ekn_style_context_get_float (GtkStyleContext *context,
                                    const gchar *name,
                                    GtkStateFlags state);

const gchar * ekn_style_context_get_string (GtkStyleContext *context,
                                            const gchar *name,
                                            GtkStateFlags state);

gint ekn_style_context_get_custom_int (GtkStyleContext *context,
                                       const gchar *name);

gfloat ekn_style_context_get_custom_float (GtkStyleContext *context,
                                           const gchar *name);

const gchar * ekn_style_context_get_custom_string (GtkStyleContext *context,
                                                   const gchar *name);

gchar* ekn_extract_pixbuf_dominant_color (GdkPixbuf *pixbuf);

GParamSpec **ekn_interface_gtype_list_properties(GType     gtype,
                                                 unsigned *n_properties_returned);

gboolean ekn_vfs_set_shards (GSList *shards);

G_END_DECLS

#endif /* EKN_UTIL_H */
