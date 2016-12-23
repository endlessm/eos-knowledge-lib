/* -*- mode: C; c-file-style: "gnu"; indent-tabs-mode: nil; -*- */
/*
 * ekn-media-bin.h
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

#pragma once

#include <gtk/gtk.h>

G_BEGIN_DECLS

#define EKN_TYPE_MEDIA_BIN (ekn_media_bin_get_type ())
G_DECLARE_FINAL_TYPE (EknMediaBin, ekn_media_bin, EKN, MEDIA_BIN, GtkBox)

GtkWidget     *ekn_media_bin_new                  (gboolean audio_mode);

const gchar   *ekn_media_bin_get_uri              (EknMediaBin *self);
void           ekn_media_bin_set_uri              (EknMediaBin *self,
                                                   const gchar *uri);

gdouble        ekn_media_bin_get_volume           (EknMediaBin *self);
void           ekn_media_bin_set_volume           (EknMediaBin *self,
                                                   gdouble      volume);

gint           ekn_media_bin_get_autohide_timeout (EknMediaBin *self);
void           ekn_media_bin_set_autohide_timeout (EknMediaBin *self,
                                                   gint         autohide_timeout);

gboolean       ekn_media_bin_get_fullscreen       (EknMediaBin *self);
void           ekn_media_bin_set_fullscreen       (EknMediaBin *self,
                                                   gboolean     fullscreen);

gboolean       ekn_media_bin_get_show_stream_info (EknMediaBin *self);
void           ekn_media_bin_set_show_stream_info (EknMediaBin *self,
                                                   gboolean     show_stream_info);

const gchar   *ekn_media_bin_get_title            (EknMediaBin *self);
void           ekn_media_bin_set_title            (EknMediaBin *self,
                                                   const gchar *title);

const gchar   *ekn_media_bin_get_description      (EknMediaBin *self);
void           ekn_media_bin_set_description      (EknMediaBin *self,
                                                   const gchar *description);


void           ekn_media_bin_play                 (EknMediaBin *self);
void           ekn_media_bin_pause                (EknMediaBin *self);
void           ekn_media_bin_stop                 (EknMediaBin *self);

GdkPixbuf     *ekn_media_bin_screenshot           (EknMediaBin *self,
                                                   gint         width,
                                                   gint         height);

G_END_DECLS
