#include "config.h"
#include "ekn-util.h"

/**
 * ekn_private_new_input_output_window:
 * @widget: the widget to create the window for
 *
 * Creates a new #GdkWindow for a #GtkWidget which will both receive events
 * and are display to the screen. Respects the value of gtk_widget_get_events.
 * Needed in C as GdkWindowAttr is not currently introspectable. This can go
 * away when https://bugzilla.gnome.org/show_bug.cgi?id=727801 is fixed.
 *
 * Returns: (transfer full): A #GdkWindow the widget can use with
 * gtk_widget_set_window()
 */
GdkWindow *
ekn_private_new_input_output_window (GtkWidget *widget)
{
  GtkAllocation allocation;
  gtk_widget_get_allocation (widget,
                             &allocation);
  GdkWindowAttr attributes = {
    .x = allocation.x,
    .y = allocation.y,
    .width = allocation.width,
    .height = allocation.height,
    .window_type = GDK_WINDOW_CHILD,
    .event_mask = gtk_widget_get_events (widget),
    .wclass = GDK_INPUT_OUTPUT,
    .visual = gtk_widget_get_visual (widget)
  };
  gint attributes_mask = GDK_WA_X | GDK_WA_Y | GDK_WA_VISUAL;
  return gdk_window_new (gtk_widget_get_parent_window (widget),
                         &attributes, attributes_mask);
}

/**
 * ekn_param_spec_is_enum:
 * @pspec: a GParamSpec
 *
 * The param spec type macros don't introspect well, so this helper wraps the
 * usual macro to check if a param spec is for an enum type.
 */
gboolean
ekn_param_spec_is_enum (GParamSpec *pspec)
{
  return G_IS_PARAM_SPEC_ENUM (pspec);
}

/**
 * ekn_param_spec_enum_value_from_string:
 * @pspec: a GParamSpecEnum
 * @name: either a enum name or nick for the param spec
 * @value: (out) (allow-none): the integer enum value
 *
 * Enum classes and values also introspect poorly. This helper takes an enum
 * param spec and a name of an enum value and converts that to a integer enum
 * value.
 *
 * Returns: true if a value was parsed successfully.
 */
gboolean
ekn_param_spec_enum_value_from_string (GParamSpecEnum *pspec, const gchar *name, gint *value)
{
  GEnumValue *enum_value = NULL;
  enum_value = g_enum_get_value_by_name (pspec->enum_class, name);
  if (!enum_value)
    enum_value = g_enum_get_value_by_nick (pspec->enum_class, name);
  if (enum_value)
    {
      *value = enum_value->value;
      return TRUE;
    }
  return FALSE;
}

/**
 * ekn_widget_style_get_float:
 * @name: style property name
 *
 * Calls the non-introspectable varargs function gtk_widget_style_get to read a
 * floating point value from a style property.
 */
gfloat
ekn_widget_style_get_float (GtkWidget *widget, const gchar *name)
{
  gfloat ret;
  gtk_widget_style_get (widget, name, &ret, NULL);
  return ret;
}

/**
 * ekn_widget_style_get_int:
 * @name: style property name
 *
 * Calls the non-introspectable varargs function gtk_widget_style_get to read a
 * integer point value from a style property.
 */
gint
ekn_widget_style_get_int (GtkWidget *widget, const gchar *name)
{
  gint ret;
  gtk_widget_style_get (widget, name, &ret, NULL);
  return ret;
}
