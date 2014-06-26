/* -*- mode: C; c-file-style: "gnu"; indent-tabs-mode: nil; -*- */

/* Copyright 2014 Endless Mobile, Inc. */

#ifndef EKN_HELLO_H
#define EKN_HELLO_H

#if !(defined(_EKN_INSIDE_EOSKNOWLEDGE_H) || defined(COMPILING_EOS_KNOWLEDGE))
#error "Please do not include this header file directly."
#endif

#include "ekn-types.h"

#include <glib.h>

G_BEGIN_DECLS

EKN_DEPRECATED_IN_0_0
void         ekn_hello_c                       (void);

EKN_DEPRECATED_IN_0_0
const gchar *ekn_hello_c_provider_get_greeting (void);

G_END_DECLS

#endif /* EKN_HELLO_H */
