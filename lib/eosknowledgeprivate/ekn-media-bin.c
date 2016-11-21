/* -*- mode: C; c-file-style: "gnu"; indent-tabs-mode: nil; -*- */
/*
 * ekn-media-bin.c
 *
 * Copyright (C) 2016 Endless Mobile, Inc.
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
 *
 * Author: Juan Pablo Ugarte <ugarte@endlessm.com>
 *
 */

#include "ekn-media-bin.h"
#include <gst/gst.h>
#include <epoxy/gl.h>

#define AUTOHIDE_TIMEOUT_DEFAULT 2  /* Controls autohide timeout in seconds */

#define INFO_N_COLUMNS           6  /* Number of info columns labels */

#define EMB_ICON_SIZE            GTK_ICON_SIZE_BUTTON

#define EMB_ICON_NAME_PLAY       "ekn-media-bin-play"
#define EMB_ICON_NAME_PAUSE      "ekn-media-bin-pause"
#define EMB_ICON_NAME_FULLSCREEN "ekn-media-bin-fullscreen"
#define EMB_ICON_NAME_RESTORE    "ekn-media-bin-restore"

GST_DEBUG_CATEGORY_STATIC (ekn_media_bin_debug);
#define GST_CAT_DEFAULT ekn_media_bin_debug

struct _EknMediaBin
{
  GtkWindow parent;
};

typedef struct
{
  /* Properties */
  gchar   *uri;
  gint     autohide_timeout;
  gchar   *title;
  gchar   *description;

  /* Boolean properties */
  gboolean fullscreen:1;
  gboolean show_stream_info:1;

  /* We place extra flags here so the get squashed with the boolean properties */
  gboolean title_user_set:1;            /* True if the user set title property */
  gboolean description_user_set:1;      /* True if the user set description property */
  gboolean ignore_adjustment_changes:1;

  /* Internal Widgets */
  GtkWidget      *overlay;
  GtkWidget      *play_box;
  GtkButton      *playback_button;
  GtkImage       *playback_image;
  GtkScaleButton *volume_button;
  GtkButton      *fullscreen_button;
  GtkImage       *fullscreen_image;
  GtkWidget      *info_box;

  GtkLabel *title_label;
  GtkLabel *info_column_label[INFO_N_COLUMNS];
  GtkLabel *duration_label;

  /* Thanks to GSK all the blitting will be done in GL */
  GtkRevealer *top_revealer;
  GtkRevealer *bottom_revealer;

  GtkAdjustment  *playback_adjustment;

  /* Support Objects */
  GtkWindow *fullscreen_window;
  GdkCursor *blank_cursor;
  GtkWidget *tmp_image;      /* FIXME: remove this once we can derive from GtkBin in Glade */

  /* Internal variables */
  guint timeout_id;          /* Autohide timeout source id */
  gint  timeout_count;       /* Autohide timeout count since last move event */

  guint tick_id;             /* Widget frame clock tick callback (used to update UI) */
  GdkEventType pressed_button_type;

  /* Gst support */
  GstElement *play;          /* playbin element */
  GstElement *video_sink;    /* The video sink element used (gtkglsink or gtksink) */
  GstElement *vis_plugin;    /* The visualization plugin */
  GstBus     *bus;           /* playbin bus */

  GstTagList *audio_tags;
  GstTagList *video_tags;
  GstTagList *text_tags;

  GstQuery *position_query;  /* Used to query position more quicker */

  GstState state;            /* The desired state of the pipeline */
  gint64   duration;         /* Stream duration */
  guint    position;         /* Stream position in seconds */
} EknMediaBinPrivate;

enum
{
  PROP_0,

  PROP_URI,
  PROP_VOLUME,
  PROP_AUTOHIDE_TIMEOUT,
  PROP_FULLSCREEN,
  PROP_SHOW_STREAM_INFO,
  PROP_TITLE,
  PROP_DESCRIPTION,
  N_PROPERTIES
};

enum
{
  ERROR,
  LAST_SIGNAL
};

static GParamSpec *properties[N_PROPERTIES];
static guint ekn_media_bin_signals[LAST_SIGNAL] = { 0 };

G_DEFINE_TYPE_WITH_PRIVATE (EknMediaBin, ekn_media_bin, GTK_TYPE_BOX);

#define EMB_PRIVATE(d) ((EknMediaBinPrivate *) ekn_media_bin_get_instance_private(d))

static void         ekn_media_bin_init_playbin (EknMediaBin *self);
static GtkWindow   *ekn_media_bin_window_new (EknMediaBin *self);
static const gchar *format_time (gint time);

static inline gint64
ekn_media_bin_get_position (EknMediaBin *self)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);
  gint64 position;

  if (!gst_element_query (priv->play, priv->position_query))
    return 0;

  gst_query_parse_position (priv->position_query, NULL, &position);

  return position;
}

/* Action handlers */
static void
ekn_media_bin_toggle_playback (EknMediaBin *self)
{
  if (EMB_PRIVATE (self)->state == GST_STATE_PLAYING)
    ekn_media_bin_pause (self);
  else
    ekn_media_bin_play (self);
}

static void
ekn_media_bin_toggle_fullscreen (EknMediaBin *self)
{
  ekn_media_bin_set_fullscreen (self, !EMB_PRIVATE (self)->fullscreen);
}

static void
ekn_media_bin_reveal_controls (EknMediaBin *self)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);

  gdk_window_set_cursor (gtk_widget_get_window (priv->overlay), NULL);

  /* We only show the top bar if there is something in the info labels */
  if (!g_str_equal (gtk_label_get_label (priv->title_label), "") ||
      !g_str_equal (gtk_label_get_label (priv->info_column_label[0]), "") ||
      !g_str_equal (gtk_label_get_label (priv->info_column_label[2]), "") ||
      !g_str_equal (gtk_label_get_label (priv->info_column_label[4]), ""))
    gtk_revealer_set_reveal_child (priv->top_revealer, TRUE);

  gtk_revealer_set_reveal_child (priv->bottom_revealer, TRUE);
}

static gboolean
revealer_timeout (gpointer data)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (data);

  if (++priv->timeout_count < priv->autohide_timeout)
    return G_SOURCE_CONTINUE;

  gdk_window_set_cursor (gtk_widget_get_window (priv->overlay),
                         priv->blank_cursor);
  gtk_revealer_set_reveal_child (priv->top_revealer, FALSE);
  gtk_revealer_set_reveal_child (priv->bottom_revealer, FALSE);

  priv->timeout_id = 0;

  return G_SOURCE_REMOVE;
}

static void
ekn_media_bin_revealer_timeout (EknMediaBin *self, gboolean activate)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);

  if (activate)
    {
      /* Reset counter */
      priv->timeout_count = 0;

      if (!priv->timeout_id)
        priv->timeout_id = g_timeout_add_seconds (1, revealer_timeout, self);
    }
  else if (priv->timeout_id)
   {
      g_source_remove (priv->timeout_id);
      priv->timeout_id = 0;
   }
}

static void
ekn_media_bin_action_toggle (EknMediaBin *self, const gchar *action)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);

  if (g_str_equal (action, "playback"))
    ekn_media_bin_toggle_playback (self);
  else if (g_str_equal (action, "fullscreen"))
    ekn_media_bin_toggle_fullscreen (self);
  else if (g_str_equal (action, "show-stream-info"))
    {
      ekn_media_bin_set_show_stream_info (self, !priv->show_stream_info);
      ekn_media_bin_reveal_controls (self);
      ekn_media_bin_revealer_timeout (self, TRUE);
    }
  else
    g_warning ("Ignoring unknown toggle action %s", action);
}

static void
ekn_media_bin_action_seek (EknMediaBin *self, gint seconds)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);
  gint64 position = ekn_media_bin_get_position (self) + (seconds * GST_SECOND);

  gst_element_seek_simple (priv->play, GST_FORMAT_TIME,
                           GST_SEEK_FLAG_FLUSH |
                           GST_SEEK_FLAG_TRICKMODE |
                           GST_SEEK_FLAG_ACCURATE,
                           seconds ? CLAMP (position, 0, priv->duration) : 0);
}

/* Signals handlers */
static void
on_playback_button_clicked (GtkButton *button, EknMediaBin *self)
{
  ekn_media_bin_toggle_playback (self);
}

static gboolean
on_overlay_button_press_event (GtkWidget   *widget,
                               GdkEvent    *event,
                               EknMediaBin *self)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);

  if (event->button.button != GDK_BUTTON_PRIMARY)
    return FALSE;

  priv->pressed_button_type = event->type;
  return TRUE;
}

static gboolean
on_overlay_button_release_event (GtkWidget   *widget,
                                 GdkEvent    *event,
                                 EknMediaBin *self)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);

  if (event->button.button != GDK_BUTTON_PRIMARY)
    return FALSE;

  if (priv->pressed_button_type == GDK_BUTTON_PRESS)
    {
      ekn_media_bin_toggle_playback (self);
    }
  else if (priv->pressed_button_type == GDK_2BUTTON_PRESS)
    {
      ekn_media_bin_toggle_fullscreen (self);
      ekn_media_bin_toggle_playback (self);
    }

  /* Reset state, since some widgets like GtkButton do not consume
   * the last button press release event
   */
  priv->pressed_button_type = GDK_NOTHING;

  return TRUE;
}

static gboolean
on_revealer_leave_notify_event (GtkWidget   *widget,
                                GdkEvent    *event,
                                EknMediaBin *self)
{
  ekn_media_bin_revealer_timeout (self, TRUE);
  return FALSE;
}

static gboolean
on_revealer_motion_notify_event (GtkWidget   *widget,
                                 GdkEvent    *event,
                                 EknMediaBin *self)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);

  /* Do not hide controls */
  ekn_media_bin_revealer_timeout (self, FALSE);

  /* Restore pointer */
  gdk_window_set_cursor (gtk_widget_get_window (priv->overlay), NULL);

  return TRUE;
}

static gboolean
on_overlay_motion_notify_event (GtkWidget   *widget,
                                GdkEvent    *event,
                                EknMediaBin *self)
{
  ekn_media_bin_reveal_controls (self);
  ekn_media_bin_revealer_timeout (self, TRUE);
  return FALSE;
}

static void
on_fullscreen_button_clicked (GtkButton *button, EknMediaBin *self)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);
  ekn_media_bin_set_fullscreen (self, !priv->fullscreen);
}

static void
on_playback_adjustment_value_changed (GtkAdjustment *adjustment,
                                      EknMediaBin   *self)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);

  if (priv->ignore_adjustment_changes)
    return;

  priv->position = gtk_adjustment_get_value (adjustment);

  gst_element_seek_simple (priv->play,
                           GST_FORMAT_TIME,
                           GST_SEEK_FLAG_ACCURATE |
                           GST_SEEK_FLAG_TRICKMODE |
                           GST_SEEK_FLAG_FLUSH,
                           priv->position * GST_SECOND);
}

static gchar *
on_progress_scale_format_value (GtkScale    *scale,
                                gdouble      value,
                                EknMediaBin *self)
{
  /* FIXME: CSS padding does not work as expected, add some padding here */
  return g_strdup_printf ("  %s  ", format_time (value));
}

static void
on_volume_popup_show (GtkWidget *popup, EknMediaBin *self)
{
  /* Do not hide controls */
  ekn_media_bin_revealer_timeout (self, FALSE);
}

static void
on_volume_popup_hide (GtkWidget *popup, EknMediaBin *self)
{
  ekn_media_bin_revealer_timeout (self, TRUE);
}

/* This function will make playbin show up the first video frame */
static inline void
ekn_media_bin_update_state (EknMediaBin *self)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);

  if (priv->uri && priv->video_sink)
    {
      g_object_set (priv->play, "uri", priv->uri, NULL);
      gst_element_set_state (priv->play, priv->state);
    }
}

static inline gboolean
ekn_media_bin_get_sample_size (EknMediaBin *self,
                               GstSample   *sample,
                               gint        *width,
                               gint        *height)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);
  GstStructure *caps_struct;
  GstCaps *caps;

  if (sample == NULL)
    g_object_get (priv->play, "sample", &sample, NULL);

  if (!sample || !(caps = gst_sample_get_caps (sample)))
    return FALSE;

  caps_struct = gst_caps_get_structure (caps, 0);

  return (gst_structure_get_int (caps_struct, "width", width) &&
          gst_structure_get_int (caps_struct, "height", height));
}

static inline GtkWidget *
ekn_media_bin_video_image_new (EknMediaBin *self)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);
  GtkWidget *retval, *video_widget;
  GdkPixbuf *pixbuf;
  gint w, h;
  cairo_t *cr;
  cairo_surface_t *surface;

  video_widget = gtk_bin_get_child (GTK_BIN (priv->overlay));
  w = gtk_widget_get_allocated_width (video_widget);
  h = gtk_widget_get_allocated_height (video_widget);

  surface = cairo_image_surface_create (CAIRO_FORMAT_RGB24, w, h);
  cr = cairo_create (surface);
  gtk_widget_draw (video_widget, cr);

  pixbuf = gdk_pixbuf_get_from_surface (surface, 0, 0, w, h);
  retval = gtk_image_new_from_pixbuf (pixbuf);
  g_object_set (retval, "expand", TRUE, NULL);

  cairo_destroy (cr);
  cairo_surface_destroy (surface);
  g_object_unref (pixbuf);

  return retval;
}

static void
ekn_media_bin_fullscreen_apply (EknMediaBin *self, gboolean fullscreen)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);

  if (fullscreen && priv->fullscreen_window == NULL)
    {
      /*
       * To avoid flickering, this will make the widget pack a image with the last
       * frame in the container before reparenting the video widget in the
       * fullscreen window
       */
      priv->tmp_image = ekn_media_bin_video_image_new (self);

      priv->fullscreen_window = g_object_ref (ekn_media_bin_window_new (self));

      /* Reparent video widget in a fullscreen window */
      g_object_ref (priv->overlay);
      gtk_container_remove (GTK_CONTAINER (self), priv->overlay);

      /* Pack an image with the last frame inside the bin */
      gtk_container_add (GTK_CONTAINER (self), priv->tmp_image);
      gtk_widget_show (priv->tmp_image);

      /* Pack video in the fullscreen window */
      gtk_container_add (GTK_CONTAINER (priv->fullscreen_window), priv->overlay);
      g_object_unref (priv->overlay);

      gtk_window_fullscreen (priv->fullscreen_window);
      gtk_window_present (priv->fullscreen_window);

      /* Hide cursor if controls are hidden */
      if (!gtk_revealer_get_reveal_child (priv->bottom_revealer))
        gdk_window_set_cursor (gtk_widget_get_window (GTK_WIDGET (priv->fullscreen_window)),
                               priv->blank_cursor);

      gtk_image_set_from_icon_name (priv->fullscreen_image, EMB_ICON_NAME_RESTORE, EMB_ICON_SIZE);
    }
  else if (priv->fullscreen_window)
    {
      gtk_container_remove (GTK_CONTAINER (self), priv->tmp_image);
      priv->tmp_image = NULL;

      /* Reparent video widget back into ourselves */
      g_object_ref (priv->overlay);
      gtk_container_remove (GTK_CONTAINER (priv->fullscreen_window), priv->overlay);
      gtk_container_add (GTK_CONTAINER (self), priv->overlay);
      g_object_unref (priv->overlay);

      gtk_widget_destroy (GTK_WIDGET (priv->fullscreen_window));
      priv->fullscreen_window = NULL;

      gtk_image_set_from_icon_name (priv->fullscreen_image, EMB_ICON_NAME_FULLSCREEN, EMB_ICON_SIZE);
    }

  gtk_widget_grab_focus (priv->overlay);
}

static inline gboolean
ekn_media_bin_gl_check (GtkWidget *widget)
{
  static gsize gl_works = 0;

  if (g_once_init_enter (&gl_works))
    {
      gsize works = 1;
      GdkGLContext *context;
      GdkWindow *window;

      if ((window  = gtk_widget_get_window (widget)) &&
           (context = gdk_window_create_gl_context (window, NULL)))
        {
          const gchar *vendor, *renderer;

          gdk_gl_context_make_current (context);

          vendor   = (const gchar *) glGetString (GL_VENDOR);
          renderer = (const gchar *) glGetString (GL_RENDERER);

          GST_INFO ("GL Vendor: %s, renderer: %s", vendor, renderer);

          if (g_str_equal (vendor, "nouveau"))
            GST_WARNING ("nouveau is blacklisted, since sharing gl contexts in "
                         "multiple threads is not supported "
                         "and will eventually make it crash.");
          else if (g_strstr_len (renderer, -1, "Gallium") &&
                   g_strstr_len (renderer, -1, "llvmpipe"))
            GST_INFO ("Detected software GL rasterizer, falling back to gtksink");
          else
            works = 2;

          gdk_gl_context_clear_current ();
        }

      g_once_init_leave (&gl_works, works);
    }

  return (gl_works > 1);
}

static inline GtkWidget *
ekn_media_bin_get_video_widget (GstElement *sink)
{
  GtkWidget *retval = NULL;

  g_object_get (sink, "widget", &retval, NULL);

  if (!retval)
    GST_WARNING ("Could not get video widget from gtkglsink/gtksink");

  return retval;
}

static inline GstElement *
ekn_media_bin_video_sink_new (EknMediaBin *self)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);
  GtkWidget *video_widget = NULL;
  GstElement *video_sink = NULL;

  if (ekn_media_bin_gl_check (GTK_WIDGET (self)))
    {
      video_sink = gst_element_factory_make ("glsinkbin", "EknMediaBinGLVideoSink");

      if (video_sink)
        {
          GstElement *gtkglsink = gst_element_factory_make ("gtkglsink", NULL);

          if (gtkglsink)
            {
              GST_INFO ("Using gtkglsink");
              g_object_set (video_sink, "sink", gtkglsink, NULL);
              video_widget = ekn_media_bin_get_video_widget (gtkglsink);
            }
          else
            {
              GST_WARNING ("Could not create gtkglsink");
              g_clear_object (&video_sink);
            }
        }
      else
        {
          GST_WARNING ("Could not create glsinkbin");
        }
    }

  /* Fallback to gtksink */
  if (!video_sink)
    {
      video_sink = gst_element_factory_make ("gtksink", NULL);

      GST_INFO ("Falling back to gtksink");

      if (video_sink)
        video_widget = ekn_media_bin_get_video_widget (video_sink);
    }

  /* We use a null sink as a last resort */
  if (video_sink && video_widget)
    {
      g_object_set (video_widget, "expand", TRUE, NULL);

      /* And pack it where we want the video to show up */
      gtk_container_add (GTK_CONTAINER (priv->overlay), video_widget);
      gtk_widget_show (video_widget);
    }
  else
    {
      GtkWidget *img = gtk_image_new_from_icon_name ("image-missing",
                                                     GTK_ICON_SIZE_DIALOG);

      GST_WARNING ("Falling back to fakesink");

      g_clear_object (&video_sink);
      video_sink = gst_element_factory_make ("fakesink", "EknMediaBinFakeSink");

      gtk_container_add (GTK_CONTAINER (priv->overlay), img);
      gtk_widget_show (img);

      /* FIXME: the overlay does not get motion and press events with this code path */
    }

  return video_sink;
}

static void
on_ekn_media_bin_realize (GtkWidget *widget, EknMediaBin *self)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);

  /* Create a blank_cursor */
  priv->blank_cursor = gdk_cursor_new_from_name (gtk_widget_get_display (widget),
                                                 "none");

  /* Create video sink */
  priv->video_sink = g_object_ref (ekn_media_bin_video_sink_new (self));

  /* Setup playbin video sink */
  if (priv->video_sink)
    g_object_set (priv->play, "video-sink", priv->video_sink, NULL);

  if (priv->fullscreen)
    ekn_media_bin_fullscreen_apply (self, TRUE);

  /* Make playbin show the first video frame if there is an URI */
  ekn_media_bin_update_state (self);

  /* Disconnect after initialization */
  g_signal_handlers_disconnect_by_func (widget, on_ekn_media_bin_realize, self);
}

static gboolean
ekn_media_bin_error (EknMediaBin *self, GError *error)
{
  /* TODO: properly present errors to the user */
  g_warning ("%s", error->message);
  return TRUE;
}

static void
ekn_media_bin_init (EknMediaBin *self)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);
  GtkWidget *popup;
  gint i;

  gtk_widget_init_template (GTK_WIDGET (self));

  /* We want the initial state to be paused to show the first frame */
  priv->state = GST_STATE_PAUSED;
  priv->autohide_timeout = AUTOHIDE_TIMEOUT_DEFAULT;
  priv->pressed_button_type = GDK_NOTHING;

  ekn_media_bin_init_playbin (self);

  /* Create info box column labels */
  for (i = 0; i < INFO_N_COLUMNS; i++)
    {
      GtkWidget *label = gtk_label_new ("");
      priv->info_column_label[i] = GTK_LABEL (label);
      gtk_container_add (GTK_CONTAINER (priv->info_box), label);
      gtk_widget_show (label);
    }

  /* Cache position query */
  priv->position_query = gst_query_new_position (GST_FORMAT_TIME);

  popup = gtk_scale_button_get_popup (GTK_SCALE_BUTTON (priv->volume_button));
  g_signal_connect (popup, "show", G_CALLBACK (on_volume_popup_show), self);
  g_signal_connect (popup, "hide", G_CALLBACK (on_volume_popup_hide), self);

  gtk_style_context_add_class (gtk_widget_get_style_context (popup), "ekn-media-bin");

  /* Hide volume popup buttons */
  gtk_widget_hide (gtk_scale_button_get_plus_button (GTK_SCALE_BUTTON (priv->volume_button)));
  gtk_widget_hide (gtk_scale_button_get_minus_button (GTK_SCALE_BUTTON (priv->volume_button)));
}

static void
ekn_media_bin_finalize (GObject *object)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (EKN_MEDIA_BIN (object));

  /* Stop Playback to give gst a chance to cleanup its mess */
  gst_element_set_state (priv->play, GST_STATE_NULL);

  /* Stop bus watch */
  gst_bus_remove_watch (priv->bus);
  g_clear_object (&priv->bus);

  /* Clear position query */
  g_clear_pointer (&priv->position_query, gst_query_unref);

  /* Remove frame clock tick callback */
  if (priv->tick_id)
    {
      gtk_widget_remove_tick_callback (GTK_WIDGET (object), priv->tick_id);
      priv->tick_id = 0;
    }

  /* Remove controls timeout */
  if (priv->timeout_id)
    g_source_remove (priv->timeout_id);

  /* Clear tag lists */
  g_clear_pointer (&priv->audio_tags, gst_tag_list_unref);
  g_clear_pointer (&priv->video_tags, gst_tag_list_unref);
  g_clear_pointer (&priv->text_tags, gst_tag_list_unref);

  /* Unref playbin */
  g_clear_object (&priv->play);

  /* Destroy fullscreen window */
  g_clear_object (&priv->fullscreen_window);

  /* Unref cursor */
  g_clear_object (&priv->blank_cursor);

  /* Free properties */
  g_clear_pointer (&priv->uri, g_free);
  g_clear_pointer (&priv->title, g_free);
  g_clear_pointer (&priv->description, g_free);

  G_OBJECT_CLASS (ekn_media_bin_parent_class)->finalize (object);
}

static void
ekn_media_bin_set_property (GObject      *object,
                            guint         prop_id,
                            const GValue *value,
                            GParamSpec   *pspec)
{
  g_return_if_fail (EKN_IS_MEDIA_BIN (object));

  switch (prop_id)
    {
      case PROP_URI:
        ekn_media_bin_set_uri (EKN_MEDIA_BIN (object),
                               g_value_get_string (value));
      break;
      case PROP_VOLUME:
        ekn_media_bin_set_volume (EKN_MEDIA_BIN (object),
                                  g_value_get_double (value));
      break;
      case PROP_AUTOHIDE_TIMEOUT:
        ekn_media_bin_set_autohide_timeout (EKN_MEDIA_BIN (object),
                                            g_value_get_int (value));
      break;
      case PROP_FULLSCREEN:
        ekn_media_bin_set_fullscreen (EKN_MEDIA_BIN (object),
                                      g_value_get_boolean (value));
      break;
      case PROP_SHOW_STREAM_INFO:
        ekn_media_bin_set_show_stream_info (EKN_MEDIA_BIN (object),
                                            g_value_get_boolean (value));
      break;
      case PROP_TITLE:
        ekn_media_bin_set_title (EKN_MEDIA_BIN (object),
                                 g_value_get_string (value));
      break;
      case PROP_DESCRIPTION:
        ekn_media_bin_set_description (EKN_MEDIA_BIN (object),
                                       g_value_get_string (value));
      break;
      default:
        G_OBJECT_WARN_INVALID_PROPERTY_ID (object, prop_id, pspec);
      break;
    }
}

static void
ekn_media_bin_get_property (GObject    *object,
                            guint       prop_id,
                            GValue     *value,
                            GParamSpec *pspec)
{
  EknMediaBinPrivate *priv;

  g_return_if_fail (EKN_IS_MEDIA_BIN (object));
  priv = EMB_PRIVATE (EKN_MEDIA_BIN (object));

  switch (prop_id)
    {
      case PROP_URI:
        g_value_set_string (value, priv->uri);
      break;
      case PROP_VOLUME:
        g_value_set_double (value, gtk_scale_button_get_value (priv->volume_button));
      break;
      case PROP_AUTOHIDE_TIMEOUT:
        g_value_set_int (value, priv->autohide_timeout);
      break;
      case PROP_FULLSCREEN:
        g_value_set_boolean (value, priv->fullscreen);
      break;
      case PROP_SHOW_STREAM_INFO:
        g_value_set_boolean (value, priv->show_stream_info);
      break;
      case PROP_TITLE:
        g_value_set_string (value, priv->title);
      break;
      case PROP_DESCRIPTION:
        g_value_set_string (value, priv->description);
      break;
      default:
        G_OBJECT_WARN_INVALID_PROPERTY_ID (object, prop_id, pspec);
      break;
    }
}

#define EMB_DEFINE_ACTION_SIGNAL(klass, name, handler,...) \
  g_signal_new_class_handler (name, \
                              G_TYPE_FROM_CLASS (klass), \
                              G_SIGNAL_RUN_LAST | G_SIGNAL_ACTION, \
                              G_CALLBACK (handler), \
                              NULL, NULL, NULL, \
                              G_TYPE_NONE, __VA_ARGS__)

static void
ekn_media_bin_class_init (EknMediaBinClass *klass)
{
  GObjectClass   *object_class = G_OBJECT_CLASS (klass);
  GtkWidgetClass *widget_class = GTK_WIDGET_CLASS (klass);

  object_class->finalize = ekn_media_bin_finalize;
  object_class->set_property = ekn_media_bin_set_property;
  object_class->get_property = ekn_media_bin_get_property;

  /* Properties */
  properties[PROP_URI] =
    g_param_spec_string ("uri",
                         "URI",
                         "The Media URI to playback",
                         NULL,
                         G_PARAM_READWRITE);

  properties[PROP_VOLUME] =
    g_param_spec_double ("volume",
                         "Volume",
                         "Stream volume",
                         0.0, 1.0, 1.0,
                         G_PARAM_READWRITE);

  properties[PROP_AUTOHIDE_TIMEOUT] =
    g_param_spec_int ("autohide-timeout",
                      "Auto hide timeout",
                      "Controls auto hide timeout in seconds",
                      0, G_MAXINT,
                      AUTOHIDE_TIMEOUT_DEFAULT,
                      G_PARAM_READWRITE);

  properties[PROP_FULLSCREEN] =
    g_param_spec_boolean ("fullscreen",
                          "Fullscreen",
                          "Whether to show the video in fullscreen or not",
                          FALSE,
                          G_PARAM_READWRITE);

  properties[PROP_SHOW_STREAM_INFO] =
    g_param_spec_boolean ("show-stream-info",
                          "Show stream info",
                          "Whether to show stream information or not",
                          FALSE,
                          G_PARAM_READWRITE);

  properties[PROP_TITLE] =
    g_param_spec_string ("title",
                         "Title",
                         "The title to display",
                         NULL,
                         G_PARAM_READWRITE);

  properties[PROP_DESCRIPTION] =
    g_param_spec_string ("description",
                         "Description",
                         "Audio/Video description",
                         NULL,
                         G_PARAM_READWRITE);

  g_object_class_install_properties (object_class, N_PROPERTIES, properties);

  /**
   * EknMediaBin::error:
   * @self: the #EknMediaBin which received the signal.
   * @error: the #GError
   */
  ekn_media_bin_signals[ERROR] =
      g_signal_new_class_handler ("error",
                                  G_TYPE_FROM_CLASS (object_class),
                                  G_SIGNAL_RUN_LAST,
                                  G_CALLBACK (ekn_media_bin_error),
                                  g_signal_accumulator_true_handled, NULL,
                                  NULL,
                                  G_TYPE_BOOLEAN, 1, G_TYPE_ERROR);

  /* Action signals for key bindings */
  EMB_DEFINE_ACTION_SIGNAL (object_class, "toggle", ekn_media_bin_action_toggle, 1, G_TYPE_STRING);
  EMB_DEFINE_ACTION_SIGNAL (object_class, "seek", ekn_media_bin_action_seek, 1, G_TYPE_INT);

  /* Template */
  gtk_widget_class_set_template_from_resource (widget_class, "/com/endlessm/knowledge-private/EknMediaBin.ui");

  gtk_widget_class_bind_template_child_private (widget_class, EknMediaBin, overlay);
  gtk_widget_class_bind_template_child_private (widget_class, EknMediaBin, play_box);
  gtk_widget_class_bind_template_child_private (widget_class, EknMediaBin, playback_button);
  gtk_widget_class_bind_template_child_private (widget_class, EknMediaBin, playback_image);
  gtk_widget_class_bind_template_child_private (widget_class, EknMediaBin, playback_adjustment);
  gtk_widget_class_bind_template_child_private (widget_class, EknMediaBin, volume_button);
  gtk_widget_class_bind_template_child_private (widget_class, EknMediaBin, fullscreen_button);
  gtk_widget_class_bind_template_child_private (widget_class, EknMediaBin, fullscreen_image);
  gtk_widget_class_bind_template_child_private (widget_class, EknMediaBin, title_label);
  gtk_widget_class_bind_template_child_private (widget_class, EknMediaBin, info_box);
  gtk_widget_class_bind_template_child_private (widget_class, EknMediaBin, duration_label);
  gtk_widget_class_bind_template_child_private (widget_class, EknMediaBin, top_revealer);
  gtk_widget_class_bind_template_child_private (widget_class, EknMediaBin, bottom_revealer);

  gtk_widget_class_bind_template_callback (widget_class, on_ekn_media_bin_realize);

  gtk_widget_class_bind_template_callback (widget_class, on_overlay_motion_notify_event);
  gtk_widget_class_bind_template_callback (widget_class, on_overlay_button_press_event);
  gtk_widget_class_bind_template_callback (widget_class, on_overlay_button_release_event);

  gtk_widget_class_bind_template_callback (widget_class, on_revealer_motion_notify_event);
  gtk_widget_class_bind_template_callback (widget_class, on_revealer_leave_notify_event);

  gtk_widget_class_bind_template_callback (widget_class, on_progress_scale_format_value);
  gtk_widget_class_bind_template_callback (widget_class, on_playback_button_clicked);
  gtk_widget_class_bind_template_callback (widget_class, on_playback_adjustment_value_changed);
  gtk_widget_class_bind_template_callback (widget_class, on_fullscreen_button_clicked);

  /* Setup CSS */
  gtk_widget_class_set_css_name (widget_class, "ekn-media-bin");

  if (gdk_screen_get_default ())
    {
      GtkCssProvider *css_provider = gtk_css_provider_new ();

      /* Add custom icons to default theme */
      gtk_icon_theme_add_resource_path (gtk_icon_theme_get_default (), "/com/endlessm/knowledge-private");

      gtk_css_provider_load_from_resource (css_provider, "/com/endlessm/knowledge-private/ekn-media-bin.css");
      gtk_style_context_add_provider_for_screen (gdk_screen_get_default (),
                                                 GTK_STYLE_PROVIDER (css_provider),
                                                 GTK_STYLE_PROVIDER_PRIORITY_APPLICATION-10);
      g_object_unref (css_provider);
    }

  /* Init GStreamer */
  gst_init_check (NULL, NULL, NULL);
  GST_DEBUG_CATEGORY_INIT (ekn_media_bin_debug, "EknMediaBin", 0, "EknMediaBin audio/video widget");
}

/*************************** Fullscreen Window Type ***************************/

G_DECLARE_FINAL_TYPE (EknMediaBinWindow, ekn_media_bin_window, EKN, MEDIA_BIN_WINDOW, GtkWindow)

struct _EknMediaBinWindow
{
  GtkWindow parent;
};

G_DEFINE_TYPE (EknMediaBinWindow, ekn_media_bin_window, GTK_TYPE_WINDOW);

static void
ekn_media_bin_window_init (EknMediaBinWindow *self)
{
  gtk_window_set_decorated (GTK_WINDOW (self), FALSE);
}

static void
ekn_media_bin_window_class_init (EknMediaBinWindowClass *klass)
{
  GObjectClass *object_class = G_OBJECT_CLASS (klass);

  gtk_widget_class_set_css_name (GTK_WIDGET_CLASS (klass), "ekn-media-bin");

  EMB_DEFINE_ACTION_SIGNAL (object_class, "toggle", NULL, 1, G_TYPE_STRING);
  EMB_DEFINE_ACTION_SIGNAL (object_class, "seek", NULL, 1, G_TYPE_INT);
}

static GtkWindow *
ekn_media_bin_window_new (EknMediaBin *bin)
{
  GObject *window = g_object_new (ekn_media_bin_window_get_type (), NULL);

  g_signal_connect_swapped (window, "delete-event", G_CALLBACK (ekn_media_bin_toggle_fullscreen), bin);
  g_signal_connect_swapped (window, "toggle", G_CALLBACK (ekn_media_bin_action_toggle), bin);
  g_signal_connect_swapped (window, "seek", G_CALLBACK (ekn_media_bin_action_seek), bin);

  return (GtkWindow *) window;
}

/*********************************** Utils ************************************/

#define TIME_HOURS(t)   (t / 3600)
#define TIME_MINUTES(t) ((t % 3600) / 60)
#define TIME_SECONDS(t) (t % 60)

static const gchar *
format_time (gint time)
{
  static gchar buffer[16];
  gint hours = TIME_HOURS (time);

  if (hours)
    g_snprintf (buffer,
                sizeof (buffer),
                "%d:%02d:%02d",
                hours,
                TIME_MINUTES (time),
                TIME_SECONDS (time));
  else
    g_snprintf (buffer,
                sizeof (buffer),
                "%d:%02d",
                TIME_MINUTES (time),
                TIME_SECONDS (time));

  return (const gchar *) buffer;
}

static void
on_widget_style_updated (GtkWidget *widget, gpointer data)
{
  gboolean visible = GPOINTER_TO_INT (data);
  gdouble opacity;

  gtk_style_context_get (gtk_widget_get_style_context (widget),
                         gtk_widget_get_state_flags (widget),
                         "opacity", &opacity, NULL);

  if ((visible && opacity >= 1.0) || (!visible && opacity == 0.0))
    {
      gtk_widget_set_visible (widget, visible);
      g_signal_handlers_disconnect_by_func (widget, on_widget_style_updated, data);
    }
}

static void
widget_set_visible (GtkWidget *widget, gboolean visible)
{
  GtkStyleContext *context = gtk_widget_get_style_context (widget);

  g_signal_handlers_disconnect_by_func (widget, on_widget_style_updated, GINT_TO_POINTER (TRUE));
  g_signal_handlers_disconnect_by_func (widget, on_widget_style_updated, GINT_TO_POINTER (FALSE));

  gtk_style_context_remove_class (context, visible ? "hide" : "show");
  gtk_style_context_add_class (context, visible ? "show" : "hide");

  if (visible)
    gtk_widget_show (widget);

  g_signal_connect (widget, "style-updated",
                    G_CALLBACK (on_widget_style_updated),
                    GINT_TO_POINTER (visible));
}

/* The following macros are used to define generic getters and setters */

#define EMB_DEFINE_GETTER_FULL(type, prop, retval, retstmt) \
type \
ekn_media_bin_get_##prop (EknMediaBin *self) \
{ \
  g_return_val_if_fail (EKN_IS_MEDIA_BIN (self), retval); \
  retstmt \
}

#define EMB_DEFINE_GETTER(type, prop, retval) \
  EMB_DEFINE_GETTER_FULL (type, prop, retval, return EMB_PRIVATE (self)->prop;)

#define EMB_DEFINE_SETTER_FULL(type, prop, PROP, setup, cmp, assign, code) \
void \
ekn_media_bin_set_##prop (EknMediaBin *self, type prop) \
{ \
  EknMediaBinPrivate *priv; \
  g_return_if_fail (EKN_IS_MEDIA_BIN (self)); \
  priv = EMB_PRIVATE (self); \
  setup; \
  if (cmp) \
    { \
      assign; \
      code; \
      g_object_notify_by_pspec (G_OBJECT (self), properties[PROP_##PROP]); \
    } \
}

/* The last argument is for custom code that will be added just before calling
 * g_object_notify_by_pspec()
 */
#define EMB_DEFINE_SETTER(type, prop, PROP, code) \
  EMB_DEFINE_SETTER_FULL(type, prop, PROP, \
    , \
    priv->prop != prop, \
    priv->prop = prop, \
    code)

#define EMB_DEFINE_SETTER_BOOLEAN(prop, PROP, code) \
  EMB_DEFINE_SETTER_FULL(gboolean, prop, PROP, \
    prop = (prop) ? TRUE : FALSE, \
    priv->prop != prop, \
    priv->prop = prop, \
    code)

#define EMB_DEFINE_SETTER_STRING(prop, PROP, code) \
  EMB_DEFINE_SETTER_FULL(const gchar *, prop, PROP, \
    , \
    g_strcmp0 (priv->prop, prop), \
    g_free (priv->prop); priv->prop = g_strdup (prop), \
    code)


/******************************** GST Support *********************************/
static inline gboolean
ekn_media_bin_handle_msg_error (EknMediaBin *self, GstMessage *msg)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);
  GError *error = NULL;
  gboolean handled;

  gst_message_parse_error (msg, &error, NULL);

  if (priv->play)
    gst_element_set_state (priv->play, GST_STATE_NULL);

  g_signal_emit (self, ekn_media_bin_signals[ERROR], 0, error, &handled);

  g_error_free (error);

  return handled;
}

static inline void
ekn_media_bin_update_duration (EknMediaBin *self)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);
  gint64 duration;

  gst_element_query_duration (priv->play, GST_FORMAT_TIME, &duration);

  if (priv->duration == duration)
    return;

  priv->duration = duration;

  duration = GST_TIME_AS_SECONDS (duration);
  gtk_label_set_label (priv->duration_label, format_time (duration));
  gtk_adjustment_set_upper (priv->playback_adjustment, duration);
}

static inline void
ekn_media_update_position (EknMediaBin *self)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);
  gint position = GST_TIME_AS_SECONDS (ekn_media_bin_get_position (self));

  if (priv->position == position)
    return;

  priv->position = position;
  priv->ignore_adjustment_changes = TRUE;
  gtk_adjustment_set_value (priv->playback_adjustment, position);
  priv->ignore_adjustment_changes = FALSE;
}

static gboolean
ekn_media_bin_tick_callback (GtkWidget     *widget,
                             GdkFrameClock *frame_clock,
                             gpointer       user_data)
{
  ekn_media_update_position ((EknMediaBin *)widget);

  return G_SOURCE_CONTINUE;
}

static inline void
ekn_media_bin_handle_msg_state_changed (EknMediaBin *self, GstMessage *msg)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);
  GstState old_state, new_state;

  gst_message_parse_state_changed (msg, &old_state, &new_state, NULL);

  if (old_state == new_state ||
      GST_MESSAGE_SRC (msg) != GST_OBJECT (priv->play))
    return;

  /* Update UI */
  if (new_state == GST_STATE_PAUSED)
    {
      widget_set_visible (priv->play_box, TRUE);
      gtk_image_set_from_icon_name (priv->playback_image, EMB_ICON_NAME_PLAY, EMB_ICON_SIZE);
      ekn_media_bin_update_duration (self);
    }
  else if (new_state == GST_STATE_PLAYING)
    {
      widget_set_visible (priv->play_box, FALSE);
      gtk_image_set_from_icon_name (priv->playback_image, EMB_ICON_NAME_PAUSE, EMB_ICON_SIZE);
      priv->tick_id = gtk_widget_add_tick_callback (GTK_WIDGET (self),
                                                    ekn_media_bin_tick_callback,
                                                    NULL, NULL);
    }
  else
    {
      gtk_image_set_from_icon_name (priv->playback_image, EMB_ICON_NAME_PLAY, EMB_ICON_SIZE);
      priv->position = 0;
      gtk_widget_remove_tick_callback (GTK_WIDGET (self), priv->tick_id);
      priv->tick_id = 0;
    }
}

typedef struct {
  GString *tag;
  GString *val;
} MetaDataStrings;

static void
print_tag (const GstTagList *list, const gchar *tag, gpointer data)
{
  MetaDataStrings *metadata = data;
  gint i, n;

  for (i = 0, n = gst_tag_list_get_tag_size (list, tag); i < n; ++i)
    {
      const GValue *val = gst_tag_list_get_value_index (list, tag, i);
      GValue str = {0, };

      g_value_init (&str, G_TYPE_STRING);
      g_value_transform (val, &str);

      g_string_append_printf (metadata->tag, "\n    %s", tag);
      g_string_append_printf (metadata->val, "\n: %s", g_value_get_string (&str));

      g_value_unset (&str);
    }
}

static inline void
meta_data_strings_set_info (MetaDataStrings *metadata,
                            GtkLabel        *left,
                            GtkLabel        *right,
                            GstTagList      *tags,
                            const gchar     *title)
{
  if (tags)
    {
      g_string_assign (metadata->tag, title);
      g_string_assign (metadata->val, "");

      gst_tag_list_foreach (tags, print_tag, metadata);

      gtk_label_set_label (left, metadata->tag->str);
      gtk_label_set_label (right, metadata->val->str);
    }
  else
    {
      gtk_label_set_label (left, "");
      gtk_label_set_label (right, "");
    }
}

static inline void
ekn_media_bin_update_stream_info (EknMediaBin *self)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);
  MetaDataStrings metadata = { g_string_new (""), g_string_new ("") };

  meta_data_strings_set_info (&metadata,
                              priv->info_column_label[0],
                              priv->info_column_label[1],
                              priv->audio_tags,
                              "Audio:");

  meta_data_strings_set_info (&metadata,
                              priv->info_column_label[2],
                              priv->info_column_label[3],
                              priv->video_tags,
                              "Video:");

  meta_data_strings_set_info (&metadata,
                              priv->info_column_label[4],
                              priv->info_column_label[5],
                              priv->text_tags,
                              "Text:");

  g_string_free (metadata.tag, TRUE);
  g_string_free (metadata.val, TRUE);
}

static inline void
ekn_media_bin_handle_msg_application (EknMediaBin *self, GstMessage *msg)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);
  const GstStructure *structure;
  const gchar *name;

  structure = gst_message_get_structure (msg);
  name = gst_structure_get_name (structure);
  g_return_if_fail (name != NULL);

  if (priv->show_stream_info)
    ekn_media_bin_update_stream_info (self);

  /* TODO: handle audio and text tags */
  if (g_str_equal (name, "video-tags-changed"))
    {
      gchar *value = NULL;

      if (!priv->title_user_set)
        {
          if (priv->video_tags)
            gst_tag_list_get_string_index (priv->video_tags, GST_TAG_TITLE, 0, &value);

          ekn_media_bin_set_title (self, value);
          priv->title_user_set = FALSE;
          g_clear_pointer (&value, g_free);
        }

      if (!priv->description_user_set)
        {
          /* Get description from comment or description tags */
          if (priv->video_tags)
            {
              /* We try comment tag first and then description */
              if (!gst_tag_list_get_string_index (priv->video_tags, GST_TAG_COMMENT, 0, &value))
                gst_tag_list_get_string_index (priv->video_tags, GST_TAG_DESCRIPTION, 0, &value);
            }

          ekn_media_bin_set_description (self, value);
          priv->description_user_set = FALSE;
          g_clear_pointer (&value, g_free);
        }
    }
}

static gboolean
ekn_media_bin_bus_watch (GstBus *bus, GstMessage *msg, gpointer data)
{
  EknMediaBin *self = data;

  switch (GST_MESSAGE_TYPE (msg))
    {
      case GST_MESSAGE_ERROR:
        return ekn_media_bin_handle_msg_error (self, msg);
      case GST_MESSAGE_STATE_CHANGED:
        ekn_media_bin_handle_msg_state_changed (self, msg);
      break;
      case GST_MESSAGE_DURATION_CHANGED:
        ekn_media_bin_update_duration (self);
      break;
      case GST_MESSAGE_APPLICATION:
        ekn_media_bin_handle_msg_application (self, msg);
      break;

      default:
      break;
    }

  return G_SOURCE_CONTINUE;
}

static inline void
on_playbin_tags_changed (GstElement   *playbin,
                         GstTagList  **tags,
                         gint          stream_id,
                         const gchar  *name,
                         const gchar  *stream_prop,
                         const gchar  *action_signal)
{
  GstStructure *data;
  gint current_id = 0;

  g_object_get (G_OBJECT (playbin), stream_prop, &current_id, NULL);

  if (current_id != stream_id)
    return;

  /* Free old tags */
  g_clear_pointer (tags, gst_tag_list_unref);

  /* Get new tags from playbin */
  g_signal_emit_by_name (G_OBJECT (playbin), action_signal, stream_id, tags);

  /* Post message on the bus for the main thread to pick it up */
  data = gst_structure_new (name, NULL, NULL);
  gst_element_post_message (playbin,
                            gst_message_new_application (GST_OBJECT (playbin),
                                                         data));
}

static void
on_playbin_audio_tags_changed (GstElement *play, gint stream, EknMediaBin *self)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);
  on_playbin_tags_changed (play,
                           &priv->audio_tags,
                           stream,
                           "audio-tags-changed",
                           "current-audio",
                           "get-audio-tags");
}

static void
on_playbin_video_tags_changed (GstElement *play, gint stream, EknMediaBin *self)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);
  on_playbin_tags_changed (play,
                           &priv->video_tags,
                           stream,
                           "video-tags-changed",
                           "current-video",
                           "get-video-tags");
}

static void
on_playbin_text_tags_changed (GstElement *play, gint stream, EknMediaBin *self)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);
  on_playbin_tags_changed (play,
                           &priv->text_tags,
                           stream,
                           "text-tags-changed",
                           "current-text",
                           "get-text-tags");
}

static void
ekn_media_bin_init_playbin (EknMediaBin *self)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);

  priv->play = gst_element_factory_make ("playbin", "EknMediaBinPlayBin");

  g_signal_connect (priv->play, "audio-tags-changed",
                    G_CALLBACK (on_playbin_audio_tags_changed),
                    self);
  g_signal_connect (priv->play, "video-tags-changed",
                    G_CALLBACK (on_playbin_video_tags_changed),
                    self);
  g_signal_connect (priv->play, "text-tags-changed",
                    G_CALLBACK (on_playbin_text_tags_changed),
                    self);

  /* Setup volume */
  /* NOTE: Bidirectional binding makes the app crash on X11 */
  g_object_bind_property (priv->volume_button, "value",
                          priv->play, "volume",
                          G_BINDING_SYNC_CREATE);

  /* Watch bus */
  priv->bus = gst_pipeline_get_bus (GST_PIPELINE (priv->play));
  gst_bus_add_watch (priv->bus, ekn_media_bin_bus_watch, self);
}

/********************************* Public API *********************************/

/**
 * ekn_media_bin_new:
 *
 * Returns a new #EknMediaBin
 *
 */
GtkWidget *
ekn_media_bin_new ()
{
  return (GtkWidget*) g_object_new (EKN_TYPE_MEDIA_BIN, NULL);
}

/**
 * ekn_media_bin_get_uri:
 * @self: a #EknMediaBin
 *
 * Return the media URI
 */
EMB_DEFINE_GETTER (const gchar *, uri, NULL)

/**
 * ekn_media_bin_set_uri:
 * @self: a #EknMediaBin
 * @uri:
 *
 * Sets the media URI to play
 */
EMB_DEFINE_SETTER_STRING (uri, URI,
  /* Make playbin show the first video frame if there is an URI
   * and the widget is realized.
   */
   ekn_media_bin_update_state (self);
)

/**
 * ekn_media_bin_get_autohide_timeout:
 * @self: a #EknMediaBin
 *
 * Returns control's auto hide timeout in seconds.
 */
EMB_DEFINE_GETTER (gint, autohide_timeout, 0)

/**
 * ekn_media_bin_set_autohide_timeout:
 * @self: a #EknMediaBin
 * @autohide_timeout: A timeout in seconds
 *
 * Sets the timeout to auto hide controls
 */
EMB_DEFINE_SETTER (gint, autohide_timeout, AUTOHIDE_TIMEOUT,)

/**
 * ekn_media_bin_get_fullscreen:
 * @self: a #EknMediaBin
 *
 * Returns whether video is fullscreen or not
 */
EMB_DEFINE_GETTER (gboolean, fullscreen, FALSE)

/**
 * ekn_media_bin_set_fullscreen:
 * @self: a #EknMediaBin
 * @fullscreen:
 *
 * Sets whether to show the video in fullscreen mode or not
 */
EMB_DEFINE_SETTER_BOOLEAN (fullscreen, FULLSCREEN,
  /* If there is no video sink, delay fullscreen until realize event */
  if (priv->video_sink)
    ekn_media_bin_fullscreen_apply (self, fullscreen);
)

/**
 * ekn_media_bin_get_show_stream_info:
 * @self: a #EknMediaBin
 *
 * Returns whether streams information are show or not
 */
EMB_DEFINE_GETTER (gboolean, show_stream_info, FALSE)

/**
 * ekn_media_bin_set_show_stream_info:
 * @self: a #EknMediaBin
 * @show_stream_info:
 *
 * Sets whether to show stream information or not
 */
EMB_DEFINE_SETTER_BOOLEAN (show_stream_info, SHOW_STREAM_INFO,

  if (show_stream_info)
    {
      ekn_media_bin_update_stream_info (self);
      gtk_widget_show (priv->info_box);
    }
  else
    {
      gint i;

      gtk_widget_hide (priv->info_box);

      for (i = 0; i < INFO_N_COLUMNS; i++)
        gtk_label_set_label (priv->info_column_label[i], "");
    }
)

/**
 * ekn_media_bin_get_title:
 * @self: a #EknMediaBin
 *
 * Returns the media title if any
 */
EMB_DEFINE_GETTER (const gchar *, title, NULL)

/**
 * ekn_media_bin_set_title:
 * @self: a #EknMediaBin
 * @title:
 *
 * Sets the media title.
 * By default EknMediaBin will use the title from the media metadata
 */
EMB_DEFINE_SETTER_STRING (title, TITLE,
  gtk_label_set_label (priv->title_label, title);
  gtk_widget_set_visible (GTK_WIDGET (priv->title_label), title != NULL);
  priv->title_user_set = TRUE;
)

/**
 * ekn_media_bin_get_description:
 * @self: a #EknMediaBin
 *
 * Returns the media description if any
 */
EMB_DEFINE_GETTER (const gchar *, description, NULL)

/**
 * ekn_media_bin_set_description:
 * @self: a #EknMediaBin
 * @description:
 *
 * Sets the media description.
 * By default EknMediaBin will use the description from the media metadata
 */
EMB_DEFINE_SETTER_STRING (description, DESCRIPTION,
  priv->description_user_set = TRUE;
)

/**
 * ekn_media_bin_get_volume:
 * @self: a #EknMediaBin
 *
 * Returns audio volume from 0.0 to 1.0
 */
EMB_DEFINE_GETTER_FULL (gdouble, volume, 1.0,
  return gtk_scale_button_get_value (EMB_PRIVATE (self)->volume_button);
)

/**
 * ekn_media_bin_set_volume:
 * @self: a #EknMediaBin
 * @volume: from 0.0 to 1.0
 *
 * Sets the audio volume
 */
EMB_DEFINE_SETTER_FULL (gdouble, volume, VOLUME,
  volume = CLAMP (volume, 0.0, 1.0),
  gtk_scale_button_get_value (priv->volume_button) != volume,
  gtk_scale_button_set_value (priv->volume_button, volume),
)

/**
 * ekn_media_bin_play:
 * @self: a #EknMediaBin
 *
 * Start media playback
 */
void
ekn_media_bin_play (EknMediaBin *self)
{
  EknMediaBinPrivate *priv;

  g_return_if_fail (EKN_IS_MEDIA_BIN (self));
  priv = EMB_PRIVATE (self);

  g_object_set (priv->play, "uri", priv->uri, NULL);

  priv->state = GST_STATE_PLAYING;
  gst_element_set_state (priv->play, GST_STATE_PLAYING);
}

/**
 * ekn_media_bin_pause:
 * @self: a #EknMediaBin
 *
 * Pause media playback
 */
void
ekn_media_bin_pause (EknMediaBin *self)
{
  EknMediaBinPrivate *priv;

  g_return_if_fail (EKN_IS_MEDIA_BIN (self));
  priv = EMB_PRIVATE (self);

  priv->state = GST_STATE_PAUSED;
  gst_element_set_state (priv->play, GST_STATE_PAUSED);
}

/**
 * ekn_media_bin_stop:
 * @self: a #EknMediaBin
 *
 * Stop media playback
 */
void
ekn_media_bin_stop (EknMediaBin *self)
{
  EknMediaBinPrivate *priv;

  g_return_if_fail (EKN_IS_MEDIA_BIN (self));
  priv = EMB_PRIVATE (self);

  priv->state = GST_STATE_NULL;
  gst_element_set_state (priv->play, GST_STATE_NULL);
}

static void
ekn_media_bin_free_pixbuf (guchar *pixels, gpointer data)
{
  gst_sample_unref (GST_SAMPLE (data));
}

/**
 * ekn_media_bin_screenshot:
 * @self: a #EknMediaBin
 * @width: desired screenshot width or -1 for original size
 * @height: desired screenshot height or -1 for original size
 *
 * Takes a screenshot of the current frame.
 *
 * Returns: (transfer full): a new #GdkPixbuf
 */
GdkPixbuf *
ekn_media_bin_screenshot (EknMediaBin *self, gint width, gint height)
{
  EknMediaBinPrivate *priv;
  GdkPixbuf *retval = NULL;
  GstSample *sample;
  GstCaps   *caps;
  GstBuffer *buffer;
  GstMemory *memory = NULL;
  GstMapInfo info;

  g_return_val_if_fail (EKN_IS_MEDIA_BIN (self), NULL);
  priv = EMB_PRIVATE (self);

  /* Create a caps object with the desired format */
  caps = gst_caps_new_simple ("video/x-raw",
                              "format", G_TYPE_STRING, "RGB",
                              "pixel-aspect-ratio", GST_TYPE_FRACTION, 1, 1,
                              NULL);

  if (width >= 0 && width >= 0)
    gst_caps_set_simple (caps,
                         "width", G_TYPE_INT, width,
                         "height", G_TYPE_INT, height,
                         NULL);

  /* Get current sample in RGB */
  g_signal_emit_by_name (priv->play, "convert-sample", caps, &sample);
  gst_caps_unref (caps);

  if (!sample || !ekn_media_bin_get_sample_size (self, sample, &width, &height))
    {
      /* FIXME: gst does not suport converting from video/x-raw(memory:GLMemory) */
      g_warning ("Could not get video sample");
      return NULL;
    }

  /* The buffer remains valid as long as sample is valid */
  if ((buffer = gst_sample_get_buffer (sample)) && 
      (memory = gst_buffer_get_memory (buffer, 0)) &&
      gst_memory_map (memory, &info, GST_MAP_READ))
    {
      /* Create pixbuf from data with custom destroy function to free sample */
      retval = gdk_pixbuf_new_from_data (info.data,
                                         GDK_COLORSPACE_RGB, FALSE, 8,
                                         width, height,
                                         GST_ROUND_UP_4 (width * 3),
                                         ekn_media_bin_free_pixbuf,
                                         sample);
      gst_memory_unmap (memory, &info);
    }
  else
    {
      g_warning ("Could not map memory from sample");
      gst_sample_unref (sample);
    }

  gst_memory_unref (memory);

  return retval;
}
