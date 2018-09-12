---
layout: page
title: ''
permalink: /releases/5/
---

## Release schedule ##

| Date            | Milestone
|:----------------|:---------
| Thu Jul 5 2018  | Feature freeze
| Thu Jul 19 2018 | Hard code freeze
| Thu Aug 2 2018  | SDK5.0 release
| Thu Aug 30 2018 | SDK5.1 hard code freeze
| Thu Sep 13 2018 | SDK5.1 bugfix release
| Thu Sep 27 2018 | SDK5.2 hard code freeze
| Thu Oct 4 2018  | SDK5.2 bugfix release

## Major features ##

### New PDF viewer ###
An all-new PDF viewer is now in place, which significantly improves the reading experience with navigation, save, print and zoom options.

### New search popup ###
The in-app search popup has been completely redesigned with improved visuals.

### Custom modules ###
App developers are no longer limited to the SDK modules. Now, developers can write and include their own [custom modules](http://endlessm.github.io/eos-knowledge-lib/docs/5/concepts/custom_modules.html) in their apps.

### General improvements ###

- Runtime: Unknown licenses will be displayed properly.
- Runtime: Data model now supports `can_print` and `can_export` properties.
- Runtime: VERSION file is no longer needed.
- Modular Framework: Videos from Course apps can now be opened from global search.
- Modular Framework: Copy option is now available for article images.
- Modular Framework: Minor fixes to existing presets.
- Renderer: Several improvements for showing articles in small screens.

### Documentation ###
Several fixes to the [walkthrough](http://endlessm.github.io/eos-knowledge-lib/docs/5/tutorial/index.html) for the app making process.

## Migration from SDK4 ##
No changes are required for apps using the modular framework.

## Release notes ##

### SDK 5.1 (September 13, 2018) ###
- Runtime: Update existing translations
- Runtime: Fixed GPU acceleration for HTML content rendering for ARM architecture.
- Modular Framework: Add translations for preset files.
- Modular Framework: Cache compilation of scss files for applications.
- Modular Framework: Allow to use extra gresources into an application.

### SDK 5.0 (August 2, 2018) ###
This is the first release in the SDK5 series.
