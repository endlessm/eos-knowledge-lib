/* -*- mode: C; c-file-style: "gnu"; indent-tabs-mode: nil; -*- */
/*
 * ekn-file.h
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

#include <gio/gio.h>
#include "eos-shard/eos-shard-blob.h"

G_BEGIN_DECLS

#define EKN_TYPE_FILE (ekn_file_get_type ())
G_DECLARE_FINAL_TYPE (EknFile, ekn_file, EKN, FILE, GObject)

GFile *_ekn_file_new (const gchar *uri, EosShardBlob *blob);

G_END_DECLS