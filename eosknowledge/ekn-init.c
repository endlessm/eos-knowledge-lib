/* -*- mode: C; c-file-style: "gnu"; indent-tabs-mode: nil; -*- */

/* Copyright 2014 Endless Mobile, Inc. */

#include <config.h>
#include <glib.h>
#include <glib/gi18n-lib.h>
#include <clutter-gst/clutter-gst.h>
#include <clutter-gtk/clutter-gtk.h>

#include "ekn-init-private.h"

/* Constructors supported since GCC 2.7; I have this on GLib's authority. This
should also work on Clang. */
#if __GNUC__ > 2 || (__GNUC__ == 2 && __GNUC_MINOR__ >= 7)

#define _EKN_CONSTRUCTOR(func) static void __attribute__((constructor)) func (void)
#define _EKN_DESTRUCTOR(func) static void __attribute__((destructor)) func (void)

#else

#error "We do not currently support constructors for your compiler."

#endif /* compiler version */

static gboolean _ekn_initialized = FALSE;

/*
 * _ekn_init:
 *
 * This function initializes the library. It is called automatically when the
 * library is loaded.
 */
_EKN_CONSTRUCTOR(_ekn_init);
static void
_ekn_init (void)
{
  if (G_UNLIKELY (!_ekn_initialized))
    {
      /* Initialize Gettext */
      bindtextdomain (GETTEXT_PACKAGE, LOCALEDIR);
      bind_textdomain_codeset (GETTEXT_PACKAGE, "UTF-8");

      if (gtk_clutter_init (NULL, NULL) != CLUTTER_INIT_SUCCESS)
        g_critical ("GTK Clutter could not be initialized!");
      if (clutter_gst_init (NULL, NULL) != CLUTTER_INIT_SUCCESS)
        g_critical ("Clutter GST could not be initialized!");

      _ekn_initialized = TRUE;
    }
}

/*
 * ekn_is_inited:
 *
 * For testing purposes.
 */
gboolean
ekn_is_inited (void)
{
  return _ekn_initialized;
}
