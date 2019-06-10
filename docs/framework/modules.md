---
short-description: Overview of the types of UI modules
...
Modules
=======
Here are the types of UI modules and how they fit together.

- **Arrangement** - These modules generally have a `card` slot which a
  **Card** can go into.
  They arrange a set of dynamically created cards on the screen.
- **[Banner](modules/banner.md)** - These modules represent a piece of data which is
  presented to the user, such as an app's logo or a search term.
- **Card** - These modules represent a document in the database of
  offline content, but are not a full **View** of the document.
  They display its metadata (title, keywords) in various ways.
- **ContentGroup** - This is the heart of displaying offline content.
  Content groups have `selection` and `arrangement` slots.
  They make sure the **Arrangement** receives (and creates **Card**s
  for) the records that the **Selection** wants to display.
- **Controller** - These modules define different types of app
  experiences.
  They are in charge of what happens when you click somewhere.
- **Decoration** - These modules are UI elements which are used for
  display only.
- **Filter** - These modules can be added to a **Selection** to display
  only some of its records.
- **Layout** - These modules contain submodules and arrange them on on
  page of the app.
- **Navigation** - These modules are UI elements which are used for
  navigation through an app.
- **Order** - These modules can be added to a **Selection** to change
  the sorting order in which its records are displayed.
- **Pager** - Modules can also act as pages of an app, like pages in a
  website.
  Pager modules contain submodules and display them one at a time, with optional animations between them.
- **Selection** - These modules retrieve content records from the
  offline content database.
  A **Selection** serves records through a **ContentGroup** to an
  **Arrangement**, which turns the records into **Card**s.
- **View** - These modules display the actual content.
- **[Window](modules/window.md)** - These modules are the toplevel windows
  which contain other modules.

Here's a diagram of what contains what:

```
Controller
  Window
    Pager
      Layout
        Banner
        Decoration
        Navigation
        (more) Layout
        View
        ContentGroup
          Arrangement
            Card
          Selection
            Order
            Filter
```