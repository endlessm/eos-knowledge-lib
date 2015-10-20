#include "config.h"
#include "ekn-hello.h"

#include <glib.h>
#include <glib/gi18n-lib.h>

/**
 * SECTION:hello
 * @short_description: Stub
 * @title: Hello
 *
 * Stub.
 */

/**
 * ekn_hello_c:
 *
 * Stub.
 */
void
ekn_hello_c (void)
{
  g_print ("%s\n", ekn_hello_c_provider_get_greeting ());
}

/**
 * ekn_hello_c_provider_get_greeting:
 *
 * Stub.
 *
 * Returns: stub.
 */
const gchar *
ekn_hello_c_provider_get_greeting (void)
{
  return _("Hello C world!");
}
