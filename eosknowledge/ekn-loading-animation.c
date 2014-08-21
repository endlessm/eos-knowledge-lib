/* Copyright 2014 Endless Mobile, Inc. */

#include "ekn-types.h"

/**
 * SECTION:webview-switcher
 * @short_description: Animations for loading a webpage
 * @title: Webview switcher
 * @include: eosknowledge/eosknowledge.h
 *
 * This class proxies a #WebKitWebView (or any other object that has
 * WebKitWebView::load-changed and WebKitWebView::decide-policy signals
 * in its interface). It is used to create a "paging" effect in a
 * browser-type environment. Calling ekn_webview_switcher_view_load_uri()
 * causes a new web view to be created and slide in on top of the
 * previous webview, which is then destroyed in order to save memory.
 */

EKN_DEFINE_ENUM_TYPE (EknLoadingAnimationType, ekn_loading_animation,
                      EKN_ENUM_VALUE (EKN_LOADING_ANIMATION_TYPE_NONE, none)
                      EKN_ENUM_VALUE (EKN_LOADING_ANIMATION_TYPE_FORWARDS_NAVIGATION, forwards-navigation)
                      EKN_ENUM_VALUE (EKN_LOADING_ANIMATION_TYPE_BACKWARDS_NAVIGATION, backwards-navigation))
