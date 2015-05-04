#include <config.h>
#include <locale.h>
#include <glib/gi18n.h>
#include <gmodule.h>
#include <gio/gio.h>
#include <webkit2/webkit-web-extension.h>
#include <JavaScriptCore/JSContextRef.h>
#include <JavaScriptCore/JSObjectRef.h>
#include <JavaScriptCore/JSStringRef.h>

static JSValueRef
underscore_gettext_callback (JSContextRef     ctx,
                             JSObjectRef      function,
                             JSObjectRef      this_object,
                             size_t           argument_count,
                             const JSValueRef arguments[],
                             JSValueRef      *exception)
{
  if (argument_count != 1)
    {
      JSStringRef error_message =
        JSStringCreateWithUTF8CString ("Wrong number of arguments to _(), "
                                       "should be one.");
      *exception = JSValueMakeString (ctx, error_message); /* takes ownership */
      return;
    }

  JSStringRef message_js = JSValueToStringCopy (ctx, arguments[0], exception);
  if (message_js == NULL)
    return NULL; /* re-throws exception */

  size_t buffer_size = JSStringGetMaximumUTF8CStringSize (message_js);
  char *message = g_new (char, buffer_size);
  JSStringGetUTF8CString (message_js, message, buffer_size);
  JSStringRelease (message_js);

  /* Return value of gettext() should be treated as const char * */
  const char *translated_message = gettext (message);

  JSValueRef retval =
    JSValueMakeString (ctx, JSStringCreateWithUTF8CString (translated_message));

  /* Gettext returns the same string (no copy) if no translation was available,
  so we only free message now, in case it was needed to copy into the JS value */
  g_free (message);

  return retval;
}

static void
setup_window_object (WebKitScriptWorld *world,
                     WebKitWebPage     *page,
                     WebKitFrame       *frame)
{
  JSGlobalContextRef ctx =
    webkit_frame_get_javascript_context_for_script_world (frame, world);
  JSStringRef function_name = JSStringCreateWithUTF8CString ("_");
  JSObjectRef underscore_function =
    JSObjectMakeFunctionWithCallback (ctx, function_name,
                                      underscore_gettext_callback);

  JSObjectRef window = JSContextGetGlobalObject (ctx);
  JSValueRef exception = NULL;
  JSObjectSetProperty (ctx, window, function_name, underscore_function,
                       kJSPropertyAttributeReadOnly |
                        kJSPropertyAttributeDontEnum |
                        kJSPropertyAttributeDontDelete,
                      &exception);
  if (exception != NULL)
    g_critical ("Could not define a _() function on the browser's window "
                "object. Translations will not work.");

  JSStringRelease (function_name);
}

G_MODULE_EXPORT void
webkit_web_extension_initialize (WebKitWebExtension *extension)
{
  setlocale(LC_ALL, "");
  bindtextdomain(GETTEXT_PACKAGE, LOCALEDIR);
  textdomain(GETTEXT_PACKAGE);

  g_signal_connect (webkit_script_world_get_default (), "window-object-cleared",
                    G_CALLBACK (setup_window_object), NULL);
}
