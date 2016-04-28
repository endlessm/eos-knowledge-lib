/* Copyright (C) 2016 Endless Mobile, Inc. */

#include <gio/gio.h>
#include <glib.h>
#include <gmodule.h>
#include <webkit2/webkit-web-extension.h>

G_MODULE_EXPORT void
webkit_web_extension_initialize (WebKitWebExtension *extension)
{
  gchar *resource_path = g_build_filename (PKGDATADIR, "eos-knowledge.gresource", NULL);
  GResource *resource = g_resource_load (resource_path, NULL);
  g_resources_register (resource);
  g_resource_unref (resource);
  g_free (resource_path);
}
