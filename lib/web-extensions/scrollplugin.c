#include <gio/gio.h>
#include <glib.h>
#include <glib-object.h>
#include <webkit2/webkit-web-extension.h>
#include <webkitdom/webkitdom.h>

#define BUS_INTERFACE_NAME "com.endlessm.Knowledge.WebviewScroll"
#define BUS_SIGNAL_NAME "ScrollChanged"
#define EXTENSION_EXTRA_DATA_KEY "_scroll_plugin_extension_data"
#define PAGE_EXTRA_DATA_KEY "_scroll_plugin_page_data"

typedef struct {
  WebKitWebExtension *extension;
  guint64 id;
} ExtensionAndId;

static gchar *
get_object_path (guint64 id) {
  return g_strdup_printf("/com/endlessm/webview/%" G_GUINT64_FORMAT, id);
}

static gboolean
signal_scroll (WebKitDOMDocument *document,
               WebKitDOMEvent    *event,
               ExtensionAndId    *data)
{
  GDBusConnection *connection = g_object_get_data (G_OBJECT (data->extension),
                                                   EXTENSION_EXTRA_DATA_KEY);
  if (!connection)
    return FALSE;

  WebKitDOMElement *body = WEBKIT_DOM_ELEMENT (webkit_dom_document_get_body (document));

  gint max_scroll_height = webkit_dom_element_get_scroll_height (body) -
    (gint) webkit_dom_element_get_client_height (body);
  gint max_scroll_width = webkit_dom_element_get_scroll_width (body) -
    (gint) webkit_dom_element_get_client_width (body);

  GVariant *params = g_variant_new ("((i)(i)(i)(i))",
    webkit_dom_element_get_scroll_top (body),
    max_scroll_height,
    webkit_dom_element_get_scroll_left (body),
    max_scroll_width);

  g_autofree gchar *object_path = get_object_path (data->id);

  GError *error = NULL;
  g_dbus_connection_emit_signal (connection,
                                 NULL,
                                 object_path,
                                 BUS_INTERFACE_NAME,
                                 BUS_SIGNAL_NAME,
                                 params,
                                 &error);

  if (error)
    g_critical ("Unable to signal scroll change: %s\n", error->message);

  return FALSE;
}

static void
on_document_loaded (WebKitWebPage  *page,
                    ExtensionAndId *data)
{
  WebKitDOMDocument *document = webkit_web_page_get_dom_document (page);

  webkit_dom_event_target_add_event_listener (WEBKIT_DOM_EVENT_TARGET (document),
                                              "scroll",
                                              G_CALLBACK (signal_scroll),
                                              FALSE,
                                              data);

  // Always let the client know about the scroll status
  signal_scroll (document, NULL, data);
}

static void
on_page_created (WebKitWebExtension   *extension,
                 WebKitWebPage        *page)
{
  ExtensionAndId *data = g_new0 (ExtensionAndId, 1);
  data->extension = extension;
  data->id = webkit_web_page_get_id (page);
  // Attach our data to the page, so it will get freed when the page is destroyed
  g_object_set_data_full (G_OBJECT (page), PAGE_EXTRA_DATA_KEY, data, g_free);

  g_signal_connect (page, "document-loaded", G_CALLBACK (on_document_loaded), data);
}

static void
on_bus_acquired (GDBusConnection      *connection,
                 const gchar          *name,
                 WebKitWebExtension   *extension)
{
  g_object_set_data (G_OBJECT (extension), EXTENSION_EXTRA_DATA_KEY, connection);
}

void
webkit_web_extension_initialize_with_user_data (WebKitWebExtension *extension,
                                                const GVariant     *data_from_app)
{
  const gchar *well_known_name = g_variant_get_string ((GVariant *) data_from_app,
                                                       NULL);

  g_signal_connect (extension, "page-created",
                    G_CALLBACK (on_page_created), NULL);

  g_bus_own_name (G_BUS_TYPE_SESSION,
                  well_known_name,
                  G_BUS_NAME_OWNER_FLAGS_NONE,
                  (GBusAcquiredCallback) on_bus_acquired,
                  NULL,
                  NULL,
                  extension,
                  NULL);
}
