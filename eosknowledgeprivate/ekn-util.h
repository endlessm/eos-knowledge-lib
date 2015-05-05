/* -*- mode: C; c-file-style: "gnu"; indent-tabs-mode: nil; -*- */

/* Copyright 2014 Endless Mobile, Inc. */

#ifndef EKN_UTIL_H
#define EKN_UTIL_H

#if !(defined(_EKN_INSIDE_EOSKNOWLEDGE_H) || defined(COMPILING_EOS_KNOWLEDGE))
#error "Please do not include this header file directly."
#endif

#include "ekn-types.h"

#include <gtk/gtk.h>
#include <webkit2/webkit2.h>

G_BEGIN_DECLS

EKN_AVAILABLE_IN_0_0
GdkWindow *ekn_private_new_input_output_window (GtkWidget *widget);

EKN_AVAILABLE_IN_0_0
void ekn_private_register_global_uri_scheme (const gchar *scheme,
                                             WebKitURISchemeRequestCallback callback,
                                             gpointer user_data,
                                             GDestroyNotify notify);

G_END_DECLS

#endif /* EKN_UTIL_H */
