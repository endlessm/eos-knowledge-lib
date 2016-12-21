---
layout: page
title: Contributing
permalink: /contributing
---

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
  - `images/` - miscellaneous UI assets
  - `preset/` - pre-built YAML UI description files
  - `templates/` - code for rendering HTML content; more or less deprecated
  - `widgets/` - GtkBuilder XML files for UI modules in `js/app/modules/`
- `docs/`
  - Various Markdown developer docs
  - `reference/js/` - API reference; not useful right now, being rewritten.
- `js/` - Javascript library code
  - `app/` - the main UI library for creating apps
    - Various app library classes
    - `interfaces/` - interfaces which some UI modules implement
    - `libs/` - external JS code such as Mustache
    - `modules/` - the modular UI blocks (see below)
    - `widgets/` - some GTK widgets for UI code that are not modular UI blocks
  - `search/` - library for accessing databases of offline content
- `lib/` - C library code
  - `eosknowledgeprivate/` - introspectable C wrappers for `js/app/`
  - `eosknowledgesearchprivate/` - introspectable C wrappers for `js/search/`
  - `web-extensions/` - WebKit web extensions for use when viewing documents
- `m4/` - Autoconf code
- `po/` - internationalization (see below)
- `tests/` - unit and integration tests
  - Various utility code for tests
  - `autobahn/` - integration tests for the Autobahn YAML processor
  - `js/` - unit tests for the `js/app` and `js/search` libraries
  - `test-content/` - sample content for some tests
- `tools/` - various testing and development tools

Translations
------------
Please don't do translations by directly editing the `.po` files in this repository.
Instead, sign up at our [Transifex project][transifex] and translate there.

Release schedule
----------------
As this codebase evolves, we will release new versions of it as Flatpak runtimes.
The first public release was in com.endlessm.Platform version eos3.0, which was a unified runtime for all apps shipped with Endless OS 3.0.x.
Subsequent releases will move to a separate runtime.

Once code is released in a runtime branch, the Git repository will be branched and the API considered stable.
Runtimes will receive bug fixes, but no new API and no API changes.

When we add, change, or delete API, this will go in a new Flatpak runtime branch.
It is not expected that apps built for one API release will run on a subsequent release without some porting.

Future notes
------------
More and better documentation on all of this is incoming.

For the next release, we may split this repository up into smaller units.

[JHbuild]: https://developer.gnome.org/jhbuild/stable/
[eos-sdk]: https://github.com/endlessm/eos-sdk
[eos-shard]: https://github.com/endlessm/eos-shard
[xapian-glib]: https://github.com/endlessm/xapian-glib
[xapian-bridge]: https://github.com/endlessm/xapian-bridge
[jasmine-gjs]: https://github.com/ptomato/jasmine-gjs
[transifex]: https://www.transifex.com/endless-mobile-inc/eos-knowledge-lib/
