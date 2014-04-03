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
