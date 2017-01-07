/* Copyright 2016 Endless Mobile, Inc. */

#pragma once

G_BEGIN_DECLS

EkncDomain *
eknc_domain_get_impl (const gchar *app_id,
                      EkncXapianBridge *xapian_bridge,
                      GCancellable *cancellable,
                      GError **error);

G_END_DECLS
