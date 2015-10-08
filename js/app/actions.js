// Copyright 2015 Endless Mobile, Inc.

// UI event actions, avoid updating other module UI from these, they will be
// processed by the interaction models.
const FIRST_LAUNCH = 'first-launch';
const BRAND_SCREEN_DONE = 'brand-screen-done';
const NAV_BACK_CLICKED = 'nav-back-clicked';
const NAV_FORWARD_CLICKED = 'nav-forward-clicked';
const HISTORY_BACK_CLICKED = 'history-back-clicked';
const HISTORY_FORWARD_CLICKED = 'history-forward-clicked';
const SET_CLICKED = 'set-clicked';
const ITEM_CLICKED = 'item-clicked';
const SEARCH_CLICKED = 'search-clicked';
const SEARCH_TEXT_ENTERED = 'search-text-entered';
const AUTOCOMPLETE_CLICKED = 'autocomplete-clicked';
const ARTICLE_LINK_CLICKED = 'article-link-clicked';
const NEED_MORE_SETS = 'need-more-sets';
const NEED_MORE_ITEMS = 'need-more-items';
const NEED_MORE_SEARCH = 'need-more-search';

// UI updating actions, generated by the interaction models. Modules
// should listen to these to update their appearance.
const NAV_BACK_ENABLED_CHANGED = 'nav-back-enabled-changed';
const NAV_FORWARD_ENABLED_CHANGED = 'nav-forward-enabled-changed';
const HISTORY_BACK_ENABLED_CHANGED = 'history-back-enabled-changed';
const HISTORY_FORWARD_ENABLED_CHANGED = 'history-back-forward-changed';
const HIGHLIGHT_ITEM = 'highlight-item';
const CLEAR_HIGHLIGHTED_ITEM = 'clear-highlighted-item';
const APPEND_SETS = 'append-sets';
const APPEND_ITEMS = 'append-items';
const APPEND_SEARCH = 'append-search';
const CLEAR_SETS = 'clear-sets';
const CLEAR_ITEMS = 'clear-items';
const CLEAR_SEARCH = 'clear-search';
const SEARCH_STARTED = 'search-started';
const SEARCH_READY = 'search-ready';
const SEARCH_FAILED = 'search-failed';
const SET_SEARCH_TEXT = 'set-search-text';
const SHOW_SET = 'show-set';
const SET_READY = 'set-ready';
const SHOW_ARTICLE = 'show-article';
const SHOW_MEDIA = 'show-media';
const HIDE_MEDIA = 'hide-media';
const SHOW_ARTICLE_SEARCH = 'show-article-search';
const HIDE_ARTICLE_SEARCH = 'hide-article-search';
const FOCUS_SEARCH = 'focus-search';
const SHOW_HOME_PAGE = 'show-home-page';
const SHOW_SECTION_PAGE = 'show-section-page';
const SHOW_SEARCH_PAGE = 'show-search-page';
const SHOW_ARTICLE_PAGE = 'show-article-page';
