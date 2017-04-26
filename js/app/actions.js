// Copyright 2015 Endless Mobile, Inc.

// UI event actions, avoid updating other module UI from these, they will be
// processed by the controller.
const NAV_BACK_CLICKED = 'nav-back-clicked';
const NAV_FORWARD_CLICKED = 'nav-forward-clicked';
const HISTORY_BACK_CLICKED = 'history-back-clicked';
const HISTORY_FORWARD_CLICKED = 'history-forward-clicked';
const ITEM_CLICKED = 'item-clicked';
const HOME_CLICKED = 'home-clicked';
const ALL_SETS_CLICKED = 'all-sets-clicked';
const SEARCH_TEXT_ENTERED = 'search-text-entered';
const ARTICLE_LINK_CLICKED = 'article-link-clicked';
const LAUNCHED_FROM_DESKTOP = 'launched-from-desktop';
const DBUS_LOAD_QUERY_CALLED = 'dbus-load-query-called';
const DBUS_LOAD_ITEM_CALLED = 'dbus-load-item-called';
const SEARCH_BOX_FOCUSED = 'search-box-focused';
const LIGHTBOX_CLOSED = 'lightbox-closed';
