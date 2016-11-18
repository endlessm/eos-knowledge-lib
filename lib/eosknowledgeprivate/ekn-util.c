#include "config.h"
#include "ekn-util.h"
#include <eos-shard/eos-shard-shard-file.h>

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

static void
ekn_style_context_convert_property_value (GtkStyleContext *context,
                                          const gchar *name,
                                          GtkStateFlags state,
                                          GValue *dest_value)
{
  GValue value = G_VALUE_INIT;
  gtk_style_context_get_property (context, name, state, &value);
  if (g_value_type_transformable (G_VALUE_TYPE (dest_value), G_VALUE_TYPE (&value)))
    g_value_transform (&value, dest_value);
  else
    g_warning ("Can't convert %s value to type %s\n", name, G_VALUE_TYPE_NAME (dest_value));
}

/**
 * ekn_style_context_get_int:
 * @context: the style context
 * @name: the style property name
 * @state: the widget state flags to query for
 *
 * Introspection workaround. Queries a widget's style context for a gtk css
 * property and returns an int. Make sure the style you are querying for
 * actually has an integer value.
 */
gint
ekn_style_context_get_int (GtkStyleContext *context,
                           const gchar *name,
                           GtkStateFlags state)
{
  GValue value = G_VALUE_INIT;
  g_value_init (&value, G_TYPE_INT);
  ekn_style_context_convert_property_value (context, name, state, &value);
  return g_value_get_int (&value);
}

/**
 * ekn_style_context_get_float:
 * @context: the style context
 * @name: the style property name
 * @state: the widget state flags to query for
 *
 * Introspection workaround. Queries a widget's style context for a gtk css
 * property and returns a float. Make sure the style you are querying for
 * actually has an floating point value.
 */
gfloat
ekn_style_context_get_float (GtkStyleContext *context,
                             const gchar *name,
                             GtkStateFlags state)
{
  GValue value = G_VALUE_INIT;
  g_value_init (&value, G_TYPE_FLOAT);
  ekn_style_context_convert_property_value (context, name, state, &value);
  return g_value_get_float (&value);
}

/**
 * ekn_style_context_get_string:
 * @context: the style context
 * @name: the style property name
 * @state: the widget state flags to query for
 *
 * Introspection workaround. Queries a widget's style context for a gtk css
 * property and returns a string. Make sure the style you are querying for
 * actually has an string value.
 */
const gchar *
ekn_style_context_get_string (GtkStyleContext *context,
                              const gchar *name,
                              GtkStateFlags state)
{
  // FIXME: return transfer value.
  GValue value = G_VALUE_INIT;
  g_value_init (&value, G_TYPE_STRING);
  ekn_style_context_convert_property_value (context, name, state, &value);
  return g_value_get_string (&value);
}

/**
 * ekn_style_context_get_custom_int:
 * @context: the style context
 * @name: the style property name
 *
 * Introspection workaround. Queries a widget's style context for a custom
 * widget style property and returns an int. Make sure the style you are
 * querying for actually has an integer value.
 */
gint
ekn_style_context_get_custom_int (GtkStyleContext *context,
                                  const gchar *name)
{
  GValue value = G_VALUE_INIT;
  g_value_init (&value, G_TYPE_INT);
  gtk_style_context_get_style_property (context, name, &value);
  return g_value_get_int (&value);
}

/**
 * ekn_style_context_get_custom_float:
 * @context: the style context
 * @name: the style property name
 *
 * Introspection workaround. Queries a widget's style context for a custom
 * widget style property and returns a float. Make sure the style you are
 * querying for actually has a float value.
 */
gfloat
ekn_style_context_get_custom_float (GtkStyleContext *context,
                                    const gchar *name)
{
  GValue value = G_VALUE_INIT;
  g_value_init (&value, G_TYPE_FLOAT);
  gtk_style_context_get_style_property (context, name, &value);
  return g_value_get_float (&value);
}

/**
 * ekn_style_context_get_custom_string:
 * @context: the style context
 * @name: the style property name
 *
 * Introspection workaround. Queries a widget's style context for a custom
 * widget style property and returns a string. Make sure the style you are
 * querying for actually has a string value.
 */
const gchar *
ekn_style_context_get_custom_string (GtkStyleContext *context,
                                     const gchar *name)
{
  GValue value = G_VALUE_INIT;
  g_value_init (&value, G_TYPE_STRING);
  gtk_style_context_get_style_property (context, name, &value);
  return g_value_get_string (&value);
}

/**
 * ekn_extract_pixbuf_dominant_color:
 * @pixbuf: a #GdkPixbuf
 *
 * Extracts the dominant color from the GdkPixbuf.
 *
 * Returns: a string with the color in Hex format
 */
gchar*
ekn_extract_pixbuf_dominant_color (GdkPixbuf *pixbuf)
{
  const guint8 *pixels, *pixel;
  const gint skip_x = 10, skip_y = 10, alpha_threshold = 40;
  const gdouble rgb_range = 255.0, hue_range = 359.0, sv_threshold = 0.3;
  gdouble r, g, b, h, s, v;
  gint channels, height, width, rowstride, y = 0, x = 0, hue, max_hue = 0;
  gboolean has_alpha;
  gint hues[360] = {0};
  gdouble sats[360] = {0};
  gdouble vals[360] = {0};

  g_return_val_if_fail (gdk_pixbuf_get_colorspace (pixbuf) == GDK_COLORSPACE_RGB, NULL);
  g_return_val_if_fail (gdk_pixbuf_get_bits_per_sample (pixbuf) == 8, NULL);

  height = gdk_pixbuf_get_height (pixbuf);
  width = gdk_pixbuf_get_width (pixbuf);
  rowstride = gdk_pixbuf_get_rowstride (pixbuf);
  channels = gdk_pixbuf_get_n_channels (pixbuf);
  pixels = gdk_pixbuf_read_pixels (pixbuf);
  has_alpha = gdk_pixbuf_get_has_alpha (pixbuf);

  while (y < height)
    {
      pixel = pixels + (y * rowstride) + (x * channels);

      r = pixel[0] / rgb_range;
      g = pixel[1] / rgb_range;
      b = pixel[2] / rgb_range;

      gtk_rgb_to_hsv (r, g, b, &h, &s, &v);

      /* Only consider pixels that are not too dark and not too transparent */
      if (s > sv_threshold &&
          v > sv_threshold &&
          !(has_alpha && pixel[3] < alpha_threshold))
        {
          hue = (gint) floor (h * hue_range);
          hues[hue] += 1;
          sats[hue] += s;
          vals[hue] += v;

          if (hues[hue] > hues[max_hue])
            max_hue = hue;
        }

      if (x + skip_x >= width)
        {
          x = 0;
          y += skip_y;
        }
      else
        {
          x += skip_x;
        }
    }

  /* If it didn't find the dominant color return a neutral color */
  if (G_UNLIKELY (!hues[max_hue]))
    return g_strdup ("#BBBCB6");

  /* Improve the color by averaging saturation and value */
  h = max_hue / hue_range;
  s = sats[max_hue] / hues[max_hue];
  v = vals[max_hue] / hues[max_hue];

  gtk_hsv_to_rgb (h, s, v, &r, &g, &b);
  return g_strdup_printf ("#%02X%02X%02X",
                          (gint) (r * rgb_range),
                          (gint) (g * rgb_range),
                          (gint) (b * rgb_range));
}

/**
 * ekn_interface_gtype_list_properties:
 * gtype: #GType ID for a GObject interface
 * n_properties_returned: (out): return location for array length
 *
 * List all the properties for the given interface type ID.
 * This is a wrapper because these functions don't return the right types in
 * GJS.
 * Call it like
 * `EosKnowledgePrivate.interface_gtype_list_properies(MyType.$gtype)`.
 *
 * Returns: (transfer container) (array length=n_properties_returned):
 *  an array of #GParamSpec with the interface's properties
 */
GParamSpec **
ekn_interface_gtype_list_properties(GType     gtype,
                                    unsigned *n_properties_returned)
{
  gpointer g_iface = g_type_default_interface_ref (gtype);
  GParamSpec **retval =
    g_object_interface_list_properties (g_iface, n_properties_returned);
  g_type_default_interface_unref (g_iface);
  return retval;
}

/**
 * ekn_vfs_set_shards:
 * @shards: (type GSList(EosShardShardFile)): a list of shard objects
 *
 * Set a list of shards in the default GVfs extension point where to lookup
 * ekn:// uris resources.
 *
 * Returns: TRUE on success, FALSE if an error occurred
 */
gboolean
ekn_vfs_set_shards (GSList *shards)
{
  GType shard_type = EOS_SHARD_TYPE_SHARD_FILE;
  GVfs *vfs = g_vfs_get_default ();
  GSList *l;

  if (g_strcmp0 (G_OBJECT_TYPE_NAME (vfs), "EknVfs"))
    {
      g_warning ("Default VFS is not a EknVfs, ekn:// uri wont be supported");
      return FALSE;
    }

  for (l = shards; l && l->data; l = g_slist_next (l))
    {
      if (!g_type_is_a (G_OBJECT_TYPE (l->data), shard_type))
        {
          g_warning ("%s is not a EosShardShardFile", G_OBJECT_TYPE_NAME (l->data));
          return FALSE;
        }

    }

  g_object_set (vfs, "shards", shards, NULL);

  return TRUE;
}
