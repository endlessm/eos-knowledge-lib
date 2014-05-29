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
 * EKN_STYLE_CLASS_CARD_A:
 *
 * A CSS class to match #EknCardA widgets.
 * It is present on any template A card.
 */
#define EKN_STYLE_CLASS_CARD_A "card-a"

/**
 * EKN_STYLE_CLASS_CARD_B:
 *
 * A CSS class to match #EknCardB widgets.
 * It is present on any template B card.
 */
#define EKN_STYLE_CLASS_CARD_B "card-b"

/**
 * EKN_STYLE_CLASS_TEXT_CARD:
 *
 * A CSS class to match #EknTextCard widgets.
 * It is present on any text card widget or subclass thereof.
 */
#define EKN_STYLE_CLASS_TEXT_CARD "text-card"

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
 * EKN_STYLE_CLASS_CARD_SYNOPSIS:
 *
 * A CSS class to match the synopsis on a card.
 */
#define EKN_STYLE_CLASS_CARD_SYNOPSIS "card-synopsis"

/**
 * EKN_STYLE_CLASS_CARD_TITLE:
 *
 * A CSS class to match the title on a card
 */
#define EKN_STYLE_CLASS_CARD_TITLE "card-title"

/**
 * EKN_STYLE_CLASS_THUMBNAIL:
 *
 * A CSS class to match a #GtkImage or similar widget displaying a thumbnail
 * illustration, for example on a #EknCard.
 */
#define EKN_STYLE_CLASS_THUMBNAIL "thumbnail"

/**
 * EKN_STYLE_CLASS_LIGHTBOX:
 *
 * A CSS class to match #EknLightbox widgets.
 */
#define EKN_STYLE_CLASS_LIGHTBOX "lightbox"

/**
 * EKN_STYLE_CLASS_LIGHTBOX_SHADOW:
 *
 * A CSS class to match the overlay shadow of #EknLightbox widgets.
 */
#define EKN_STYLE_CLASS_LIGHTBOX_SHADOW "lightbox-shadow"

/**
 * EKN_STYLE_CLASS_LIGHTBOX_NAVIGATION_BUTTON:
 *
 * A CSS class to match the navigation buttons of #EknLightbox.
 */
#define EKN_STYLE_CLASS_LIGHTBOX_NAVIGATION_BUTTON "lightbox-navigation-button"

/**
 * EKN_STYLE_CLASS_INFOBOX:
 *
 * A CSS class to match the infobox in #EknLightbox widgets.
 */
#define EKN_STYLE_CLASS_INFOBOX "infobox"

/**
 * EKN_STYLE_CLASS_INFOBOX_ARROW:
 *
 * A CSS class to match the arrow in the infobox of #EknLightbox widgets.
 */
#define EKN_STYLE_CLASS_INFOBOX_ARROW "infobox-arrow"

/**
 * EKN_STYLE_CLASS_INFOBOX_CAPTION:
 *
 * A CSS class to match the caption label in the infobox of #EknLightbox widgets.
 */
#define EKN_STYLE_CLASS_INFOBOX_CAPTION "infobox-caption"

/**
 * EKN_STYLE_CLASS_INFOBOX_CREATOR_TEXT:
 *
 * A CSS class to match the attributable creator label in the infobox of #EknLightbox widgets.
 */
#define EKN_STYLE_CLASS_INFOBOX_CREATOR_TEXT "infobox-creator-text"

/**
 * EKN_STYLE_CLASS_INFOBOX_LICENSE_TEXT:
 *
 * A CSS class to match the license label in the infobox of #EknLightbox widgets.
 */
#define EKN_STYLE_CLASS_INFOBOX_LICENSE_TEXT "infobox-license-text"

/**
 * EKN_STYLE_CLASS_TOC:
 *
 * A CSS class to match a TableOfContents widget.
 */
#define EKN_STYLE_CLASS_TOC "toc"

/**
 * EKN_STYLE_CLASS_TOC_ENTRY:
 *
 * A CSS class to match an entry in the TableOfContents widget.
 */
#define EKN_STYLE_CLASS_TOC_ENTRY "toc-entry"

/**
 * EKN_STYLE_CLASS_TOC_ENTRY_TITLE:
 *
 * A CSS class to match the title of an entry in a TableOfContents widget.
 */
#define EKN_STYLE_CLASS_TOC_ENTRY_TITLE "toc-entry-title"

/**
 * EKN_STYLE_CLASS_TOC_ENTRY_INDEX:
 *
 * A CSS class to match the index label of an entry in a TableOfContents widget.
 */
#define EKN_STYLE_CLASS_TOC_ENTRY_INDEX "toc-entry-index"

/**
 * EKN_STYLE_CLASS_TOC_ARROW:
 *
 * A CSS class to match the arrow buttons in the TableOfContents widget.
 */
#define EKN_STYLE_CLASS_TOC_ARROW "toc-arrow"

/**
 * EKN_STYLE_CLASS_COLLAPSED:
 *
 * A CSS class to match widgets in a collapsed state.
 */
#define EKN_STYLE_CLASS_COLLAPSED "collapsed"

/**
 * EKN_STYLE_CLASS_HOME_PAGE:
 *
 * A CSS class to match the Template A's HomePage.
 */
#define EKN_STYLE_CLASS_HOME_PAGE "home-page"

/**
 * EKN_STYLE_CLASS_HOME_PAGE_TITLE_IMAGE:
 *
 * A CSS class to match the title image on the Template A's HomePage.
 */
#define EKN_STYLE_CLASS_HOME_PAGE_TITLE_IMAGE "home-page-title-image"

/**
 * EKN_STYLE_CLASS_HOME_PAGE_A:
 *
 * A CSS class to match the Template A's HomePage.
 */
#define EKN_STYLE_CLASS_HOME_PAGE_A "home-page-a"

/**
 * EKN_STYLE_CLASS_HOME_PAGE_B:
 *
 * A CSS class to match the Template B's HomePage.
 */
#define EKN_STYLE_CLASS_HOME_PAGE_B "home-page-b"

/**
 * EKN_STYLE_CLASS_ARTICLE_PAGE:
 *
 * A CSS class to match the ArticlePage.
 */
#define EKN_STYLE_CLASS_ARTICLE_PAGE "article-page"

/**
 * EKN_STYLE_CLASS_ARTICLE_PAGE_TITLE:
 *
 * A CSS class to match the title on the ArticlePage.
 */
#define EKN_STYLE_CLASS_ARTICLE_PAGE_TITLE "article-page-title"

/**
 * EKN_STYLE_CLASS_ARTICLE_PAGE_TOOLBAR_FRAME:
 *
 * A CSS class to match a frame around the right side toolbar on the
 * ArticlePage.
 */
#define EKN_STYLE_CLASS_ARTICLE_PAGE_TOOLBAR_FRAME "article-page-toolbar-frame"

/**
 * EKN_STYLE_CLASS_ARTICLE_PAGE_SWITCHER_FRAME:
 *
 * A CSS class to match a frame around the switcher on the ArticlePage.
 */
#define EKN_STYLE_CLASS_ARTICLE_PAGE_SWITCHER_FRAME "article-page-switcher-frame"

/**
 * EKN_STYLE_CLASS_SEARCH_BOX:
 *
 * A CSS class to match the search box.
 */
#define EKN_STYLE_CLASS_SEARCH_BOX "search-box"

/**
 * EKN_STYLE_CLASS_CARD_CONTAINER:
 *
 * A CSS class to match the horizontal card container.
 */
#define EKN_STYLE_CLASS_CARD_CONTAINER "card-container"

/**
 * EKN_STYLE_CLASS_SECTION_PAGE:
 *
 * A CSS class to match the SectionPage of the knowledge apps.
 */
#define EKN_STYLE_CLASS_SECTION_PAGE "section-page"

/**
 * EKN_STYLE_CLASS_SECTION_PAGE_BACK_BUTTON:
 *
 * A CSS class to match the back button on the section and article pages.
 */
#define EKN_STYLE_CLASS_SECTION_PAGE_BACK_BUTTON "section-page-back-button"

/**
 * EKN_STYLE_CLASS_SECTION_PAGE_TITLE:
 *
 * A CSS class to match the title on the SectionPage of the knowledge apps.
 */
#define EKN_STYLE_CLASS_SECTION_PAGE_TITLE "section-page-title"

/**
 * EKN_STYLE_CLASS_SECTION_PAGE_A:
 *
 * A CSS class to match the Template A's SectionPage of the knowledge apps.
 */
#define EKN_STYLE_CLASS_SECTION_PAGE_A "section-page-a"

/**
 * EKN_STYLE_CLASS_SECTION_PAGE_A_SEGMENT_TITLE:
 *
 * A CSS class to match the title on a segment of the SectionPage of the knowledge apps.
 */
#define EKN_STYLE_CLASS_SECTION_PAGE_A_SEGMENT_TITLE "section-page-a-segment-title"

/**
 * EKN_STYLE_CLASS_SECTION_PAGE_B:
 *
 * A CSS class to match the Template B' SectionPage of the knowledge apps.
 */
#define EKN_STYLE_CLASS_SECTION_PAGE_B "section-page-b"

/**
 * EKN_STYLE_CLASS_TOPBAR_BACK_BUTTON:
 *
 * A CSS class to match the back button on the top bar.
 */
#define EKN_STYLE_CLASS_TOPBAR_BACK_BUTTON "topbar-back-button"

/**
 * EKN_STYLE_CLASS_TOPBAR_FORWARD_BUTTON:
 *
 * A CSS class to match the forward button on the top bar.
 */
#define EKN_STYLE_CLASS_TOPBAR_FORWARD_BUTTON "topbar-forward-button"

/**
 * EKN_STYLE_CLASS_PREVIEWER:
 *
 * A CSS class to match the previewer widget.
 */
#define EKN_STYLE_CLASS_PREVIEWER "previewer"

/**
 * EKN_STYLE_CLASS_ANIMATING_VIDEO_FRAME:
 *
 * A CSS class to match a frame that gets shown instead of videos when the
 * previewer is animating (As our video playing widget can't display properly
 * during an animation).
 */
#define EKN_STYLE_CLASS_ANIMATING_VIDEO_FRAME "animating-video-frame"

/**
 * EKN_STYLE_CLASS_VIDEO_PLAYER_SCALE:
 *
 * A CSS class to match the video player scale (showing video progress).
 */
#define EKN_STYLE_CLASS_VIDEO_PLAYER_SCALE "video-player-scale"

/**
 * EKN_STYLE_CLASS_VIDEO_PLAYER_PLAY_BUTTON:
 *
 * A CSS class to match the video player play/pause button.
 */
#define EKN_STYLE_CLASS_VIDEO_PLAYER_PLAY_BUTTON "video-player-play-button"

/**
 * EKN_STYLE_CLASS_TAB_BUTTON:
 *
 * A CSS class to match the tab button.
 */
#define EKN_STYLE_CLASS_TAB_BUTTON "tab-button"

/**
 * EKN_STYLE_CLASS_SHOW_HOME_PAGE:
 *
 * A CSS class to set the background image position on the home page,
 * as part of the parallax effect when switching pages.
 */
#define EKN_STYLE_CLASS_SHOW_HOME_PAGE "show-home-page"

/**
 * EKN_STYLE_CLASS_SHOW_CATEGORIES_PAGE:
 *
 * A CSS class to set the background image position on the categories page,
 * as part of the parallax effect when switching pages.
 */
#define EKN_STYLE_CLASS_SHOW_CATEGORIES_PAGE "show-categories-page"

/**
 * EKN_STYLE_CLASS_SHOW_SECTION_PAGE:
 *
 * A CSS class to set the background image position on the section page,
 * as part of the parallax effect when switching pages.
 */
#define EKN_STYLE_CLASS_SHOW_SECTION_PAGE "show-section-page"

/**
 * EKN_STYLE_CLASS_SHOW_ARTICLE_PAGE:
 *
 * A CSS class to set the background image position on the article page,
 * as part of the parallax effect when switching pages.
 */
#define EKN_STYLE_CLASS_SHOW_ARTICLE_PAGE "show-article-page"

#endif /* EKN_MACROS_H */
