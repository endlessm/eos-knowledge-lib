/**
 * File: StyleClasses
 *
 * This file enumerates all of our knowledge widget css style classes in a bunch
 * of constants.
 */

/**
 * Constant: CARD
 *
 * Matches #EknCard widgets.
 * It is present on any card widget or subclass thereof.
 */
const CARD = 'card';

/**
 * Constant: LEGACY_POLAROID_CARD
 *
 * Matches #EknLegacyPolaroidCard widgets.
 * It is present on any legacy polaroid card.
 */
const LEGACY_POLAROID_CARD = 'legacy-polaroid-card';

/**
 * Constant: LEGACY_POST_CARD
 *
 * Matches #EknLegacyPostCard widgets.
 * It is present on any legacy post card.
 */
const LEGACY_POST_CARD = 'legacy-post-card';

/**
 * Constant: TITLE_CARD
 *
 * Matches #EknTitleCard widgets.
 * It is present on any text card widget or subclass thereof.
 */
const TITLE_CARD = 'title-card';

/**
 * Constant: SEQUENCE_CARD
 *
 * Matches #EknSequenceCard widgets.
 */
const SEQUENCE_CARD = 'sequence-card';

/**
 * Constant: LIST_CARD
 *
 * Matches #EknListCard widgets.
 * It is present on any list card widget or subclass thereof.
 */
const LIST_CARD = 'list-card';

/**
 * Constant: ALL_TYPE_CARD
 *
 * Matches #EknAllTypeCard widgets.
 */
const ALL_TYPE_CARD = 'all-type-card';

/**
 * Constant: CARD_WIDTH
 *
 * This object packs the different CSS classes that describe the width of a card
 * widget.
 */
const CARD_WIDTH = {
    A: 'width-a',
    B: 'width-b',
    C: 'width-c',
    D: 'width-d',
    E: 'width-e',
    F: 'width-f',
    G: 'width-g',
    H: 'width-h',
}

/**
 * Constant: CARD_HEIGHT
 *
 * This object packs the different CSS classes that describe the height of a card
 * widget.
 */
const CARD_HEIGHT = {
    A: 'height-a',
    B: 'height-b',
    C: 'height-c',
    D: 'height-d',
    E: 'height-e',
}

/** Constant: THUMB_CARD
 *
 * Matches #EknThumbCard widgets.
 * It is present on any thumb card widget or subclass thereof.
 */
const THUMB_CARD = 'thumb-card';

/**
 * Constant: POST_CARD
 *
 * Matches #EknPostCard widgets.
 * It is present on any thumb card widget or subclass thereof.
 */
const POST_CARD = 'post-card';

/**
 * Constant: SET
 *
 * It is present on any widget representing a set model.
 */
const SET = 'set';

/**
 * Constant: ARTICLE
 *
 * It is present on any widget representing a article model.
 */
const ARTICLE = 'article';

/**
 * Constant: HIGHLIGHTED
 *
 * Matches widgets when they are highlighted.
 *
 */
const HIGHLIGHTED = 'highlighted';

/**
 * Constant: CARD_CONTEXT
 *
 * Matches the context on a card.
 */
const CARD_CONTEXT = 'card-context';

/**
 * Constant: CARD_SYNOPSIS
 *
 * Matches the synopsis on a card.
 */
const CARD_SYNOPSIS = 'card-synopsis';

/**
 * Constant: CARD_TITLE
 *
 * Matches the title on a card
 */
const CARD_TITLE = 'title';

/**
 * Constant: THUMBNAIL
 *
 * Matches a #GtkImage or similar widget displaying a thumbnail
 * illustration, for example on a #EknCard.
 */
const THUMBNAIL = 'thumbnail';

/**
 * Constant: LIGHTBOX
 *
 * Matches #EknLightbox widgets.
 */
const LIGHTBOX = 'lightbox';

/**
 * Constant: LIGHTBOX_SHADOW
 *
 * Matches the overlay shadow of #EknLightbox widgets.
 */
const LIGHTBOX_SHADOW = 'lightbox-shadow';

/**
 * Constant: LIGHTBOX_NAVIGATION_BUTTON
 *
 * Matches the navigation buttons of #EknLightbox.
 */
const LIGHTBOX_NAVIGATION_BUTTON = 'lightbox-navigation-button';

/**
 * Constant: MEDIA_CARD
 *
 * Matches the media card in #EknLightbox widgets.
 */
const MEDIA_CARD = 'media-card';

/**
 * Constant: MEDIA_CARD_CAPTION
 *
 * Matches the caption label in the media card of #EknLightbox widgets.
 */
const MEDIA_CARD_CAPTION = 'media-card-caption';

/**
 * Constant: MEDIA_CARD_ATTRIBUTION_TEXT
 *
 * Matches the attribution label in the media card of #EknLightbox widgets.
 */
const MEDIA_CARD_ATTRIBUTION_TEXT = 'media-card-attribution-text';

/**
 * Constant: TOC
 *
 * Matches a TableOfContents widget.
 */
const TOC = 'toc';

/**
 * Constant: TOC_ENTRY
 *
 * Matches an entry in the TableOfContents widget.
 */
const TOC_ENTRY = 'toc-entry';

/**
 * Constant: TOC_ENTRY_TITLE
 *
 * Matches the title of an entry in a TableOfContents widget.
 */
const TOC_ENTRY_TITLE = 'toc-entry-title';

/**
 * Constant: TOC_ENTRY_INDEX
 *
 * Matches the index label of an entry in a TableOfContents widget.
 */
const TOC_ENTRY_INDEX = 'toc-entry-index';

/**
 * Constant: TOC_ARROW
 *
 * Matches the arrow buttons in the TableOfContents widget.
 */
const TOC_ARROW = 'toc-arrow';

/**
 * Constant: COLLAPSED
 *
 * Matches widgets in a collapsed state.
 */
const COLLAPSED = 'collapsed';

/**
 * Constant: APP_BANNER
 *
 * Matches the title image.
 */
const APP_BANNER = 'app-banner';

/**
 * Constant: HOME_PAGE_A
 *
 * Matches the Template A's HomePage.
 */
const HOME_PAGE_A = 'home-page-a';

/**
 * Constant: HOME_PAGE_B
 *
 * Matches the Template B's HomePage.
 */
const HOME_PAGE_B = 'home-page-b';

/**
 * Constant: ARTICLE_PAGE_TITLE
 *
 * Matches the title on the ArticlePage.
 */
const ARTICLE_PAGE_TITLE = 'title';

/**
 * Constant: DOCUMENT_CARD
 *
 * Matches the DocumentCard.
 */
const DOCUMENT_CARD = 'document-card';

/**
 * Constant: DOCUMENT_CARD_TOOLBAR_FRAME
 *
 * Matches a frame around the right side toolbar on the
 * DocumentCard.
 */
const DOCUMENT_CARD_TOOLBAR_FRAME = 'document-card-toolbar-frame';

/**
 * Constant: SEARCH_BOX
 *
 * Matches the search box.
 */
const SEARCH_BOX = 'search-box';

/**
 * Constant: SUGGESTED_ARTICLES
 *
 * Matches the suggested articles module.
 */
const SUGGESTED_ARTICLES = 'suggested-articles';

/**
 * Constant: CARD_CONTAINER
 *
 * Matches the horizontal card container.
 */
const CARD_CONTAINER = 'card-container';

/**
 * Constant: SECTION_PAGE
 *
 * Matches the SectionPage of the knowledge apps.
 */
const SECTION_PAGE = 'section-page';

/**
 * Constant: NAV_BACK_BUTTON
 *
 * Matches the back button on the sidebar.
 */
const NAV_BACK_BUTTON = 'nav-back-button';

/**
 * Constant: NAV_FORWARD_BUTTON
 *
 * Matches the forward button on the sidebar.
 */
const NAV_FORWARD_BUTTON = 'nav-forward-button';

/**
 * Constant: PREVIOUS
 *
 * Matches cards indicating a previous member of a sequence.
 */
const PREVIOUS = 'previous';

/**
 * Constant: NEXT
 *
 * Matches cards indicating a next member of a sequence.
 */
const NEXT = 'next';

/**
 * Constant: RTL
 *
 * Matches the Right-to-left (RTL) assets in the UI.
 */
const RTL = 'rtl';

/**
 * Constant: SECTION_PAGE_TITLE
 *
 * Matches the title on the SectionPage of the knowledge apps.
 */
const SECTION_PAGE_TITLE = 'title';

/**
 * Constant: SECTION_PAGE_A
 *
 * Matches the Template A's SectionPage of the knowledge apps.
 */
const SECTION_PAGE_A = 'section-page-a';

/**
 * Constant: SECTION_PAGE_B
 *
 * Matches the Template B' SectionPage of the knowledge apps.
 */
const SECTION_PAGE_B = 'section-page-b';

/**
 * Constant: SEARCH_PAGE_A
 *
 * Matches the SearchPageA of the knowledge apps.
 */
const SEARCH_PAGE_A = 'search-page-a';

/**
 * Constant: SEARCH_PAGE_B
 *
 * Matches the SearchPageB of the knowledge apps.
 */
const SEARCH_PAGE_B = 'search-page-b';

/**
 * Constant: ARTICLE_PAGE_A
 *
 * Matches the ArticlePageA of the knowledge apps.
 */
const ARTICLE_PAGE_A = 'article-page-a';

/**
 * Constant: ARTICLE_PAGE_B
 *
 * Matches the ArticlePageB of the knowledge apps.
 */
const ARTICLE_PAGE_B = 'article-page-b';

/**
 * Constant: SIDEBAR_TEMPLATE
 *
 * Matches the sidebar template's toplevel widget.
 */
const SIDEBAR_TEMPLATE = 'sidebar-template';

/**
 * Constant: SIDEBAR
 *
 * Matches the sidebar area of modules.
 */
const SIDEBAR = 'sidebar';

/**
 * Constant: TOP_MENU
 * Matches the top menu
 */
const TOP_MENU = 'top-menu';

/**
 * Constant: CONTENT
 *
 * Matches the main content area of modules.
 */
const CONTENT = 'content';

/**
 * Constant: PREVIEWER
 *
 * Matches the previewer widget.
 */
const PREVIEWER = 'previewer';

/**
 * Constant: TAB_BUTTON
 *
 * Matches the tab button.
 */
const TAB_BUTTON = 'tab-button';

/**
 * Constant: BACKGROUND_LEFT
 *
 * Used for window background parallax, to denote the background should be in
 * the left position.
 */
const BACKGROUND_LEFT = 'background-left';

/**
 * Constant: BACKGROUND_CENTER
 *
 * Used for window background parallax, to denote the background should be in
 * the center position.
 */
const BACKGROUND_CENTER = 'background-center';

/**
 * Constant: BACKGROUND_RIGHT
 *
 * Used for window background parallax, to denote the background should be in
 * the right position.
 */
const BACKGROUND_RIGHT = 'background-right';

/**
 * Constant: NO_MARGINS
 *
 * A CSS class for knowledge widgets that should turn their margins off.
 */
const NO_MARGINS = 'no-margins';

/**
 * Constant: ANIMATING
 *
 * Matches widgets that are currently animating.
 */
const ANIMATING = 'animating';

/**
 * Constant: SECTION_PAGE_B_TITLE_FRAME
 *
 * Matches frame that holds the category title on section page b.
 */
const SECTION_PAGE_B_TITLE_FRAME = 'section-page-b-title-frame';

/**
 * Constant: READER_ARTICLE_SNIPPET
 * Matches the ArticleSnippetCard widget used in the Reader apps.
 */
const READER_ARTICLE_SNIPPET = 'article-snippet';

/**
 * Constant: SUBTITLE
 * Matches subtitle labels.
 */
const SUBTITLE = 'subtitle';

/**
 * Constant: READER_TITLE
 *
 * Matches title labels across Reader apps.
 */
const READER_TITLE = 'title';

/**
 * Constant: READER_SYNOPSIS
 *
 * Matches synopsis labels across Reader apps.
 */
const READER_SYNOPSIS = 'synopsis';

/**
 * Constant: READER_PROGRESS_LABEL
 *
 * Matches the #EknReaderProgressLabel widget.
 */
const READER_PROGRESS_LABEL = 'progress-label';

/**
 * Constant: READER_BACK_COVER
 *
 * Matches the #EknReaderBackCover itself.
 */
const READER_BACK_COVER = 'back-cover';

/**
 * Constant: READER_ARTICLE_PAGE_ATTRIBUTION
 *
 * Matches the attribution on the reader's ArticlePage.
 */
const READER_ARTICLE_PAGE_ATTRIBUTION = 'attribution';

/**
 * Constant: READER_ERROR_PAGE
 * Matches an error message page
 */
const READER_ERROR_PAGE = 'error-page';

/**
 * Constant: PDF_VIEW
 *
 * Matches the pdf view.
 */
const PDF_VIEW = 'pdf-view';

/**
 * Constant: PDF_CARD_ICON
 *
 * Matches icon of the pdf card.
 */
const PDF_CARD_ICON = 'pdf-card-icon';

/**
 * Constant: READER_CARD
 *
 * Matches the reader card.
 */
const READER_CARD = 'reader-card';

/**
 * Constant: READER_HOVER_FRAME
 *
 * Matches the reader card's hover state.
 */
const READER_HOVER_FRAME = 'hover-frame';

/**
 * Constant: READER_CARD_INFO_FRAME
 *
 * Matches the reader card's info frame.
 */
const READER_CARD_INFO_FRAME = 'card-info-frame';

/**
 * Constant: READER_CARD_INFO_TITLE
 *
 * Matches the reader card's info title.
 */
const READER_CARD_INFO_TITLE = 'card-info-title';

/**
 *  Constant: READER_ATTRIBUTION
 *
 * Matches the attribution field of a reader card.
 */
const READER_ATTRIBUTION = 'reader-attribution';

/**
 * Constant: READER_WEBVIEW_TOOLTIP
 *
 * Matches the webview tooltip widget.
 */
const READER_WEBVIEW_TOOLTIP = 'webview-tooltip';

/**
 * Constant: READER_ARCHIVE_NOTICE_FRAME
 *
 * Matches the frame around the archive label.
 */
const READER_ARCHIVE_NOTICE_FRAME = 'archive-notice-frame';

/**
 * Constant: READER_SEARCH_RESULTS_PAGE
 *
 * Matches the search results page in Reader apps.
 */
const READER_SEARCH_RESULTS_PAGE = 'search-results-page';

/**
 * Constant: READER_DECORATIVE_BAR
 *
 * Matches the decorative title bar in Reader apps.
 */
const READER_DECORATIVE_BAR = 'decorative-bar';

/**
 * Constant: PDF_CARD_LABEL
 *
 * Matches the PDF label on the pdf cards
 */
const PDF_CARD_LABEL = 'pdf-card-label';

/**
 * Constant: INVISIBLE
 * Added to widgets that should be styled invisible by CSS
 */
const INVISIBLE = 'invisible';

/**
 * Constant: FADE_IN
 * Added to widgets that should be faded in using CSS
 */
const FADE_IN = 'fade-in';

/**
 * Constant: DECORATION
 * Added to decorative elements
 */
const DECORATION = 'decoration';

/**
 * Constant: SEARCH_RESULTS
 * On the <Search> module
 */
const SEARCH_RESULTS = 'search-results';

/**
 * Constant: NO_RESULTS
 * On the <Search> module when there are no results
 */
const NO_RESULTS = 'no-results';

/**
 * Constant: HEADLINE
 * Matches headline text in various widgets
 */
const HEADLINE = 'headline';

/**
 * Constant: QUERY
 * Matches the portion of a label that indicates a query string
 */
const QUERY = 'query';

/**
 * Constant: RESULTS_MESSAGE_TITLE
 * Matches search results messages, including "no results"
 */
const RESULTS_MESSAGE_TITLE = 'results-message-title';

/**
 * Constant: RESULTS_MESSAGE_SUBTITLE
 * Matches search results messages, including "no results"
 */
const RESULTS_MESSAGE_SUBTITLE = 'results-message-subtitle';

/**
 * Constant: ERROR_MESSAGE
 * Matches error messages
 */
const ERROR_MESSAGE = 'error-message';

/**
 * Constant: ARTICLE_SEARCH
 * Matcher the in article search widget.
 */
const ARTICLE_SEARCH = 'article-search';

/**
 * Constant: SET_GROUP
 *
 * Matches a set group module.
 */
const SET_GROUP = 'set-group';

/**
 * Constant: PANEL
 *
 * Matches a panel.
 */
const PANEL = 'panel';

/**
 * Constant: WINDOW_SMALL
 *
 * Class to identify a small window
 */
const WINDOW_SMALL = 'window-small';

/**
 * Constant: WINDOW_LARGE
 *
 * Class to identify a large window
 */
const WINDOW_LARGE = 'window-large';

/*
 * Constant: BEFORE
 * Matches a widget before another widget.
 */
const BEFORE = 'before';

/**
 * Constant: AFTER
 * Matches a widget after another widget.
 */
const AFTER = 'after';
