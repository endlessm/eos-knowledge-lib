---
layout: page
title: ''
permalink: /releases/1/
---

## Release schedule ##

| Date            | Milestone
|:----------------|:---------
| Mon Jul 3 2017  | SDK1.0 release
| Fri Jul 14 2017 | SDK1.1 release (irregular hotfix)
| Thu Jul 27 2017 | SDK1.2 hard code freeze
| Fri Aug 4 2017  | SDK1.2 bugfix release
| Thu Aug 31 2017 | SDK1.3 hard code freeze
| Thu Sep 7 2017  | SDK1.3 bugfix release
| Wed Sep 27 2017 | SDK1.4 release (irregular hotfix)
| Thu Sep 28 2017 | SDK1.5 hard code freeze
| Tue Oct 10 2017 | SDK1.5 bugfix release
| Thu Nov 16 2017 | EOL

## Release notes ##

### SDK 1.5 (October 10, 2017) ###

- Modular framework: Fixed a crash that would sometimes happen when clicking on a video.
- Modular framework: Bug fixed whereby some apps with videos might lock up when navigating to other pages.
- Modular framework: Bug fixed whereby the overflow menu of `Arrangement.SideBySide` would not load all the items it was supposed to have.
- Modular framework: Bug fixed whereby filters in the `sub-filter` slot of `Filter` modules would not propagate their changes up to the parent filters.
- Modular framework: The width of `Card.List` is now independent of the length of the synopsis of the content displayed within. This fixes bugs where cards would have staggered sizes.
- Modular framework: Cards now have a `no_thumbnail` modifier style class (e.g., `.CardDefault__no_thumbnail` to indicate when there is no thumbnail image present.)
- Modular framework: Altered preset `A` so that cards in sets will show a thumbnail image if one is present.

### SDK 1.4 (September 27, 2017) ###

- This is another irregular hotfix release, since there were some problems that made videos unplayable on some machines.
- Work around a bug in the GNOME runtime that caused GStreamer plugins to crash on some machines, which made audio and video unplayable. [Will be fixed in GNOME 3.26][1].
- Intel only: Include a copy of libvpx that is properly optimized for x86_64. This should greatly increase the performance of video playback using VP8 and VP9 codecs. [Will be fixed in GNOME 3.26][2].
- ARM only: Include a GTK capable of using EGL instead of GLX.

### SDK 1.3 (September 7, 2017) ###

- No changes except for updating fonts and the underlying GNOME runtime.

### SDK 1.2 (August 4, 2017) ###

- Fixed some bugs around upgrading apps via flatpak.
- Modular framework: fixed a crash that occurred when clicking on an internal link in a Wikipedia article.
- Modular framework: fixed some spurious search results that pointed to images inside blog posts.
- Modular framework: fixed a problem where an app without any content available would crash instead of downloading new content.
- Modular framework: improved the speed with which article cards loaded.
- Runtime: Added some fonts that were missing from the original release.

### SDK 1.1 (July 17, 2017) ###

- This is an irregular hotfix release &mdash; let's chalk it up to growing pains.
- ekncontent: Made it possible to handle more than one subscription.
- basin: Fixed a crash that made the `basin` developer tool unusable.

### SDK 1.0 (July 3, 2017) ###

- This is the first release of the Endless Apps SDK! [Here's how to install it](/eos-knowledge-lib/contributing#flatpak-runtime).

[1]: https://git.gnome.org/browse/gnome-sdk-images/commit/?h=gnome-3-26&id=2b1dc1b1ad84bddc932da2395a96d5a7e4c4fad0
[2]: https://github.com/flatpak/freedesktop-sdk-base/pull/9