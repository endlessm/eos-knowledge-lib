#include <gst/gst.h>
#include <ekn-media-bin.h>

static void
on_title_notify (GObject *gobject, GParamSpec *pspec, GtkWidget *window)
{
  gtk_window_set_title (GTK_WINDOW (window),
                        ekn_media_bin_get_title (EKN_MEDIA_BIN (gobject)));
}

int
main (int argc, char **argv)
{
  GtkWidget *window, *bin;
  gchar *title;

  gst_init (&argc, &argv);
  gtk_init (&argc, &argv);

  if (argc < 2)
    {
      g_print ("Usage: %s file:///full/path/to/media/file\n", argv[0]);
      return 0;
    }

  /* Make sure animations are enabled, just in case we are running inside a VM */
  g_object_set (gtk_settings_get_default (), "gtk-enable-animations", TRUE, NULL);

  /* Create main window */
  window = gtk_window_new (GTK_WINDOW_TOPLEVEL);

  /* Set some sane defaults */
  gtk_window_set_default_size (GTK_WINDOW (window), 800, 450);
  gtk_window_set_title (GTK_WINDOW (window), "Eos Player");
  gtk_window_set_position (GTK_WINDOW (window), GTK_WIN_POS_CENTER);

  /* Quit app on delete-event */
  g_signal_connect (window, "delete-event", G_CALLBACK (gtk_main_quit), NULL);

  bin = ekn_media_bin_new (FALSE);
  ekn_media_bin_set_uri (EKN_MEDIA_BIN (bin), argv[1]);
  gtk_container_add (GTK_CONTAINER (window), bin);

  /* Update window title */
  g_signal_connect (bin, "notify::title", G_CALLBACK (on_title_notify), window);

  title = g_path_get_basename (argv[1]);
  ekn_media_bin_set_title (EKN_MEDIA_BIN (bin), title);
  g_free (title);

  gtk_widget_show_all (window);

  gtk_main ();

  return 0;
}
