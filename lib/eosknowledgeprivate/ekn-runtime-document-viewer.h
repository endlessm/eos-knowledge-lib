/* -*- mode: C; c-file-style: "gnu"; indent-tabs-mode: nil; -*- */
/*
 * ekn-runtime-document-viewer.h
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

#ifndef _EKN_RUNTIME_DOCUMENT_VIEWER_H_
#define _EKN_RUNTIME_DOCUMENT_VIEWER_H_

#include <webkit2/webkit2.h>

G_BEGIN_DECLS

#define EKN_TYPE_RUNTIME_DOCUMENT_VIEWER (ekn_runtime_document_viewer_get_type ())
G_DECLARE_FINAL_TYPE (EknRuntimeDocumentViewer, ekn_runtime_document_viewer, EKN, RUNTIME_DOCUMENT_VIEWER, GtkWindow)

const gchar   *ekn_runtime_document_viewer_get_index_uri (EknRuntimeDocumentViewer *dialog);
void           ekn_runtime_document_viewer_set_index_uri (EknRuntimeDocumentViewer *dialog,
                                                          const gchar              *uri);

gboolean       ekn_runtime_document_viewer_get_show_on_load (EknRuntimeDocumentViewer *dialog);
void           ekn_runtime_document_viewer_set_show_on_load (EknRuntimeDocumentViewer *dialog,
                                                             gboolean                  show_on_load);

G_END_DECLS

#endif /* _EKN_RUNTIME_DOCUMENT_VIEWER_H_ */
