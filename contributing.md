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

Building
--------
We recommend using [JHbuild] to build this code, especially if you are planning to make changes to it.
A sample JHbuild moduleset is included in the root directory of this repository.

First download the moduleset with:

```sh
wget https://raw.githubusercontent.com/endlessm/eos-knowledge-lib/master/eos-knowledge-lib.modules
```

Then edit `~/.config/jhbuildrc` to get JHbuild to use the provided moduleset.
Here's an example jhbuildrc file:

```python
# Change this path to the directory where you put the moduleset file
modulesets_dir = os.path.expanduser('~')
moduleset = ['eos-knowledge-lib']
modules = ['eos-knowledge-lib']

# Change these two paths to your liking
checkoutroot = os.path.expanduser('~/checkout')
prefix = os.path.expanduser('~/install')

# Set options to your liking
os.environ['CFLAGS'] = '-g -Og -fdiagnostics-color=auto'
use_local_modulesets = True
```

To build, then do:

```sh
jhbuild sysdeps --install
jhbuild build
```

You will also have to make sure `xapian-bridge` is running in the background:

```sh
jhbuild run xapian-bridge &
```

To run the tests:

```sh
jhbuild make check
```

If not using JHbuild you first need to clone, build, and install these other Endless repositories:

 - [eos-sdk]
 - [eos-shard]
 - [xapian-glib]
 - [xapian-bridge]

If you wish to run the tests, you will also need to clone, build, and install [jasmine-gjs].
Other dependencies are PyYAML for Python 3, and an SCSS compiler.
Install these using your system's package manager.

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

[JHbuild]: https://developer.gnome.org/jhbuild/stable/
[eos-sdk]: https://github.com/endlessm/eos-sdk
[eos-shard]: https://github.com/endlessm/eos-shard
[xapian-glib]: https://github.com/endlessm/xapian-glib
[xapian-bridge]: https://github.com/endlessm/xapian-bridge
[jasmine-gjs]: https://github.com/ptomato/jasmine-gjs
[transifex]: https://www.transifex.com/endless-mobile-inc/eos-knowledge-lib/
[release schedule]: /eos-knowledge-lib/releases/schedule
