#include <gio/gio.h>
#include <glib.h>
#include <gmodule.h>
#include <webkit2/webkit-web-extension.h>

void
webkit_web_extension_initialize_with_user_data (WebKitWebExtension *extension,
                                                const GVariant     *data_from_app)
{
  g_autoptr(GVariantIter) app_resources_iter = NULL;
  const gchar *app_resource_path;

  g_variant_get ((GVariant *) data_from_app, "(sas)", NULL, &app_resources_iter);
  while (g_variant_iter_loop (app_resources_iter, "s", &app_resource_path))
    {
      GResource *app_resource = g_resource_load (app_resource_path, NULL);
      g_resources_register (app_resource);
      g_resource_unref (app_resource);
    }

  gchar *resource_path = g_build_filename (PKGDATADIR, "eos-knowledge.gresource", NULL);
  GResource *resource = g_resource_load (resource_path, NULL);
  g_resources_register (resource);
  g_resource_unref (resource);
  g_free (resource_path);
}
