---
layout: page
title: ''
permalink: /releases/3/
---

## Release schedule ##

| Date            | Milestone
|:----------------|:---------
| Thu Jan 4 2018  | Feature freeze
| Thu Jan 18 2018 | Hard code freeze
| Mon Feb 5 2018  | SDK3.0 release
| Thu Feb 15 2018 | SDK3.1 hard code freeze
| Mon Mar 5 2018  | SDK3.1 bugfix release
| Wed Mar 14 2018 | SDK3.2 release (irregular hotfix)
| Thu Mar 22 2018 | SDK3.3 hard code freeze
| Mon Apr 9 2018  | SDK3.3 bugfix release
| Mon May 7 2018  | EOL

## Major features ##

### General improvements ###
This release saw many small improvements in the areas of visual design of the modular framework; and performance, especially in video playback and database query operations.

### New preset: Video List ###
There's a new preset which displays all its content as a single list.
It's particularly suited to content such as series of video lessons.
To use it, you can import it in your app's YAML file like the other presets:

```yaml
---
!import video_list
```

### Preset variables ###
The app presets are much more customizable now.
Each one exposes a number of "variables" that you can change before importing the preset in your app's YAML file.
For example, the News preset exposes a `home-highlighted-articles-arrangement` variable to control the arrangement at the top of the home page.
This is preset to `Arrangement.Piano`, but you can now override it like this:

```yaml
---
overrides:
  home-highlighted-articles-arrangement:
    shortdef: Arrangement.Windshield
---
!import news
```

### Performance probes ###
You can now instrument your code using `EosProfileProbe`: a way to time certain operations in your code.
It is as close as possible to zero-cost when profiling is not switched on.

Modular framework apps can't add probes directly, but we've added probes to common operations in the modular framework code.
You can see the results by running your app with `EOS_PROFILE=1`.
To save the results for later analysis, run your app with `EOS_PROFILE=capture:profile.out` and examine the file with `eos-profile show profile.out`.

### No more "see more" ###
We have removed the "see more" popups from the ends of posts in the Blog and News presets.
These popups were not intuitive, and it was easy to scroll into one without being able to scroll back out of it easily.
We'll look for another solution in a future SDK release, but for the time being this feature is removed.

## Migration guide from SDK2 ##
No changes are required for apps using the modular framework.

If you were adding extra space to the ends of HTML pages in your app in order to accommodate the "see more" popups, you should remove that space, which will now be blank.
If you were using libingester's `BlogAsset` and `NewsAsset`, this is done for you automatically if you upgrade to libingester 2.2.45 or later.

## Release notes ##

### SDK 3.3 (April 9, 2018) ###

- Services: We now display content in the discovery feed even if it wasn't created with a discovery-feed-specific title.

### SDK 3.2 (March 14, 2018) ###

- This is an irregular hotfix release.
- Modular framework: Bug fixed whereby some apps with videos might lock up when navigating to other pages.
- Modular framework: Translated English-only messages that appear when signing in to Facebook after your login has expired.

### SDK 3.1 (March 5, 2018) ###

- Modular framework: Fixed sharing to Facebook when your online account login has expired.
- Modular framework: Some improvements to the appearance of Wikipedia articles.
- Modular framework: Fixed some visual regressions around titles on cards.

### SDK 3.0 (February 5, 2018) ###
This is the first release in the SDK3 series.
