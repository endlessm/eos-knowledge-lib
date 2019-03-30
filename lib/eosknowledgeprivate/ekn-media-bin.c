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
#include <gst/video/gstvideosink.h>
#include <gst/audio/gstaudiobasesink.h>
#include <epoxy/gl.h>

#ifdef DEBUG

#include <unistd.h>
#include <sys/types.h>
#include <sys/syscall.h>
#define WARN_IF_NOT_MAIN_THREAD if (getpid () != syscall (SYS_gettid)) g_warning ("%s %d not in main thread", __func__, __LINE__);

#endif

#define AUTOHIDE_TIMEOUT_DEFAULT 2  /* Controls autohide timeout in seconds */

#define INFO_N_COLUMNS           6  /* Number of info columns labels */

#define FPS_WINDOW_SIZE          2  /* Window size in seconds to calculate fps */

#define EMB_ICON_SIZE            GTK_ICON_SIZE_BUTTON

#define EMB_ICON_NAME_PLAY       "ekn-media-bin-play-symbolic"
#define EMB_ICON_NAME_PAUSE      "ekn-media-bin-pause-symbolic"
#define EMB_ICON_NAME_FULLSCREEN "ekn-media-bin-fullscreen-symbolic"
#define EMB_ICON_NAME_RESTORE    "ekn-media-bin-restore-symbolic"

#define EMB_INITIAL_STATE        GST_STATE_PAUSED

GST_DEBUG_CATEGORY_STATIC (ekn_media_bin_debug);
#define GST_CAT_DEFAULT ekn_media_bin_debug

struct _EknMediaBin
{
  GtkBox parent;
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
  gboolean audio_mode:1;

  /* We place extra flags here so the get squashed with the boolean properties */
  gboolean title_user_set:1;            /* True if the user set title property */
  gboolean description_user_set:1;      /* True if the user set description property */
  gboolean dump_dot_file:1;             /* True if GST_DEBUG_DUMP_DOT_DIR is set */
  gboolean ignore_adjustment_changes:1;

  /* Internal Widgets */
  GtkStack      *stack;
  GtkImage      *playback_image;
  GtkImage      *fullscreen_image;
  GtkAdjustment *playback_adjustment;
  GtkAdjustment *volume_adjustment;

  /* Internal Video Widgets */
  GtkWidget      *overlay;
  GtkWidget      *play_box;
  GtkScaleButton *volume_button;
  GtkWidget      *info_box;

  GtkLabel *title_label;
  GtkLabel *description_label;
  GtkLabel *info_column_label[INFO_N_COLUMNS];
  GtkLabel *duration_label;

  /* Thanks to GSK all the blitting will be done in GL */
  GtkRevealer *top_revealer;
  GtkRevealer *bottom_revealer;

  /* Internal Audio Widgets */
  GtkWidget      *audio_box;
  GtkScaleButton *audio_volume_button;
  GtkLabel       *audio_position_label;
  GtkImage       *audio_playback_image;

  /* Support Objects */
  GtkWidget *video_widget;      /* Created at runtime from sink */
  GtkWindow *fullscreen_window;
  GdkCursor *blank_cursor;
  GtkWidget *tmp_image;      /* FIXME: remove this once we can derive from GtkBin in Glade */

  /* Internal variables */
  guint timeout_id;          /* Autohide timeout source id */
  gint  timeout_count;       /* Autohide timeout count since last move event */

  guint  tick_id;           /* Widget frame clock tick callback (used to update UI) */
  gint64 tick_start;
  gint64 frames_window_start;
  guint  frames_window;     /* Frames "rendered" in the last FPS_WINDOW_SIZE seconds window */
  guint  frames_rendered;   /* Total frames "rendered" */
  GdkEventType pressed_button_type;

  gint video_width;
  gint video_height;

  /* Gst support */
  GstElement *play;          /* playbin element */
  GstElement *video_sink;    /* The video sink element used (glsinkbin or gtksink) */
  GstElement *vis_plugin;    /* The visualization plugin */
  GstBus     *bus;           /* playbin bus */
  GstBuffer  *last_buffer;

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
  PROP_AUDIO_MODE,
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
static void         ekn_media_bin_set_tick_enabled (EknMediaBin *self,
                                                    gboolean enabled);
static GtkWindow   *ekn_media_bin_window_new (EknMediaBin *self);
static const gchar *format_time (gint time);

static inline gint64
ekn_media_bin_get_position (EknMediaBin *self)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);
  gint64 position;

  if (!priv->play || !gst_element_query (priv->play, priv->position_query))
    return 0;

  gst_query_parse_position (priv->position_query, NULL, &position);

  return position;
}

static GstStateChangeReturn
ekn_media_bin_set_state (EknMediaBin *self, GstState state)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);

  priv->state = state;
  return gst_element_set_state (priv->play, state);
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
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);

  /* Do nothing in audio mode */
  if (priv->audio_mode)
    return;

  ekn_media_bin_set_fullscreen (self, !priv->fullscreen);
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
  GdkWindow *window;

  if (++priv->timeout_count < priv->autohide_timeout)
    return G_SOURCE_CONTINUE;
  
  window = gtk_widget_get_window (priv->overlay);
  
  if (window != NULL)
    gdk_window_set_cursor (window, priv->blank_cursor);

  gtk_revealer_set_reveal_child (priv->top_revealer, FALSE);
  gtk_revealer_set_reveal_child (priv->bottom_revealer, FALSE);

  priv->timeout_id = 0;

  return G_SOURCE_REMOVE;
}

static inline void
ensure_no_timeout(EknMediaBinPrivate *priv)
{
  if (!priv->timeout_id)
    return;

  g_source_remove (priv->timeout_id);
  priv->timeout_id = 0;
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
  else
   {
      GdkWindow *window = gtk_widget_get_window (priv->overlay);

      ensure_no_timeout (priv);

      if (window)
        gdk_window_set_cursor (window, NULL);
   }
}

static void
ekn_media_bin_action_toggle (EknMediaBin *self, const gchar *action)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);

  g_return_if_fail (action != NULL);

  if (g_str_equal (action, "playback"))
    ekn_media_bin_toggle_playback (self);
  else if (g_str_equal (action, "fullscreen"))
    ekn_media_bin_toggle_fullscreen (self);
  else if (g_str_equal (action, "show-stream-info"))
    {
      ekn_media_bin_set_show_stream_info (self, !priv->show_stream_info);
      ekn_media_bin_reveal_controls (self);
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
                           GST_SEEK_FLAG_ACCURATE,
                           seconds ? CLAMP (position, 0, priv->duration) : 0);
}

/* Signals handlers */
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
  /* Do not hide controls and restore pointer */
  ekn_media_bin_revealer_timeout (self, FALSE);

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

static GdkPixbuf *
ekn_media_bin_video_pixbuf_new (EknMediaBin *self)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);
  gint width, height, video_width, video_height, dx, dy;
  cairo_surface_t *surface;
  gdouble scale = 1.0;
  GdkPixbuf *pixbuf;
  cairo_t *cr;

  width = gtk_widget_get_allocated_width (GTK_WIDGET (self));
  height = gtk_widget_get_allocated_height (GTK_WIDGET (self));

  video_width = gtk_widget_get_allocated_width (priv->video_widget);
  video_height = gtk_widget_get_allocated_height (priv->video_widget);

  if ((width != video_width || height != video_height) &&
      priv->video_width && priv->video_height)
    {
      scale = MIN (width/(gdouble)priv->video_width, height/(gdouble)priv->video_height);

      dx = ABS (video_width - priv->video_width) * scale;
      dy = ABS (video_height - priv->video_height) * scale;
      width = video_width * scale;
      height = video_height * scale;
    }
  else
    dx = dy = 0;

  surface = cairo_image_surface_create (CAIRO_FORMAT_RGB24, width, height);
  cr = cairo_create (surface);

  if (scale != 1.0)
    cairo_scale (cr, scale, scale);

  gtk_widget_draw (priv->video_widget, cr);

  pixbuf = gdk_pixbuf_get_from_surface (surface, dx/2, dy/2, width-dx, height-dy);

  cairo_destroy (cr);
  cairo_surface_destroy (surface);

  return pixbuf;
}

static inline gboolean
ekn_media_bin_gl_check (GtkWidget *widget)
{
  static gsize gl_works = 0;

  if (g_once_init_enter (&gl_works))
    {
      GError *error = NULL;
      gsize works = 1;
      GdkGLContext *context;
      GdkWindow *window;

      if ((window  = gtk_widget_get_window (widget)) &&
           (context = gdk_window_create_gl_context (window, &error)))
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

        if (error)
          {
            GST_WARNING ("Could not window to create GL context, %s", error->message);
            g_error_free (error);
          }

      g_once_init_leave (&gl_works, works);
    }

  return (gl_works > 1);
}

static inline void
ekn_media_bin_init_video_sink (EknMediaBin *self)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);
  GtkWidget *video_widget = NULL;
  GstElement *video_sink = NULL;

  if (priv->video_sink)
    return;

  if (priv->audio_mode)
    {
      video_sink = gst_element_factory_make ("fakesink", "EknMediaBinNullSink");
      g_object_set (video_sink, "sync", TRUE, NULL);
      g_object_set (priv->play, "video-sink", video_sink, NULL);
      priv->video_sink = gst_object_ref_sink (video_sink);
      return;
    }

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
              g_object_get (gtkglsink, "widget", &video_widget, NULL);
            }
          else
            {
              GST_WARNING ("Could not create gtkglsink");
              gst_object_replace ((GstObject**)&video_sink, NULL);
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
      GST_INFO ("Falling back to gtksink");
      video_sink = gst_element_factory_make ("gtksink", NULL);
      g_object_get (video_sink, "widget", &video_widget, NULL);
    }

  /* We use a null sink as a last resort */
  if (video_sink && video_widget)
    {
      g_object_set (video_widget, "expand", TRUE, NULL);

      /* And pack it where we want the video to show up */
      gtk_container_add (GTK_CONTAINER (priv->overlay), video_widget);
      gtk_widget_show (video_widget);

      /* g_object_get() returns a new reference */
      priv->video_widget = video_widget;
    }
  else
    {
      GtkWidget *img = gtk_image_new_from_icon_name ("image-missing",
                                                     GTK_ICON_SIZE_DIALOG);

      GST_WARNING ("Could not get video widget from gtkglsink/gtksink, falling back to fakesink");

      g_object_unref (video_widget);
      gst_object_unref (video_sink);
      video_sink = gst_element_factory_make ("fakesink", "EknMediaBinFakeSink");
      g_object_set (video_sink, "sync", TRUE, NULL);

      gtk_container_add (GTK_CONTAINER (priv->overlay), img);
      gtk_widget_show (img);

      /* FIXME: the overlay does not get motion and press events with this code path */
    }

  /* Setup playbin video sink */
  if (video_sink)
    {
      g_object_set (priv->play, "video-sink", video_sink, NULL);
      priv->video_sink = gst_object_ref_sink (video_sink);
    }
}

static inline void
ekn_media_bin_deinit_video_sink (EknMediaBin *self)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);

  /* Stop Playback to give gst a chance to cleanup its mess */
  if (priv->play)
    gst_element_set_state (priv->play, GST_STATE_NULL);

  /* Stop bus watch */
  if (priv->bus)
    {
      gst_bus_set_flushing (priv->bus, TRUE);
      gst_bus_remove_watch (priv->bus);
      gst_object_replace ((GstObject**)&priv->bus, NULL);
    }

  /* Unref video sink */
  gst_object_replace ((GstObject**)&priv->video_sink, NULL);

  /* Unref video widget */
  g_clear_object (&priv->video_widget);

  /* Unref playbin */
  gst_object_replace ((GstObject**)&priv->play, NULL);
}

static void
ekn_media_bin_fullscreen_apply (EknMediaBin *self, gboolean fullscreen)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);
  gint64 position = -1;

  if ((fullscreen && priv->fullscreen_window) ||
      (!fullscreen && !priv->fullscreen_window))
    return;

  /*
   * To avoid flickering, this will make the widget pack an image with the last
   * frame in the container before reparenting the video widget in the
   * fullscreen window
   */
  if (!priv->tmp_image)
    {
      GdkPixbuf *pixbuf = ekn_media_bin_video_pixbuf_new (self);
      priv->tmp_image = gtk_image_new_from_pixbuf (pixbuf);
      g_object_set (priv->tmp_image, "expand", TRUE, NULL);
      g_object_unref (pixbuf);
    }

  /*
   * FIXME: GtkGstGLWidget does not support reparenting to a different toplevel
   * because the gl context is different and the pipeline does not know it
   * changes, so as a temporary workaround we simply reconstruct the whole
   * pipeline.
   *
   * See bug https://bugzilla.gnome.org/show_bug.cgi?id=775045
   */
  if ((priv->state == GST_STATE_PAUSED || priv->state == GST_STATE_PLAYING) &&
      g_strcmp0 (G_OBJECT_TYPE_NAME (priv->video_sink), "GstGLSinkBin") == 0)
    {
      /* NOTE: here we could set tmp_image to the content of the current sample
       * but it wont be updated until the main window is show at which point
       * we will see the old frame anyways.
       */
      position = ekn_media_bin_get_position (self);

      gtk_container_remove (GTK_CONTAINER (priv->overlay), priv->video_widget);
      ekn_media_bin_deinit_video_sink (self);
    }

  g_object_ref (priv->overlay);

  if (fullscreen)
    {
      priv->fullscreen_window = g_object_ref (ekn_media_bin_window_new (self));

      /* Reparent video widget in a fullscreen window */
      gtk_container_remove (GTK_CONTAINER (priv->stack), priv->overlay);

      /* Pack an image with the last frame inside the bin */
      gtk_container_add (GTK_CONTAINER (priv->stack), priv->tmp_image);
      gtk_widget_show (priv->tmp_image);
      gtk_stack_set_visible_child (GTK_STACK (priv->stack), priv->tmp_image);

      /* Pack video in the fullscreen window */
      gtk_container_add (GTK_CONTAINER (priv->fullscreen_window), priv->overlay);

      gtk_window_fullscreen (priv->fullscreen_window);
      gtk_window_present (priv->fullscreen_window);

      /* Hide cursor if controls are hidden */
      if (!gtk_revealer_get_reveal_child (priv->bottom_revealer))
        gdk_window_set_cursor (gtk_widget_get_window (GTK_WIDGET (priv->fullscreen_window)),
                               priv->blank_cursor);

      gtk_image_set_from_icon_name (priv->fullscreen_image, EMB_ICON_NAME_RESTORE, EMB_ICON_SIZE);
    }
  else
    {
      gtk_container_remove (GTK_CONTAINER (priv->stack), priv->tmp_image);
      priv->tmp_image = NULL;

      /* Reparent video widget back into ourselves */
      gtk_container_remove (GTK_CONTAINER (priv->fullscreen_window), priv->overlay);
      gtk_container_add (GTK_CONTAINER (priv->stack), priv->overlay);
      gtk_stack_set_visible_child (GTK_STACK (priv->stack), priv->overlay);

      gtk_widget_destroy (GTK_WIDGET (priv->fullscreen_window));
      g_clear_object (&priv->fullscreen_window);

      gtk_image_set_from_icon_name (priv->fullscreen_image, EMB_ICON_NAME_FULLSCREEN, EMB_ICON_SIZE);

      gtk_widget_grab_focus (GTK_WIDGET (self));
    }

  /*
   * FIXME: See bug https://bugzilla.gnome.org/show_bug.cgi?id=775045
   */
  if (priv->play == NULL)
    {
      ekn_media_bin_init_playbin (self);
      ekn_media_bin_init_video_sink (self);

      g_object_set (priv->play, "uri", priv->uri, NULL);

      /* Init new pipeline */
      gst_element_set_state (priv->play, GST_STATE_PAUSED);
      gst_element_get_state (priv->play, NULL, NULL, GST_CLOCK_TIME_NONE);

      /* Seek to position */
      gst_element_seek_simple (priv->play, GST_FORMAT_TIME,
                               GST_SEEK_FLAG_ACCURATE | GST_SEEK_FLAG_FLUSH,
                               position);
      gst_message_unref (gst_bus_pop_filtered (priv->bus, GST_MESSAGE_ASYNC_DONE));

      /* Resume playback */
      if (priv->state == GST_STATE_PLAYING)
        {
          gst_element_set_state (priv->play, GST_STATE_PLAYING);
          gst_element_get_state (priv->play, NULL, NULL, GST_CLOCK_TIME_NONE);
        }
    }

  g_object_unref (priv->overlay);
}

static void
on_ekn_media_bin_realize (GtkWidget *widget, EknMediaBin *self)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);

  /* Create a blank_cursor */
  priv->blank_cursor = gdk_cursor_new_from_name (gtk_widget_get_display (widget),
                                                 "none");

  /* Create video sink */
  ekn_media_bin_init_video_sink (self);

  if (priv->fullscreen)
    ekn_media_bin_fullscreen_apply (self, TRUE);

  /* Make playbin show the first video frame if there is an URI */
  ekn_media_bin_update_state (self);

  /* Disconnect after initialization */
  g_signal_handlers_disconnect_by_func (widget, on_ekn_media_bin_realize, self);
}

static void
on_ekn_media_bin_unrealize (GtkWidget *widget, EknMediaBin *self)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);

  /* Remove controls timeout */
  ensure_no_timeout (priv);

  /* Disconnect after completion */
  g_signal_handlers_disconnect_by_func (widget, on_ekn_media_bin_unrealize, self);
}

static gboolean
ekn_media_bin_error (EknMediaBin *self, GError *error)
{
  /* TODO: properly present errors to the user */
  g_warning ("%s", error->message);
  return TRUE;
}

static void
ekn_media_bin_init_volume_button (EknMediaBin    *self,
                                  GtkScaleButton *button,
                                  gboolean        stop_timeout)
{
  GtkWidget *popup = gtk_scale_button_get_popup (button);

  if (stop_timeout)
    {
      g_signal_connect (popup, "show", G_CALLBACK (on_volume_popup_show), self);
      g_signal_connect (popup, "hide", G_CALLBACK (on_volume_popup_hide), self);
    }

  gtk_style_context_add_class (gtk_widget_get_style_context (popup), "ekn-media-bin");

  /* Hide volume popup buttons */
  gtk_widget_hide (gtk_scale_button_get_plus_button (button));
  gtk_widget_hide (gtk_scale_button_get_minus_button (button));
}

static void
ekn_media_bin_init (EknMediaBin *self)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);
  gint i;

  gtk_widget_init_template (GTK_WIDGET (self));

  priv->state = EMB_INITIAL_STATE;
  priv->autohide_timeout = AUTOHIDE_TIMEOUT_DEFAULT;
  priv->pressed_button_type = GDK_NOTHING;
  priv->dump_dot_file = (g_getenv ("GST_DEBUG_DUMP_DOT_DIR") != NULL);

  ekn_media_bin_init_playbin (self);

  /* Create info box column labels */
  for (i = 0; i < INFO_N_COLUMNS; i++)
    {
      GtkWidget *label = gtk_label_new ("");
      priv->info_column_label[i] = GTK_LABEL (label);
      gtk_container_add (GTK_CONTAINER (priv->info_box), label);
      gtk_widget_set_valign (label, GTK_ALIGN_START);
      gtk_widget_show (label);
    }

  /* Cache position query */
  priv->position_query = gst_query_new_position (GST_FORMAT_TIME);

  /* Make both buttons look the same */
  g_object_bind_property (priv->playback_image, "icon-name",
                          priv->audio_playback_image, "icon-name",
                          G_BINDING_SYNC_CREATE);

  ekn_media_bin_init_volume_button (self, priv->volume_button, TRUE);
  ekn_media_bin_init_volume_button (self, priv->audio_volume_button, FALSE);
}

static void
ekn_media_bin_dispose (GObject *object)
{
  EknMediaBin *self = EKN_MEDIA_BIN (object);
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);

  /* Remove controls timeout */
  ensure_no_timeout (priv);

  /* Finalize gstreamer related objects */
  ekn_media_bin_deinit_video_sink (self);

  /* Destroy fullscreen window */
  if (priv->fullscreen_window)
    {
      gtk_widget_destroy (GTK_WIDGET (priv->fullscreen_window));
      g_clear_object (&priv->fullscreen_window);
    }

  /* Unref cursor */
  g_clear_object (&priv->blank_cursor);

  G_OBJECT_CLASS (ekn_media_bin_parent_class)->dispose (object);
}

static void
ekn_media_bin_finalize (GObject *object)
{
  EknMediaBin *self = EKN_MEDIA_BIN (object);
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);

  ensure_no_timeout(priv);

  /* Clear position query */
  g_clear_pointer (&priv->position_query, gst_query_unref);

  /* Remove frame clock tick callback */
  ekn_media_bin_set_tick_enabled (self, FALSE);

  /* Clear tag lists */
  g_clear_pointer (&priv->audio_tags, gst_tag_list_unref);
  g_clear_pointer (&priv->video_tags, gst_tag_list_unref);
  g_clear_pointer (&priv->text_tags, gst_tag_list_unref);

  /* Free properties */
  g_clear_pointer (&priv->uri, g_free);
  g_clear_pointer (&priv->title, g_free);
  g_clear_pointer (&priv->description, g_free);

  G_OBJECT_CLASS (ekn_media_bin_parent_class)->finalize (object);
}

static inline void
ekn_media_bin_set_audio_mode (EknMediaBin *self, gboolean audio_mode)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);

  priv->audio_mode = audio_mode;

  if (audio_mode)
    gtk_stack_set_visible_child (GTK_STACK (priv->stack), priv->audio_box);
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
    case PROP_AUDIO_MODE:
      ekn_media_bin_set_audio_mode (EKN_MEDIA_BIN (object),
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
      g_value_set_double (value, gtk_adjustment_get_value (priv->volume_adjustment));
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
    case PROP_AUDIO_MODE:
      g_value_set_boolean (value, priv->audio_mode);
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

static GtkSizeRequestMode
ekn_media_bin_get_request_mode (GtkWidget *self)
{
  return GTK_SIZE_REQUEST_CONSTANT_SIZE;
}


static void
ekn_media_bin_get_preferred_width (GtkWidget *self,
                                   gint      *minimum_width,
                                   gint      *natural_width)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (EKN_MEDIA_BIN (self));

  if (priv->audio_mode)
    {
      GTK_WIDGET_CLASS (ekn_media_bin_parent_class)->get_preferred_width
        (self, minimum_width, natural_width);
    }
  else
    {
      *minimum_width = 320;
      *natural_width = priv->video_width ? priv->video_width : 640;
    }
}

static void
ekn_media_bin_get_preferred_height (GtkWidget *self,
                                    gint      *minimum_height,
                                    gint      *natural_height)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (EKN_MEDIA_BIN (self));

  if (priv->audio_mode)
    {
      GTK_WIDGET_CLASS (ekn_media_bin_parent_class)->get_preferred_height
        (self, minimum_height, natural_height);
    }
  else
    {
      *minimum_height = 240;
      *natural_height = priv->video_height ? priv->video_height : 480;
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

  object_class->dispose = ekn_media_bin_dispose;
  object_class->finalize = ekn_media_bin_finalize;
  object_class->set_property = ekn_media_bin_set_property;
  object_class->get_property = ekn_media_bin_get_property;

  widget_class->get_request_mode = ekn_media_bin_get_request_mode;
  widget_class->get_preferred_width = ekn_media_bin_get_preferred_width;
  widget_class->get_preferred_height = ekn_media_bin_get_preferred_height;

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

  properties[PROP_AUDIO_MODE] =
    g_param_spec_boolean ("audio-mode",
                          "Audio Mode",
                          "Wheter to show controls suitable for audio files only",
                          FALSE,
                          G_PARAM_READWRITE | G_PARAM_CONSTRUCT_ONLY);

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

  gtk_widget_class_bind_template_child_private (widget_class, EknMediaBin, stack);
  gtk_widget_class_bind_template_child_private (widget_class, EknMediaBin, playback_adjustment);
  gtk_widget_class_bind_template_child_private (widget_class, EknMediaBin, volume_adjustment);
  gtk_widget_class_bind_template_child_private (widget_class, EknMediaBin, playback_image);
  gtk_widget_class_bind_template_child_private (widget_class, EknMediaBin, fullscreen_image);

  gtk_widget_class_bind_template_child_private (widget_class, EknMediaBin, overlay);
  gtk_widget_class_bind_template_child_private (widget_class, EknMediaBin, play_box);
  gtk_widget_class_bind_template_child_private (widget_class, EknMediaBin, volume_button);
  gtk_widget_class_bind_template_child_private (widget_class, EknMediaBin, title_label);
  gtk_widget_class_bind_template_child_private (widget_class, EknMediaBin, description_label);
  gtk_widget_class_bind_template_child_private (widget_class, EknMediaBin, info_box);
  gtk_widget_class_bind_template_child_private (widget_class, EknMediaBin, duration_label);
  gtk_widget_class_bind_template_child_private (widget_class, EknMediaBin, top_revealer);
  gtk_widget_class_bind_template_child_private (widget_class, EknMediaBin, bottom_revealer);

  gtk_widget_class_bind_template_child_private (widget_class, EknMediaBin, audio_box);
  gtk_widget_class_bind_template_child_private (widget_class, EknMediaBin, audio_volume_button);
  gtk_widget_class_bind_template_child_private (widget_class, EknMediaBin, audio_position_label);
  gtk_widget_class_bind_template_child_private (widget_class, EknMediaBin, audio_playback_image);

  gtk_widget_class_bind_template_callback (widget_class, on_ekn_media_bin_realize);
  gtk_widget_class_bind_template_callback (widget_class, on_ekn_media_bin_unrealize);

  gtk_widget_class_bind_template_callback (widget_class, on_overlay_motion_notify_event);
  gtk_widget_class_bind_template_callback (widget_class, on_overlay_button_press_event);
  gtk_widget_class_bind_template_callback (widget_class, on_overlay_button_release_event);

  gtk_widget_class_bind_template_callback (widget_class, on_revealer_motion_notify_event);
  gtk_widget_class_bind_template_callback (widget_class, on_revealer_leave_notify_event);

  gtk_widget_class_bind_template_callback (widget_class, on_progress_scale_format_value);
  gtk_widget_class_bind_template_callback (widget_class, on_playback_adjustment_value_changed);

  gtk_widget_class_bind_template_callback (widget_class, ekn_media_bin_toggle_playback);
  gtk_widget_class_bind_template_callback (widget_class, ekn_media_bin_toggle_fullscreen);

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

  if (!gst_element_query_duration (priv->play, GST_FORMAT_TIME, &duration)
      || priv->duration == duration)
    return;

  priv->duration = duration;

  duration = GST_TIME_AS_SECONDS (duration);
  gtk_label_set_label (priv->duration_label, format_time (duration));
  gtk_adjustment_set_upper (priv->playback_adjustment, duration);
}

static inline void
ekn_media_bin_update_position (EknMediaBin *self)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);
  gint position = GST_TIME_AS_SECONDS (ekn_media_bin_get_position (self));

  if (priv->position == position)
    return;

  priv->position = position;

  priv->ignore_adjustment_changes = TRUE;
  gtk_adjustment_set_value (priv->playback_adjustment, position);
  priv->ignore_adjustment_changes = FALSE;

  gtk_label_set_label (priv->audio_position_label, format_time (position));
}

static inline void
log_fps (EknMediaBin *self, GdkFrameClock *frame_clock)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);
  gint64 frame_time, time;
  GstSample *sample;

  /* Get current buffer and return if its the same as last tick */
  g_object_get (priv->play, "sample", &sample, NULL);
  if (sample)
    {
      GstBuffer *buffer = gst_sample_get_buffer (sample);
      gst_sample_unref (sample);
      
      if (priv->last_buffer == buffer)
        return;

      priv->last_buffer = buffer;
    }
  else
    return;

  frame_time = gdk_frame_clock_get_frame_time (frame_clock);

  /* Initialize state variables */
  if (priv->tick_start == 0)
    {
      priv->tick_start = frame_time;
      priv->frames_window_start = frame_time;
      priv->frames_window = 0;
      priv->frames_rendered = 0;
    }
  else if (priv->frames_window == 0)
    priv->frames_window_start = frame_time;

  priv->frames_window++;

  /* We only print FPS once every FPS_WINDOW_SIZE seconds */
  time = frame_time - priv->frames_window_start;
  if (time < FPS_WINDOW_SIZE * 1000000)
    return;

  priv->frames_rendered += priv->frames_window;

  GST_INFO ("FPS: %lf average: %lf",
            priv->frames_window / (time / 1000000.0),
            priv->frames_rendered / ((frame_time - priv->tick_start) / 1000000.0));

  priv->frames_window = 0;
}

static gboolean
ekn_media_bin_tick_callback (GtkWidget     *widget,
                             GdkFrameClock *frame_clock,
                             gpointer       user_data)
{
  static GstDebugLevel level;

  ekn_media_bin_update_position ((EknMediaBin *)widget);

  if (level == 0)
    level = gst_debug_category_get_threshold (ekn_media_bin_debug);

  if (level >= GST_LEVEL_INFO)
    log_fps ((EknMediaBin *)widget, frame_clock);

  return G_SOURCE_CONTINUE;
}

static void
ekn_media_bin_set_tick_enabled (EknMediaBin *self, gboolean enabled)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);

  if (priv->tick_id)
    {
      gtk_widget_remove_tick_callback (GTK_WIDGET (self), priv->tick_id);
      priv->tick_id = priv->tick_start = 0;
    }

  if (enabled)
    priv->tick_id = gtk_widget_add_tick_callback (GTK_WIDGET (self),
                                                  ekn_media_bin_tick_callback,
                                                  NULL, NULL);
}

static inline void
ekn_media_bin_dump_dot (EknMediaBin *self, GstState old, GstState new)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);
  gchar *filename;

  filename = g_strdup_printf ("%s_%s_%s", g_get_prgname (),
                              gst_element_state_get_name (old),
                              gst_element_state_get_name (new));
  gst_debug_bin_to_dot_file_with_ts (GST_BIN (priv->play),
                                     GST_DEBUG_GRAPH_SHOW_ALL,
                                     filename);
  g_free (filename);
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

  GST_DEBUG ("State changed from %s to %s",
             gst_element_state_get_name (old_state),
             gst_element_state_get_name (new_state));

  if (priv->dump_dot_file)
    ekn_media_bin_dump_dot (self, old_state, new_state);

  /* Update UI */
  if (old_state == GST_STATE_READY && new_state == GST_STATE_PAUSED)
    {
      gtk_image_set_from_icon_name (priv->playback_image, EMB_ICON_NAME_PLAY, EMB_ICON_SIZE);
      widget_set_visible (priv->play_box, TRUE);
      ekn_media_bin_update_duration (self);
    }
  else if (new_state == GST_STATE_PLAYING)
    {
      widget_set_visible (priv->play_box, FALSE);
      gtk_image_set_from_icon_name (priv->playback_image, EMB_ICON_NAME_PAUSE, EMB_ICON_SIZE);
      ekn_media_bin_set_tick_enabled (self, TRUE);
    }
  else
    {
      gtk_image_set_from_icon_name (priv->playback_image, EMB_ICON_NAME_PLAY, EMB_ICON_SIZE);
      widget_set_visible (priv->play_box, TRUE);
      priv->position = 0;
      ekn_media_bin_set_tick_enabled (self, FALSE);
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
meta_data_strings_set_title (MetaDataStrings *metadata, const gchar *title)
{
  g_string_assign (metadata->tag, title);
  g_string_assign (metadata->val, "");
}

static inline void
meta_data_strings_set_info (MetaDataStrings *metadata,
                            GtkLabel        *left,
                            GtkLabel        *right,
                            GstTagList      *tags)
{
  if (tags)
    {
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

  meta_data_strings_set_title (&metadata, "Audio:");
  meta_data_strings_set_info (&metadata,
                              priv->info_column_label[0],
                              priv->info_column_label[1],
                              priv->audio_tags);

  meta_data_strings_set_title (&metadata, "Video:");
  if (priv->video_width && priv->video_height)
    {
      g_string_append_printf (metadata.tag, "\n    video-resolution");
      g_string_append_printf (metadata.val, "\n: %dx%d", priv->video_width, priv->video_height);
    }
  meta_data_strings_set_info (&metadata,
                              priv->info_column_label[2],
                              priv->info_column_label[3],
                              priv->video_tags);

  meta_data_strings_set_title (&metadata, "Text:");
  meta_data_strings_set_info (&metadata,
                              priv->info_column_label[4],
                              priv->info_column_label[5],
                              priv->text_tags);

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

static inline void
ekn_media_bin_handle_msg_eos (EknMediaBin *self, GstMessage *msg)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);

  GST_DEBUG ("Got EOS");

  gst_element_set_state (priv->play, GST_STATE_NULL);
  ekn_media_bin_set_state (self, EMB_INITIAL_STATE);
  ekn_media_bin_update_position (self);
}

static inline void
ekn_media_bin_post_message_application (EknMediaBin *self, const gchar *name)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);
  GstStructure *data = gst_structure_new (name, NULL, NULL);

  /* Post message on the bus for the main thread to pick it up */
  gst_element_post_message (priv->play,
                            gst_message_new_application (GST_OBJECT (priv->play),
                                                         data));
}

static inline void
ekn_media_bin_handle_msg_tag (EknMediaBin *self, GstMessage *msg)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);
  GstObject *src = GST_MESSAGE_SRC (msg);
  GstTagList *tags = NULL, *old_tags = NULL;
  const gchar *type = NULL;

  gst_message_parse_tag (msg, &tags);

  if (g_type_is_a (G_OBJECT_TYPE (src), GST_TYPE_VIDEO_SINK))
    {
      type = "video-tags-changed";
      old_tags = priv->video_tags;
      priv->video_tags = gst_tag_list_merge (old_tags, tags, GST_TAG_MERGE_REPLACE);
    }
  else if (g_type_is_a (G_OBJECT_TYPE (src), GST_TYPE_AUDIO_BASE_SINK))
    {
      type = "audio-tags-changed";
      old_tags = priv->audio_tags;
      priv->audio_tags = gst_tag_list_merge (old_tags, tags, GST_TAG_MERGE_REPLACE);
    }

  /* Post message on the bus for the main thread to pick it up */
  if (type)
    ekn_media_bin_post_message_application (self, type);

  gst_tag_list_unref (tags);
  g_clear_pointer (&old_tags, gst_tag_list_unref);
}

static inline void
ekn_media_bin_handle_streams_selected (EknMediaBin *self, GstMessage *msg)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);
  GstStreamCollection *collection = NULL;
  GstStructure *caps_struct;
  GstStream *stream;
  GstCaps *caps;
  gint i, n, w, h;

  gst_message_parse_streams_selected (msg, &collection);
  n = gst_stream_collection_get_size (collection);

  for (i = 0; i < n; i++)
    {
      stream = gst_stream_collection_get_stream (collection, i);

      if (gst_stream_get_stream_type (stream) == GST_STREAM_TYPE_VIDEO)
        break;
    }

  caps = gst_stream_get_caps (stream);
  caps_struct = gst_caps_get_structure (caps, 0);

  if (gst_structure_get_int (caps_struct, "width", &w) &&
      gst_structure_get_int (caps_struct, "height", &h))
    {
      if (priv->video_width != w || priv->video_height != h)
        {
          priv->video_width = w;
          priv->video_height = h;
          gtk_widget_queue_resize (GTK_WIDGET (self));
        }
    }
  else
    priv->video_width = priv->video_height = 0;

  gst_caps_unref (caps);
  gst_object_unref (collection);
}

static gboolean
ekn_media_bin_bus_watch (GstBus *bus, GstMessage *msg, gpointer data)
{
  EknMediaBin *self = data;

  switch (GST_MESSAGE_TYPE (msg))
    {
    case GST_MESSAGE_APPLICATION:
      ekn_media_bin_handle_msg_application (self, msg);
      break;
    case GST_MESSAGE_DURATION_CHANGED:
      ekn_media_bin_update_duration (self);
      break;
    case GST_MESSAGE_EOS:
      ekn_media_bin_handle_msg_eos (self, msg);
      break;
    case GST_MESSAGE_ERROR:
      return ekn_media_bin_handle_msg_error (self, msg);
    case GST_MESSAGE_STATE_CHANGED:
      ekn_media_bin_handle_msg_state_changed (self, msg);
      break;
    case GST_MESSAGE_STREAMS_SELECTED:
      ekn_media_bin_handle_streams_selected (self, msg);
      break;
    case GST_MESSAGE_TAG:
      ekn_media_bin_handle_msg_tag (self, msg);
      break;
    default:
      break;
    }

  return G_SOURCE_CONTINUE;
}

static void
ekn_media_bin_init_playbin (EknMediaBin *self)
{
  EknMediaBinPrivate *priv = EMB_PRIVATE (self);

  priv->play = gst_element_factory_make ("playbin3", "EknMediaBinPlayBin");
  gst_object_ref_sink (priv->play);

  /* Setup volume */
  /* NOTE: Bidirectional binding makes the app crash on X11 */
  g_object_bind_property (priv->volume_adjustment, "value",
                          priv->play, "volume",
                          G_BINDING_SYNC_CREATE);

  /* Watch bus */
  priv->bus = gst_pipeline_get_bus (GST_PIPELINE (priv->play));
  gst_bus_add_watch (priv->bus, ekn_media_bin_bus_watch, self);
}

/********************************* Public API *********************************/

/**
 * ekn_media_bin_new:
 * @audio_mode:
 *
 * Returns a new #EknMediaBin
 *
 */
GtkWidget *
ekn_media_bin_new (gboolean audio_mode)
{
  return (GtkWidget*) g_object_new (EKN_TYPE_MEDIA_BIN,
                                    "audio-mode", audio_mode,
                                    NULL);
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

  /* Clear tag lists */
  if (priv->audio_tags)
    {
      g_clear_pointer (&priv->audio_tags, gst_tag_list_unref);
      ekn_media_bin_post_message_application (self, "audio-tags-changed");
    }

  if (priv->video_tags)
    {
      g_clear_pointer (&priv->video_tags, gst_tag_list_unref);
      ekn_media_bin_post_message_application (self, "video-tags-changed");
    }

  if (priv->text_tags)
    {
      g_clear_pointer (&priv->text_tags, gst_tag_list_unref);
      ekn_media_bin_post_message_application (self, "text-tags-changed");
    }
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
  gtk_label_set_label (priv->description_label, description);
  gtk_widget_set_visible (GTK_WIDGET (priv->description_label), description != NULL);
  priv->description_user_set = TRUE;
)

/**
 * ekn_media_bin_get_volume:
 * @self: a #EknMediaBin
 *
 * Returns audio volume from 0.0 to 1.0
 */
EMB_DEFINE_GETTER_FULL (gdouble, volume, 1.0,
  return gtk_adjustment_get_value (EMB_PRIVATE (self)->volume_adjustment);
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
  gtk_adjustment_get_value (priv->volume_adjustment) != volume,
  gtk_adjustment_set_value (priv->volume_adjustment, volume),
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

  ekn_media_bin_set_state (self, GST_STATE_PLAYING);
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
  g_return_if_fail (EKN_IS_MEDIA_BIN (self));
  ekn_media_bin_set_state (self, GST_STATE_PAUSED);
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
  g_return_if_fail (EKN_IS_MEDIA_BIN (self));
  ekn_media_bin_set_state (self, GST_STATE_NULL);
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

  if (sample)
    {
      GstStructure *caps_struct;

      if (!(caps = gst_sample_get_caps (sample)))
        return NULL;

      caps_struct = gst_caps_get_structure (caps, 0);

      if (!(gst_structure_get_int (caps_struct, "width", &width) &&
            gst_structure_get_int (caps_struct, "height", &height)))
        return NULL;
    }
  else
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
