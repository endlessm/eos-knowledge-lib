---
layout: page
title: About
permalink: /about
---

Introduction to offline content apps
------------------------------------
**UI structure + UI theme + content = app.**

The **structure** is written in terms of modular UI blocks (see below) assembled in a declarative UI file.
This declarative file is a JSON file.
However, we include a preprocessor tool called Autobahn so that you can write your app description in a more expressive, human-friendly YAML format.
See [`data/preset/*.yaml`][presets] for examples.

The **theme** is a GTK CSS file.
We suggest writing themes using SCSS and then compiling them down to regular CSS.
We provide SCSS modules that your SCSS code can import; see [`data/css/`][themes].

The **content** is in the form of a shard file; see [eos-shard] for more information.
We are working on tools that allow you to build shard files easily on your own machine.
For now, you can include the `--dummy-content` option when running an app and it will load with sample content.

Modular UI blocks
-----------------
UI modules are GObjects, with a few extra features and a few restrictions.
They are meant to be assembled in a declarative file, without writing having to write any code such as signal handlers.

First of all, UI modules do not emit signals, because their behavior is part of their implementation, and UI descriptions are purely declarative: no code.
All properties accessible from the declarative file are treated as construct-only (except when using property bindings.)
Modules have **slots** and **references**, which are named spots where other modules can be contained or referenced.

Here are the types of UI modules and how they fit together.
See [`js/app/modules/`][modules] for the code.

- **Arrangement** - These modules generally have a `card` slot which a **Card** can go into.
  They arrange a set of dynamically created cards on the screen.
- **Banner** - These modules represent a piece of data which is presented to the user, such as an app's logo or a search term.
- **Card** - These modules represent a document in the database of offline content.
  They display its metadata (title, keywords) in various ways.
- **ContentGroup** - This is the heart of displaying offline content.
  Content groups have `selection` and `arrangement` slots.
  They make sure the **Arrangement** receives (and creates **Card**s for) the records that the **Selection** wants to display.
- **Controller** - These modules define different types of app experiences.
  They are in charge of what happens when you click somewhere.
- **Decoration** - These modules are UI elements which are used for display only.
- **Filter** - These modules can be added to a **Selection** to display only some of its records.
- **Layout** - These modules contain submodules and arrange them on one page of the app.
- **Navigation** - These modules are UI elements which are used for navigation through an app.
- **Order** - These modules can be added to a **Selection** to change the sorting order in which its records are displayed.
- **Pager** - Modules can also act as pages of an app, like pages in a website.
  Pager modules contain submodules and display them one at a time, with optional animations between them.
- **Selection** - These modules retrieve content records from the offline content database.
  A **Selection** serves records through a **ContentGroup** to an **Arrangement**, which turns the records into **Card**s.
- **Window** - These modules are the toplevel windows which contain other modules.

Here's a diagram of what contains what, roughly:

```
Controller
  Window
    Pager
      Layout
        Banner
        Decoration
        Navigation
        (more) Layout
        ContentGroup
          Arrangement
            Card
          Selection
```

[presets]: https://github.com/endlessm/eos-knowledge-lib/tree/master/data/preset
[themes]: https://github.com/endlessm/eos-knowledge-lib/tree/master/data/css
[eos-shard]: https://github.com/endlessm/eos-shard
[modules]: https://github.com/endlessm/eos-knowledge-lib/tree/master/js/app/modules