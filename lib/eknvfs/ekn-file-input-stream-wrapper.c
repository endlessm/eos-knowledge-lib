/* -*- mode: C; c-file-style: "gnu"; indent-tabs-mode: nil; -*- */
/*
 * ekn-file-input-stream-wrapper.c
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
 */

#include "ekn-file-input-stream-wrapper.h"

struct _EknFileInputStreamWrapper
{
  GFileInputStream parent;

  GInputStream *stream;
  GFile *file;
};
typedef struct _EknFileInputStreamWrapper EknFileInputStreamWrapper;

enum
{
  PROP_0,
  PROP_STREAM,
  PROP_FILE,
  LAST_PROP,
};

static GParamSpec *obj_props[LAST_PROP];

G_DEFINE_TYPE (EknFileInputStreamWrapper,
               ekn_file_input_stream_wrapper,
               G_TYPE_FILE_INPUT_STREAM)

static void
ekn_file_input_stream_wrapper_dispose (GObject *object)
{
  EknFileInputStreamWrapper *self = EKN_FILE_INPUT_STREAM_WRAPPER (object);

  g_clear_object (&self->stream);
  g_clear_object (&self->file);

  G_OBJECT_CLASS (ekn_file_input_stream_wrapper_parent_class)->dispose (object);
}

static void
ekn_file_input_stream_wrapper_set_property (GObject          *object,
                                            guint             prop_id,
                                            const GValue     *value,
                                            GParamSpec       *pspec)
{
  EknFileInputStreamWrapper *self = EKN_FILE_INPUT_STREAM_WRAPPER (object);

  switch (prop_id)
    {
    case PROP_STREAM:
      self->stream = g_value_dup_object (value);
      break;
    case PROP_FILE:
      self->file = g_value_dup_object (value);
      break;
    default:
      G_OBJECT_WARN_INVALID_PROPERTY_ID (object, prop_id, pspec);
    }
}

static void
ekn_file_input_stream_wrapper_get_property (GObject    *object,
                                            guint       prop_id,
                                            GValue     *value,
                                            GParamSpec *pspec)
{
  EknFileInputStreamWrapper *self = EKN_FILE_INPUT_STREAM_WRAPPER (object);

  switch (prop_id)
    {
    case PROP_STREAM:
      g_value_set_object (value, self->stream);
      break;
    case PROP_FILE:
      g_value_set_object (value, self->file);
      break;
    default:
      G_OBJECT_WARN_INVALID_PROPERTY_ID (object, prop_id, pspec);
    }
}

#define return_error_if_fail(expr,code,msg,val) \
if (!(expr)) \
  { \
    g_warning ("%s "#expr" failed", __func__); \
    g_set_error_literal (error, G_IO_ERROR, code, msg); \
    return val;\
  }\

#define return_error_if_no_stream(val) \
  return_error_if_fail (self->stream, G_IO_ERROR_FAILED, "No input stream to wrap", val)

static gssize
ekn_file_input_stream_wrapper_read (GInputStream  *stream,
                                    void          *buffer,
                                    gsize          count,
                                    GCancellable  *cancellable,
                                    GError       **error)
{
  EknFileInputStreamWrapper *self = EKN_FILE_INPUT_STREAM_WRAPPER (stream);

  return_error_if_no_stream (-1);

  return g_input_stream_read (self->stream, buffer, count, cancellable, error);
}

static gboolean
ekn_file_input_stream_wrapper_close (GInputStream  *stream,
                                     GCancellable  *cancellable,
                                     GError       **error)
{
  EknFileInputStreamWrapper *self = EKN_FILE_INPUT_STREAM_WRAPPER (stream);

  /* This happens on dispose */
  if (!self->stream)
    {
      g_set_error_literal (error, G_IO_ERROR, G_IO_ERROR_CLOSED, "Stream already closed");
      return FALSE;
    }

  return g_input_stream_close (self->stream, cancellable, error);
}

static gssize
ekn_file_input_stream_wrapper_skip (GInputStream  *stream,
                                    gsize          count,
                                    GCancellable  *cancellable,
                                    GError       **error)
{
  EknFileInputStreamWrapper *self = EKN_FILE_INPUT_STREAM_WRAPPER (stream);

  return_error_if_no_stream (-1);

  return g_input_stream_skip (self->stream, count, cancellable, error);
}

static goffset
ekn_file_input_stream_wrapper_tell (GFileInputStream *stream)
{
  EknFileInputStreamWrapper *self = EKN_FILE_INPUT_STREAM_WRAPPER (stream);

  g_return_val_if_fail (self->stream, 0);

  if (!G_IS_SEEKABLE (self->stream))
    return 0;

  return g_seekable_tell (G_SEEKABLE (self->stream));
}

static gboolean
ekn_file_input_stream_wrapper_can_seek (GFileInputStream *stream)
{
  EknFileInputStreamWrapper *self = EKN_FILE_INPUT_STREAM_WRAPPER (stream);

  g_return_val_if_fail (self->stream, FALSE);

  return G_IS_SEEKABLE (self->stream) && g_seekable_can_seek (G_SEEKABLE (self->stream));
}

static gboolean
ekn_file_input_stream_wrapper_seek (GFileInputStream *stream,
                                    goffset offset,
                                    GSeekType type,
                                    GCancellable *cancellable,
                                    GError **error)
{
  EknFileInputStreamWrapper *self = EKN_FILE_INPUT_STREAM_WRAPPER (stream);

  return_error_if_no_stream (FALSE);
  return_error_if_fail (G_IS_SEEKABLE (self->stream), G_IO_ERROR_NOT_SUPPORTED,
                        "Input stream doesn't implement seek", FALSE);

  return g_seekable_seek (G_SEEKABLE (self->stream), offset, type, cancellable, error);
}

static GFileInfo *
ekn_file_input_stream_wrapper_query_info (GFileInputStream  *stream,
                                          const char        *attributes,
                                          GCancellable      *cancellable,
                                          GError           **error)
{
  EknFileInputStreamWrapper *self = EKN_FILE_INPUT_STREAM_WRAPPER (stream);

  return_error_if_fail (self->file, G_IO_ERROR_FAILED, "No GFile to wrap", NULL);

  return g_file_query_info (self->file, attributes, 0, cancellable, error);
}

static void
ekn_file_input_stream_wrapper_class_init (EknFileInputStreamWrapperClass *klass)
{
  GObjectClass *gobject_class = G_OBJECT_CLASS (klass);
  GInputStreamClass *istream_class;
  GFileInputStreamClass *fileistream_klass;

  gobject_class->dispose = ekn_file_input_stream_wrapper_dispose;
  gobject_class->set_property = ekn_file_input_stream_wrapper_set_property;
  gobject_class->get_property = ekn_file_input_stream_wrapper_get_property;

  istream_class = G_INPUT_STREAM_CLASS (klass);
  istream_class->read_fn = ekn_file_input_stream_wrapper_read;
  istream_class->close_fn = ekn_file_input_stream_wrapper_close;
  istream_class->skip = ekn_file_input_stream_wrapper_skip;

  fileistream_klass = G_FILE_INPUT_STREAM_CLASS (klass);
  fileistream_klass->tell = ekn_file_input_stream_wrapper_tell;
  fileistream_klass->can_seek = ekn_file_input_stream_wrapper_can_seek;
  fileistream_klass->seek = ekn_file_input_stream_wrapper_seek;
  fileistream_klass->query_info = ekn_file_input_stream_wrapper_query_info;

  obj_props[PROP_STREAM] =
    g_param_spec_object ("stream", "", "",
                         G_TYPE_INPUT_STREAM,
                         (GParamFlags) (G_PARAM_READWRITE |
                                        G_PARAM_CONSTRUCT_ONLY |
                                        G_PARAM_STATIC_STRINGS));
  obj_props[PROP_FILE] =
    g_param_spec_object ("file", "", "",
                         G_TYPE_OBJECT,
                         (GParamFlags) (G_PARAM_READWRITE |
                                        G_PARAM_CONSTRUCT_ONLY |
                                        G_PARAM_STATIC_STRINGS));
  g_object_class_install_properties (gobject_class, LAST_PROP, obj_props);
}

static void
ekn_file_input_stream_wrapper_init (EknFileInputStreamWrapper *wrapper)
{
}

GFileInputStream *
_ekn_file_input_stream_wrapper_new (GFile *file, GInputStream *stream)
{
  g_return_val_if_fail (G_IS_FILE (file), NULL);
  g_return_val_if_fail (G_IS_INPUT_STREAM (stream), NULL);

  return g_object_new (EKN_TYPE_FILE_INPUT_STREAM_WRAPPER,
                       "file", file,
                       "stream", stream,
                       NULL);
}
