/* -*- mode: C; c-file-style: "gnu"; indent-tabs-mode: nil; -*- */

/* Copyright (C) 2014-2016 Endless Mobile, Inc. */

#ifndef EKN_UTIL_H
#define EKN_UTIL_H

#if !(defined(_EKN_INSIDE_EOSKNOWLEDGE_H) || defined(COMPILING_EOS_KNOWLEDGE))
#error "Please do not include this header file directly."
#endif

#include "ekn-types.h"

#include <math.h>

#include <gtk/gtk.h>
#include <gdk/gdkpixbuf.h>
#include <webkit2/webkit2.h>

G_BEGIN_DECLS

EKN_AVAILABLE_IN_0_0
GdkWindow *ekn_private_new_input_output_window (GtkWidget *widget);

EKN_AVAILABLE_IN_0_0
gboolean ekn_param_spec_is_enum (GParamSpec *pspec);

EKN_AVAILABLE_IN_0_0
gboolean ekn_param_spec_enum_value_from_string (GParamSpecEnum *pspec,
                                                const gchar *name,
                                                gint *value);

EKN_AVAILABLE_IN_0_0
gfloat ekn_widget_style_get_float (GtkWidget *widget,
                                   const gchar *name);

EKN_AVAILABLE_IN_0_0
gint ekn_widget_style_get_int (GtkWidget *widget,
                               const gchar *name);

EKN_AVAILABLE_IN_0_4
gchar* ekn_extract_pixbuf_dominant_color (GdkPixbuf *pixbuf);

EKN_AVAILABLE_IN_0_4
GParamSpec **ekn_interface_gtype_list_properties(GType     gtype,
                                                 unsigned *n_properties_returned);

G_END_DECLS

#endif /* EKN_UTIL_H */
