/* -*- mode: C; c-file-style: "gnu"; indent-tabs-mode: nil; -*- */

/* Copyright 2016 Endless Mobile, Inc. */

#include "ekns-file-input-stream-wrapper.h"

struct _EknsFileInputStreamWrapper
{
  GFileInputStream parent;

  GInputStream *stream;
  GFile *file;
};
typedef struct _EknsFileInputStreamWrapper EknsFileInputStreamWrapper;

enum
{
  PROP_0,
  PROP_STREAM,
  PROP_FILE,
  LAST_PROP,
};

static GParamSpec *obj_props[LAST_PROP];

G_DEFINE_TYPE (EknsFileInputStreamWrapper, ekns_file_input_stream_wrapper, G_TYPE_FILE_INPUT_STREAM);

static void
ekns_file_input_stream_wrapper_finalize (GObject *object)
{
  EknsFileInputStreamWrapper *self = EKNS_FILE_INPUT_STREAM_WRAPPER (object);

  g_clear_object (&self->stream);
  g_clear_object (&self->file);

  G_OBJECT_CLASS (ekns_file_input_stream_wrapper_parent_class)->finalize (object);
}

static void
ekns_file_input_stream_wrapper_set_property (GObject          *object,
                                             guint             prop_id,
                                             const GValue     *value,
                                             GParamSpec       *pspec)
{
  EknsFileInputStreamWrapper *self = EKNS_FILE_INPUT_STREAM_WRAPPER (object);

  switch (prop_id) {
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
ekns_file_input_stream_wrapper_get_property (GObject    *object,
                                             guint       prop_id,
                                             GValue     *value,
                                             GParamSpec *pspec)
{
  EknsFileInputStreamWrapper *self = EKNS_FILE_INPUT_STREAM_WRAPPER (object);

  switch (prop_id) {
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

static gssize
ekns_file_input_stream_wrapper_read (GInputStream  *stream,
                                     void          *buffer,
                                     gsize          count,
                                     GCancellable  *cancellable,
                                     GError       **error)
{
  EknsFileInputStreamWrapper *self = EKNS_FILE_INPUT_STREAM_WRAPPER (stream);
  return g_input_stream_read (self->stream, buffer, count, cancellable, error);
}

static gboolean
ekns_file_input_stream_wrapper_close (GInputStream  *stream,
                                      GCancellable  *cancellable,
                                      GError       **error)
{
  EknsFileInputStreamWrapper *self = EKNS_FILE_INPUT_STREAM_WRAPPER (stream);
  return g_input_stream_close (self->stream, cancellable, error);
}

static gssize
ekns_file_input_stream_wrapper_skip (GInputStream  *stream,
                                     gsize          count,
                                     GCancellable  *cancellable,
                                     GError       **error)
{
  EknsFileInputStreamWrapper *self = EKNS_FILE_INPUT_STREAM_WRAPPER (stream);
  return g_input_stream_skip (self->stream, count, cancellable, error);
}

static goffset
ekns_file_input_stream_wrapper_tell (GFileInputStream *stream)
{
  EknsFileInputStreamWrapper *self = EKNS_FILE_INPUT_STREAM_WRAPPER (stream);

  if (!G_IS_SEEKABLE (self->stream))
      return 0;

  return g_seekable_tell (G_SEEKABLE (self->stream));
}

static gboolean
ekns_file_input_stream_wrapper_can_seek (GFileInputStream *stream)
{
  EknsFileInputStreamWrapper *self = EKNS_FILE_INPUT_STREAM_WRAPPER (stream);
  return G_IS_SEEKABLE (self->stream) && g_seekable_can_seek (G_SEEKABLE (self->stream));
}

static gboolean
ekns_file_input_stream_wrapper_seek (GFileInputStream *stream,
                                     goffset offset,
                                     GSeekType type,
                                     GCancellable *cancellable,
                                     GError **error)
{
  EknsFileInputStreamWrapper *self = EKNS_FILE_INPUT_STREAM_WRAPPER (stream);

  if (!G_IS_SEEKABLE (self->stream))
    {
      g_set_error_literal (error, G_IO_ERROR, G_IO_ERROR_NOT_SUPPORTED,
			   "Input stream doesn't implement seek");
      return FALSE;
    }

  return g_seekable_seek (G_SEEKABLE (self->stream), offset, type, cancellable, error);
}

static GFileInfo *
ekns_file_input_stream_wrapper_query_info (GFileInputStream  *stream,
					 const char        *attributes,
					 GCancellable      *cancellable,
					 GError           **error)
{
  EknsFileInputStreamWrapper *self = EKNS_FILE_INPUT_STREAM_WRAPPER (stream);

  return g_file_query_info (self->file, attributes, 0, cancellable, error);
}

static void
ekns_file_input_stream_wrapper_class_init (EknsFileInputStreamWrapperClass *klass)
{
  GObjectClass *gobject_class = G_OBJECT_CLASS (klass);
  GInputStreamClass *istream_class;
  GFileInputStreamClass *fileistream_klass;

  gobject_class->finalize = ekns_file_input_stream_wrapper_finalize;
  gobject_class->set_property = ekns_file_input_stream_wrapper_set_property;
  gobject_class->get_property = ekns_file_input_stream_wrapper_get_property;

  istream_class = G_INPUT_STREAM_CLASS (klass);
  istream_class->read_fn = ekns_file_input_stream_wrapper_read;
  istream_class->close_fn = ekns_file_input_stream_wrapper_close;
  istream_class->skip = ekns_file_input_stream_wrapper_skip;

  fileistream_klass = G_FILE_INPUT_STREAM_CLASS (klass);
  fileistream_klass->tell = ekns_file_input_stream_wrapper_tell;
  fileistream_klass->can_seek = ekns_file_input_stream_wrapper_can_seek;
  fileistream_klass->seek = ekns_file_input_stream_wrapper_seek;
  fileistream_klass->query_info = ekns_file_input_stream_wrapper_query_info;

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
ekns_file_input_stream_wrapper_init (EknsFileInputStreamWrapper *wrapper)
{
}
