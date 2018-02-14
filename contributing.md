---
layout: page
title: Contributing
permalink: /contributing
---

Flatpak runtime
---------------

To add the Flatpak repository, run:

```sh
flatpak remote-add --from eos-sdk http://endlessm.github.io/eos-knowledge-lib/eos-sdk.flatpakrepo
```

If you are running Endless OS 3.2 or later, you will already have the repository.

Available runtimes:

| ID                                | Description |
|:----------------------------------|:----|
| com.endlessm.apps.Platform        | Runtime |
| com.endlessm.apps.Platform.Locale | Runtime translations (extension) |
| com.endlessm.apps.Sdk             | SDK |
| com.endlessm.apps.Sdk.Debug       | SDK debug information (extension) |
| com.endlessm.apps.Sdk.Locale      | SDK translations (extension) |

The runtimes are built from definitions in the [endless-sdk-flatpak](https://github.com/endlessm/endless-sdk-flatpak) Git repository.

To access nightly builds (currently only for x86-64), you can additionally add the nightly repository:

```sh
flatpak remote-add --from eos-sdk-nightly http://endlessm.github.io/eos-knowledge-lib/eos-sdk-nightly.flatpakrepo
```

Building
--------
We recommend using [Flapjack] to build this code, especially if you are planning to make changes to it.
The [example.flapjack.ini] configuration file included with Flapjack is precisely made to build the `eos-knowledge-lib` and other components.

Copy the `example.flapjack.ini` to `~/.config/flapjack.ini` and follow the instructions for [Flapjack] to know how to build, test, and run apps.

If you wish to run the tests, you will also need to clone, build, and install [jasmine-gjs].

Finding your way around
-----------------------
Here's an overview of what's in each directory:

- `data/`
  - `css/` - themes and parts of themes for UI modules
  - `icons/` - parts of icon themes for UI modules
  - `images/` - miscellaneous UI assets
  - `preset/` - pre-built YAML UI description files
  - `templates/` - code for rendering HTML content; more or less deprecated
  - `widgets/` - GtkBuilder XML files for UI modules in `js/app/modules/`
- `docs/`
  - `api/` - API reference; not useful right now, being rewritten
  - `framework/` - reference for UI modules
- `ekncontent/` - library for accessing databases of offline content
  - `docs/` - gtk-doc documentation
  - `ekncontent/` - C sources
  - `eknvfs/` - module for resolving `ekn://` URIs
  - `m4/` - Autoconf code
  - `overrides/` - additions for using ekncontent in Javascript code
  - `tests/` - unit and integration tests
- `js/` - Javascript library code
  - `app/` - the main UI library for creating apps
    - Various app library classes
    - `interfaces/` - interfaces which some UI modules implement
    - `libs/` - external JS code such as Mustache
    - `modules/` - the modular UI blocks (see below)
    - `widgets/` - some GTK widgets for UI code that are not modular UI blocks
- `lib/` - C library code
  - `eosknowledgeprivate/` - introspectable C wrappers for `js/app/`
  - `web-extensions/` - WebKit web extensions for use when viewing documents
- `m4/` - Autoconf code
- `po/` - internationalization (see below)
- `tests/` - unit and integration tests
  - Various utility code for tests
  - `autobahn/` - integration tests for the Autobahn YAML processor
  - `js/app/` - unit tests for the code in `js/app`
  - `test-content/` - sample content for some tests
- `tools/` - various testing and development tools

Translations
------------
Please don't do translations by directly editing the `.po` files in this repository.
Instead, sign up at our [Transifex project][transifex] and translate there.

Release schedule and future plans
---------------------------------
For more information, see the [release schedule].

[Flapjack]: https://github.com/endlessm/flapjack
[example.flapjack.ini]: https://github.com/endlessm/flapjack/blob/master/example.flapjack.ini
[jasmine-gjs]: https://github.com/ptomato/jasmine-gjs
[transifex]: https://www.transifex.com/endless-mobile-inc/eos-knowledge-lib/
[release schedule]: /eos-knowledge-lib/releases/schedule
