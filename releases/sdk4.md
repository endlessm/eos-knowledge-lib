---
layout: page
title: ''
permalink: /releases/4/
---

## Release schedule ##

| Date            | Milestone
|:----------------|:---------
| Thu Apr 5 2018  | Feature freeze
| Thu Apr 19 2018 | Hard code freeze
| Fri May 4 2018  | SDK4.0 release
| Thu May 24 2018 | SDK4.1 hard code freeze
| Thu Jun 7 2018  | SDK4.1 bugfix release
| Thu Jun 21 2018 | SDK4.2 hard code freeze
| Thu Jul 5 2018  | SDK4.2 bugfix release
| Thu Aug 2 2018  | EOL

## Major features ##

### Platform ###
SDK4 is based on the GNOME 3.28 platform, so [all of the improvements for developers](https://help.gnome.org/misc/release-notes/3.28/developers.html.en) since GNOME 3.26 are now available.

We have also upgraded Xapian from our custom version of 1.3 to a prerelease snapshot of 1.6.
This brings in all the improvements from the last three years, as well a new database format with a smaller index size that is interoperable with other Xapian installations, and a stemmer for the Indonesian language.

We have a few new API additions to our developer platform as well.
- [**DModel**](https://github.com/endlessm/libdmodel) is a library, previously included in the platform but private, used for the data models of content stored in our databases.
- [**Maxwell**](https://github.com/endlessm/maxwell) is a library used for embedding GTK widgets inside a WebKit web view.
- [**mustache-c**](https://github.com/x86-64/mustache-c) is an implementation of the [Mustache](https://mustache.github.io/) templating engine in C.

### Custom overrides ###
It's now possible to customize presets beyond the [variables](http://endlessm.github.io/eos-knowledge-lib/releases/3#preset-variables) introduced in the last release.
Custom overrides allow modifying any part of a preset.
For example, to use the "Thematic" preset and modify one specific part:

```yaml
---
overrides:
  root.window.content.content.content.home-page.contents.0.contents.1:
    shortdef: 'Navigation.SearchBox(focus-on-map: false)'
---
!import 'thematic'
```

The format is identical to that of the variables, and both can be
used together but, instead of a variable name, these points are specified with a path composed of every node from the root node to the target node.

### General improvements ###
This release saw many small improvements in the areas of visual design of the modular framework; and performance, especially in video playback and database query operations.

### Documentation ###
There's now a [walkthrough](http://endlessm.github.io/eos-knowledge-lib/docs/4/tutorial/index.html) for the process of making an app with the modular framework.
We'll be adding to this guide in future bugfix releases.

## Migration guide from SDK3 ##
Some app presets were renamed:
- "A" is now "Library
- "B" is now "Thematic"
- "Buffet" is now "Exploration"
- "Escola" is now "Course"
If you were importing these presets in your `app.yaml` file, or their themes in your `overrides.scss` file, you should change the name.
For up-to-date documentation on the app presets, see [the presets documentation](http://endlessm.github.io/eos-knowledge-lib/docs/4/concepts/presets.html).

You will have to rebuild any databases in your app to work with the new version of Xapian.

## Release notes ##

### SDK 4.0 (May 4, 2018) ###
This is the first release in the SDK4 series.
