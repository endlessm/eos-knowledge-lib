/* -*- mode: C; c-file-style: "gnu"; indent-tabs-mode: nil; -*- */
/* Copyright 2014 Endless Mobile, Inc. */

#ifndef EKN_VERSION_H
#define EKN_VERSION_H

#if !(defined(_EKN_INSIDE_EOSKNOWLEDGE_H) || defined(COMPILING_EOS_KNOWLEDGE))
#error "Please do not include this header file directly."
#endif

#include <glib.h>

#ifdef EKN_DISABLE_DEPRECATION_WARNINGS
#define EKN_DEPRECATED
#define EKN_DEPRECATED_FOR(f)
#define EKN_UNAVAILABLE(maj,min)
#else
#define EKN_DEPRECATED G_DEPRECATED
#define EKN_DEPRECATED_FOR(f) G_DEPRECATED_FOR(f)
#define EKN_UNAVAILABLE(maj,min) G_UNAVAILABLE(maj,min)
#endif

/* Each new stable series should add a new version symbol here. If necessary,
define EKN_VERSION_MIN_REQUIRED and EKN_VERSION_MAX_ALLOWED to one of these
macros. */
#define EKN_VERSION_0_0 (G_ENCODE_VERSION (0, 0))

#if (EKN_MINOR_VERSION == 99)
#define EKN_VERSION_CUR_STABLE (G_ENCODE_VERSION (EKN_MAJOR_VERSION + 1, 0))
#elif (EKN_MINOR_VERSION % 2)
#define EKN_VERSION_CUR_STABLE (G_ENCODE_VERSION (EKN_MAJOR_VERSION, EKN_MINOR_VERSION + 1))
#else
#define EKN_VERSION_CUR_STABLE (G_ENCODE_VERSION (EKN_MAJOR_VERSION, EKN_MINOR_VERSION))
#endif

/* evaluates to the previous stable version */
#if (EKN_MINOR_VERSION == 99)
#define EKN_VERSION_PREV_STABLE (G_ENCODE_VERSION (EKN_MAJOR_VERSION + 1, 0))
#elif (EKN_MINOR_VERSION % 2)
#define EKN_VERSION_PREV_STABLE (G_ENCODE_VERSION (EKN_MAJOR_VERSION, EKN_MINOR_VERSION - 1))
#else
#define EKN_VERSION_PREV_STABLE (G_ENCODE_VERSION (EKN_MAJOR_VERSION, EKN_MINOR_VERSION - 2))
#endif

#ifndef EKN_VERSION_MIN_REQUIRED
# define EKN_VERSION_MIN_REQUIRED (EKN_VERSION_CUR_STABLE)
#endif

#ifndef EKN_VERSION_MAX_ALLOWED
# if EKN_VERSION_MIN_REQUIRED > EKN_VERSION_PREV_STABLE
#  define EKN_VERSION_MAX_ALLOWED (EKN_VERSION_MIN_REQUIRED)
# else
#  define EKN_VERSION_MAX_ALLOWED (EKN_VERSION_CUR_STABLE)
# endif
#endif

/* sanity checks */
#if EKN_VERSION_MAX_ALLOWED < EKN_VERSION_MIN_REQUIRED
#error "EKN_VERSION_MAX_ALLOWED must be >= EKN_VERSION_MIN_REQUIRED"
#endif
#if EKN_VERSION_MIN_REQUIRED < EKN_VERSION_0_0
#error "EKN_VERSION_MIN_REQUIRED must be >= EKN_VERSION_0_0"
#endif

/* Every new stable minor release should add a set of macros here */

#if EKN_VERSION_MIN_REQUIRED >= EKN_VERSION_0_0
# define EKN_DEPRECATED_IN_0_0        EKN_DEPRECATED
# define EKN_DEPRECATED_IN_0_0_FOR(f) EKN_DEPRECATED_FOR(f)
#else
# define EKN_DEPRECATED_IN_0_0
# define EKN_DEPRECATED_IN_0_0_FOR(f)
#endif

#if EKN_VERSION_MAX_ALLOWED < EKN_VERSION_0_0
# define EKN_AVAILABLE_IN_0_0 EKN_UNAVAILABLE(0, 0)
#else
# define EKN_AVAILABLE_IN_0_0
#endif

#endif /* EKN_VERSION_H */
