#include <string.h>

#include <JavaScriptCore/JavaScript.h>
#include <webkit2/webkit-web-extension.h>
#include <webkitdom/webkitdom.h>

#define BUS_INTERFACE_NAME "com.endlessm.Knowledge.TooltipCoordinates"
#define OBJECT_PATH "/com/endlessm/webview"

typedef struct {
  guint bus_id;
  gchar *base_name;  /* owned */
  WebKitWebPage *page;  /* unowned */
} TooltipPluginContext;

static const gchar introspection_xml[] =
  "<node>"
    "<interface name='" BUS_INTERFACE_NAME "'>"
      "<method name='GetCoordinates'>"
        "<arg name='pointer_coordinates' type='(uu)' direction='in'/>"
        "<arg name='dom_element_rectangle' type='(uuuu)' direction='out'/>"
      "</method>"
    "</interface>"
  "</node>";

static void
tooltip_plugin_context_free (TooltipPluginContext *ctxt)
{
  g_clear_pointer (&ctxt->base_name, g_free);
  g_free (ctxt);
}

static JSObjectRef
get_object_property (JSContextRef js,
                     JSObjectRef  obj,
                     const char  *property_name)
{
  JSValueRef exc = NULL;
  JSStringRef property_string = JSStringCreateWithUTF8CString (property_name);
  JSValueRef value = JSObjectGetProperty (js, obj, property_string, &exc);
  JSStringRelease (property_string);
  if (exc != NULL)
    {
      g_critical ("Couldn't get property %s", property_name);
      return NULL;
    }
  JSObjectRef object_value = JSValueToObject (js, value, &exc);
  if (exc != NULL)
    {
      g_critical ("Property %s wasn't an object", property_name);
      return NULL;
    }
  return object_value;
}

static gboolean
get_number_property (JSContextRef js,
                     JSObjectRef  obj,
                     const char  *property_name,
                     double      *number)
{
  JSValueRef exc = NULL;
  JSStringRef property_string = JSStringCreateWithUTF8CString (property_name);
  JSValueRef value = JSObjectGetProperty (js, obj, property_string, &exc);
  JSStringRelease (property_string);
  if (exc != NULL)
    {
      g_critical ("Couldn't get property %s", property_name);
      return FALSE;
    }
  *number = JSValueToNumber (js, value, &exc);
  if (exc != NULL)
    {
      g_critical ("Property %s wasn't a number", property_name);
      return FALSE;
    }
  return TRUE;
}

static JSObjectRef
call_object_function (JSContextRef js,
                      JSObjectRef  function,
                      JSObjectRef  this_obj,
                      unsigned     argument_count,
                      JSValueRef   arguments[])
{
  JSValueRef exc = NULL;
  JSValueRef value = JSObjectCallAsFunction (js, function, this_obj,
                                             argument_count, arguments, &exc);
  if (exc != NULL)
    {
      g_critical ("Couldn't call function");
      return NULL;
    }
  JSObjectRef object = JSValueToObject (js, value, &exc);
  if (exc != NULL)
    {
      g_critical ("Return value of function wasn't an object");
      return NULL;
    }
  return object;
}

static void
on_method_call (GDBusConnection       *connection,
                const gchar           *sender,
                const gchar           *object_path,
                const gchar           *interface_name,
                const gchar           *method_name,
                GVariant              *parameters,
                GDBusMethodInvocation *invocation,
                WebKitWebPage         *page)
{
  guint x, y;

  if (strcmp (method_name, "GetCoordinates") != 0)
    {
      g_dbus_method_invocation_return_error (invocation, G_DBUS_ERROR,
                                             G_DBUS_ERROR_UNKNOWN_METHOD,
                                             "Unknown method %s invoked on interface %s",
                                             method_name, interface_name);
      return;
    }

  g_variant_get (parameters, "((uu))", &x, &y);

  WebKitFrame *frame = webkit_web_page_get_main_frame (page);
  JSGlobalContextRef js = webkit_frame_get_javascript_global_context (frame);

  JSObjectRef window = JSContextGetGlobalObject (js);
  JSObjectRef document = get_object_property (js, window, "document");
  if (document == NULL)
    goto fail;
  JSObjectRef element_from_point = get_object_property (js, document,
                                                        "elementFromPoint");
  if (element_from_point == NULL)
    goto fail;

  JSValueRef arguments[] = {
    JSValueMakeNumber (js, x),
    JSValueMakeNumber (js, y),
  };
  JSObjectRef element = call_object_function (js, element_from_point, document,
                                              2, arguments);
  if (element == NULL)
    goto fail;

  JSObjectRef get_client_rects = get_object_property (js, element,
                                                      "getClientRects");
  if (get_client_rects == NULL)
    goto fail;

  JSObjectRef rectlist = call_object_function (js, get_client_rects, element, 0,
                                               NULL);
  if (rectlist == NULL)
    goto fail;

  double num_rects, left, top, width, height;
  gboolean found = FALSE;
  if (!get_number_property (js, rectlist, "length", &num_rects))
    goto fail;
  for (int ix = 0; ix < (int) num_rects; ix++)
    {
      gchar *ix_string = g_strdup_printf ("%d", ix);
      JSObjectRef rect = get_object_property (js, rectlist, ix_string);
      g_free (ix_string);

      if (!get_number_property (js, rect, "left", &left)
          || !get_number_property (js, rect, "top", &top)
          || !get_number_property (js, rect, "width", &width)
          || !get_number_property (js, rect, "height", &height))
        goto fail;

      if (x >= left && x <= left + width && y >= top && y <= top + height)
        {
          found = TRUE;
          break;
        }
    }
  if (!found)
    g_critical ("There was no client rectangle containing the pointer "
                "coordinates.");

  /* Left and top can be negative if the element is scrolled partway off the
  screen. */
  GVariant *retval = g_variant_new ("((uuuu))",
                                    (unsigned) MAX(0, left),
                                    (unsigned) MAX(0, top),
                                    (unsigned) width, (unsigned) height);
  g_dbus_method_invocation_return_value (invocation, retval);
  /* Takes ownership of retval */
  return;

fail:
  g_dbus_method_invocation_return_error_literal (invocation, G_DBUS_ERROR,
                                                 G_DBUS_ERROR_FAILED,
                                                 "Something went wrong interfacing with JavaScriptCore");
}

static GDBusInterfaceVTable vtable = {
  (GDBusInterfaceMethodCallFunc) on_method_call,
  NULL,  /* get_property */
  NULL,  /* set_property */
};

static void
on_bus_acquired (GDBusConnection      *connection,
                 const gchar          *name,
                 TooltipPluginContext *ctxt)
{
  GError *error = NULL;
  g_autoptr (GDBusNodeInfo) node;
  GDBusInterfaceInfo *interface;

  node = g_dbus_node_info_new_for_xml (introspection_xml, &error);
  if (node == NULL)
    goto fail;
  interface = g_dbus_node_info_lookup_interface (node, BUS_INTERFACE_NAME);
  if (interface == NULL)
    goto fail;

  ctxt->bus_id = g_dbus_connection_register_object (connection,
                                                    OBJECT_PATH,
                                                    interface,
                                                    &vtable,
                                                    ctxt->page, NULL,
                                                    &error);
  if (ctxt->bus_id == 0)
    goto fail;

  return;

fail:
  if (error != NULL)
    {
      g_critical ("Error hooking up web extension DBus interface: %s",
                  error->message);
      g_clear_error (&error);
    }
  else
    {
      g_critical ("Unknown error hooking up web extension DBus interface");
    }
}

static void
on_name_lost (GDBusConnection      *connection,
              const gchar          *name,
              TooltipPluginContext *ctxt)
{
  if (connection == NULL) {
    g_error("Couldn't connect to DBus for name %s", name);
    return;
  }

  if (!g_dbus_connection_unregister_object (connection, ctxt->bus_id))
    g_critical ("Trouble unregistering object");
}

static void
on_page_created (WebKitWebExtension   *extension,
                 WebKitWebPage        *page,
                 TooltipPluginContext *ctxt)
{
  ctxt->page = page;

  /* The ID is known to the main process and the web process. So we can address
  a specific web page over DBus. */
  guint64 id = webkit_web_page_get_id (ctxt->page);
  gchar *well_known_name = g_strdup_printf ("%s-%" G_GUINT64_FORMAT,
                                            ctxt->base_name, id);

  g_bus_own_name (G_BUS_TYPE_SESSION,
                  well_known_name,
                  G_BUS_NAME_OWNER_FLAGS_NONE,
                  (GBusAcquiredCallback) on_bus_acquired,
                  NULL,
                  (GBusNameLostCallback) on_name_lost,
                  ctxt, (GDestroyNotify) tooltip_plugin_context_free);

  g_free (well_known_name);
}

void
webkit_web_extension_initialize_with_user_data (WebKitWebExtension *extension,
                                                const GVariant     *data_from_app)
{
  TooltipPluginContext *ctxt = g_new0 (TooltipPluginContext, 1);
  g_variant_get ((GVariant *) data_from_app, "(sas)", &ctxt->base_name, NULL);

  g_signal_connect (extension, "page-created", G_CALLBACK (on_page_created),
                    ctxt);
}
