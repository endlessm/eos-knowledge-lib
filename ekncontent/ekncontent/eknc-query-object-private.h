/* Copyright 2018 Endless Mobile, Inc. */

#pragma once

#include <glib.h>
#include <xapian-glib.h>

#include "eknc-query-object.h"

G_BEGIN_DECLS

void
eknc_query_object_configure_enquire (EkncQueryObject *self,
                                     XapianEnquire *enquire);

G_END_DECLS
