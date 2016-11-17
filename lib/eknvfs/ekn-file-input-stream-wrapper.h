/* -*- mode: C; c-file-style: "gnu"; indent-tabs-mode: nil; -*- */

/* Copyright 2016 Endless Mobile, Inc. */

#pragma once

#include <gio/gio.h>

#define EKNS_TYPE_FILE_INPUT_STREAM_WRAPPER (ekns_file_input_stream_wrapper_get_type ())
G_DECLARE_FINAL_TYPE (EknsFileInputStreamWrapper, ekns_file_input_stream_wrapper, EKNS, FILE_INPUT_STREAM_WRAPPER, GFileInputStream)

