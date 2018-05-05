---
layout: page
permalink: /releases/schedule/
---

| Major release | Date              | GNOME version
|:--------------|:------------------|:-------------
| [SDK1]        | July 3, 2017      | 3.24
| [SDK2]        | November 20, 2017 | 3.26
| [SDK3]        | February 5, 2018  |
| **[SDK4]**    | May 4, 2018       | 3.28
| SDK5          | August 2, 2018    |
| SDK6          | November 1, 2018  | 3.30

## Release cycle ##

- **Feature freeze** &mdash; four weeks before a major release.
  New functionality must be implemented.
  If a feature is not working yet at this point, then the release managers must examine whether to back it out.
  Developer APIs should not be changed after this point without approval from the release maintainers.
  Strings needing translation should not be changed after this point without approval from the release maintainers and the internationalization team.
  Translation and documentation can continue.

- **Hard code freeze** &mdash; two weeks before a major release, or one week before a bugfix release.
  No source code changes can be made after this point without approval from the release maintainers.
  Translation and documentation can continue.

- **Major release** &mdash; is built on the first Thursday of February, May, August, and November, and released the following Monday.
  After this point, the development runtime is designated stable and is included on Endless OS images.
  The previous stable runtime is designated EOL.
  Translation and documentation can continue, but the focus of development should be on the next major release.

- **Bugfix release** &mdash; is built on the first Thursday of every month where there is no major release, and released on the following Monday.
  A new version of the stable runtime becomes current.

- **EOL** (End Of Life) &mdash; on the day of the following major release.
  Once there is a new stable runtime, we no longer support the old stable runtime.
  It will continue to be available, but will receive no more bug, translation, or documentation fixes.

[SDK1]: /eos-knowledge-lib/releases/1
[SDK2]: /eos-knowledge-lib/releases/2
[SDK3]: /eos-knowledge-lib/releases/3
[SDK4]: /eos-knowledge-lib/releases/4
