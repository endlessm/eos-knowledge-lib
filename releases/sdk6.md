---
layout: page
title: ''
permalink: /releases/6/
---

## Release schedule ##

| Date             | Milestone
|:-----------------|:---------
| Mon Oct 21 2019  | Feature freeze
| Wed Jul 15 2020  | Hard code freeze
| Mon Jul 20 2020  | SDK 6.0 release
| Tue Jul 28 2020  | SDK 6.1 bugfix release
| Mon Aug 24 2020  | SDK 6.2 bugfix release

## Major features ##

### Updated upstream and infrastructure ###

- Updated the GNOME SDK to version 3.36
- Adopted [Buildstream](https://www.buildstream.build/) as the Flatpak runtimes build stack

### OpenZIM support ###

Added support for loading content in knowledge apps from [OpenZIM](https://openzim.org/) files as an alternative to shard files. This allows us to reuse the potential of the [OpenZIM farm](https://farm.openzim.org/) as the provider of Wikipedia offline content.

### Kolibri support ###

Added support for loading [Kolibri](https://learningequality.org/kolibri/)'s zipped HTML5 content, which are basically ZIP files with a full webpage inside, being the `index.html` member file the starting point of the content. This enables more potential for interactive content in the modular framework.

### General improvements ##

- Make it easier for apps to add extra CSS stylesheet to rendered HTML content by reading a file from the `GResource` bundle.
- Added support for adding extra JavaScript files to the rendered HTML.
- Removed custom styling from the SDK to follow the system theme.
- Fixed a problem where certain programs would never search for libraries from Flatpak extensions, such as the GL host extension.
- Other minor bugfixes.

## Migration from SDK-5 ##

No changes are required for apps using the modular framework.

## Release notes ##

### SDK 6.0 (July 20th, 2020) ###

This is the first release in the SDK-6 series.

### SDK 6.1 (July 28th, 2020) ###

Update libzim to version 6.1.8 to improve OpenZIM files loading performance.

### SDK 6.2 (Aug 24th, 2020) ###

- Add support for same page links (anchored links).
- Fix internal links tooltips for OpenZIM files.
- Fix duplicated search results for OpenZIM files.
