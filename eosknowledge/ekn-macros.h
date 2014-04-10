/* -*- mode: C; c-file-style: "gnu"; indent-tabs-mode: nil; -*- */
/* Copyright 2013 Endless Mobile, Inc. */

#ifndef EKN_MACROS_H
#define EKN_MACROS_H

#if !(defined(_EKN_INSIDE_EOSKNOWLEDGE_H) || defined(COMPILING_EOS_KNOWLEDGE))
#error "Please do not include this header file directly."
#endif

/* Shared preprocessor macros */

#define EKN_ENUM_VALUE(value, nick)     { value, #value, #nick },

#define EKN_DEFINE_ENUM_TYPE(EnumType, enum_type, values) \
GType \
enum_type##_get_type (void) \
{ \
  static volatile gsize g_define_type_id__volatile = 0; \
  if (g_once_init_enter (&g_define_type_id__volatile)) \
    { \
      static const GEnumValue v[] = { \
        values \
        { 0, NULL, NULL }, \
      }; \
      GType g_define_type_id = \
        g_enum_register_static (g_intern_static_string (#EnumType), v); \
\
      g_once_init_leave (&g_define_type_id__volatile, g_define_type_id); \
    } \
  return g_define_type_id__volatile; \
}

/**
 * SECTION:style-classes
 * @title: Style classes
 * @short_description: CSS style classes defined in this library
 *
 * These are the style classes predefined by this library, and used by its
 * widgets.
 * Use them in your custom CSS to customize the theming.
 */

/**
 * EKN_STYLE_CLASS_CARD:
 *
 * A CSS class to match #EknCard widgets.
 * It is present on any card widget or subclass thereof.
 */
#define EKN_STYLE_CLASS_CARD "card"

/**
 * EKN_STYLE_CLASS_COMPLETE:
 *
 * A CSS class to match #EknLessonCard widgets that have been marked as
 * completed.
 * It is present on the card widget itself when #EknLessonCard:complete is set
 * to %TRUE.
 */
#define EKN_STYLE_CLASS_COMPLETE "complete"

/**
 * EKN_STYLE_CLASS_SUBTITLE:
 *
 * A CSS class to match a #GtkLabel or similar widget representing a subtitle.
 */
#define EKN_STYLE_CLASS_SUBTITLE "subtitle"

/**
 * EKN_STYLE_CLASS_THUMBNAIL:
 *
 * A CSS class to match a #GtkImage or similar widget displaying a thumbnail
 * illustration, for example on a #EknCard.
 */
#define EKN_STYLE_CLASS_THUMBNAIL "thumbnail"

/**
 * EKN_STYLE_CLASS_TITLE:
 *
 * A CSS class to match a #GtkLabel or similar widget representing the title of
 * something.
 */
#define EKN_STYLE_CLASS_TITLE "title"

#endif /* EKN_MACROS_H */
