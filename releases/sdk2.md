---
layout: page
title: ''
permalink: /releases/2/
---

## Release schedule ##

| Date            | Milestone
|:----------------|:---------
| Thu Oct 5 2017  | Feature freeze
| Thu Nov 2 2017  | Hard code freeze
| Mon Nov 20 2017 | SDK2.0 release
| Thu Nov 30 2017 | SDK2.1 hard code freeze
| Mon Dec 11 2017 | SDK2.1 bugfix release
| Thu Dec 28 2017 | SDK2.2 hard code freeze
| Mon Jan 8 2018  | SDK2.2 bugfix release
| Sat Jan 18 2018 | SDK2.3 release (irregular hotfix)
| Mon Feb 5 2018  | EOL

## Major features ##

### Platform ###

SDK2 is based on the GNOME 3.26 platform, so [all of the improvements for developers](https://help.gnome.org/misc/release-notes/3.26/developers.html.en) since GNOME 3.24 are now available.

### Social sharing ###

When viewing content in the `View.Document` module, a user will see sharing buttons for Facebook, Twitter, and WhatsApp.
Clicking on one of these buttons will allow a user to log in to that service and share a link to the item.

There's no need to make any changes to your app for this to work.
The item must have an `originalURI` defined in its metadata; this will be the link that is shared.

If the user has logged into Facebook system-wide using GNOME Online Accounts, then that login will be automatically used here as well.

### Content updates ###

Apps using the modular framework generally include content, which can be updated in the case of content that is published or refreshed often (for example, blogs.)
Previously, apps would include an initial pack of content in their Flatpak bundle.
On launch they would check a hardcoded server if there were any updates, and if so download them and apply them the next time the app was launched.
This was confusing for users since it wasn't clear when there was an update or when it was applied.
Additionally, it was only possible to issue content updates through Endless's infrastructure.

Now, the app developer can include content updates in the Flatpak repository where the app is published.
All content is inside a Flatpak extension named `Content`; for example, the app `com.example.MyApp` would use an extension with the ID `com.example.MyApp.Content`.
The hardcoded downloader has been removed.

In order to avoid cluttering users' storage with hard-to-find files, when an SDK2 app is launched, it will remove any remaining downloaded content from a previous SDK1 version of itself.

### Search ###

Previously, it was required to have the [`xapian-bridge`]( https://github.com/endlessm/xapian-bridge) service running in the background in order for search to work.
This is no longer required.
This makes it much easier to develop and run modular framework applications on other operating systems.

For GNOME Shell search to work, it's required to have the `com.endlessm.EknServices2` Flatpak app installed.
This services app also enables apps to work with features of the Endless desktop, such as the Discovery Feed.
(For apps based on SDK1, `com.endlessm.EknServices` was required for the same purpose.)

### Data collection ###

If the app is running on Endless OS, then data will be collected and sent to Endless on the following additional topics:

- Social sharing: When a user shares content on a social network, the app will send its ID, a reference to the content shared including the online URL that was posted, and which social network the content was shared on (Facebook, Twitter, or WhatsApp).
  No information is collected about the user's identity, either on the local computer or on the social network.
- Viewing content: When a user views content, the app will now send a reference to the content being viewed, how long the content was viewed for, and whether the user accessed the content by clicking on a GNOME Shell search result, a link elsewhere in the app, or by navigating with the back/forward buttons.

## Migration guide from SDK1 ##

### Module renames ###
The `Card.KnowledgeDocument` module has been renamed to [`View.Document`](http://endlessm.github.io/eos-knowledge-lib/docs/2/view/document.html).
As well, `Card.Video`, `Card.Audio`, and `Card.Media` have been reorganized under `View`.
These changes apply to your `app.yaml` file.

### CSS changes ###
Related to the module renames, you'll need to update any CSS selectors in your `overrides.scss` file that use the `.CardKnowledgeDocument`, `.CardVideo`, `.CardAudio`, or `.CardMedia` classes (and any BEM variants) to refer to [`.ViewDocument`](http://endlessm.github.io/eos-knowledge-lib/docs/2/view/document.html), [`.ViewVideo`](http://endlessm.github.io/eos-knowledge-lib/docs/2/view/video.html), [`.ViewAudio`](http://endlessm.github.io/eos-knowledge-lib/docs/2/view/audio.html), and [`.ViewMedia`](http://endlessm.github.io/eos-knowledge-lib/docs/2/view/media.html).

## Release notes ##

### SDK 2.3 (January 18, 2018) ###

This is a security update, with no other changes except the underlying GNOME runtime. It includes a mitigation for the MELTDOWN and SPECTRE vulnerabilities in WebKit.

### SDK 2.2 (January 8, 2018) ###

- Modular framework: fixed a bug whereby the sidebar on some apps would
  blank out after clicking on a search result.
- Modular framework: increased the margins on the search results page
  for some apps.
- Modular framework: corrected the alignment of the popup menu showing
  extra categories that don't fit in the top bar of news apps.
- Modular framework: adjusted the text size on the front page cards in
  news apps so that text on very large cards doesn't look out of
  proportion.
- Modular framework: adjusted the opacity of the popup that appears when
  you hover the mouse over a link.
- Modular framework: adjusted the size of the "Copy" popup that appears
  when you select text.

### SDK 2.1 (December 11, 2017) ###

- Modular framework: the CSS class for the title of the default Card was
  erroneously removed during the module renaming, and has now been restored,
  alongside with its styling.
- Modular framework: fixed a bug that resulted in showing an empty tooltip
  on web views.
- Modular framework: fixed the style of the search results in the A and
  Library presets.

### SDK 2.0 (November 20, 2017) ###

This is the first release in the SDK2 series.
