---
short-description: Understanding the YAML format used to create apps
...
# The YAML format

The Modular framework provides tools for creating knowledge apps by combining existing modules.
App creators can combine these modules and describe the visual structure of their apps by writing YAML files that follow a specific format.
This YAML format exposes the framework API and provides helpers to write these apps' descriptions more easily.
This document is meant to explain the format of this YAML file.
Here's the first example:

```yaml
---
root:
  type: Controller.Mesh
  slots:
    window:
      type: Window.Simple
      slots:
        content:
          type: ContentGroup.StaticText
          properties:
            label: Hello World
```

This is the simplest working app that can be described using the YAML format.
The app description follows a tree-like structure, always starting from a `root` node.
Each node represents a module of the framework.
The most basic components of a node are:

* the `type` of the module to be used in that node.
* the `properties` of the module.
* the `slots` of that module.

A real example:
```yaml
---
root:
  type: Controller.Mesh
  slots:
    window:
      type: Window.Simple
      slots:
        content:
          type: Pager.Simple
          slots:
            home-page:
              type: ContentGroup.ContentGroup
              properties:
                expand: true
              slots:
                arrangement:
                  type: Arrangement.List
                  properties:
                    expand: true
                  slots:
                    card:
                      type: Card.List
                      properties:
                        expand: true
                selection:
                  type: Selection.All
                  slots:
                    filter:
                      type: Filter.Articles
                    order:
                      type: Order.Sequence
```

This example expands the previous one.
Now the app is capable of handling pages and displays a list of articles sorted in a sequence, on its home page.
Extracting one of the nodes to see its components:

```yaml
arrangement:
  type: Arrangement.List
  properties:
    expand: true
  slots:
    card:
```

This is a node named `arrangement` for a module type [Arrangement.List](Arrangement.List), which sets a property named `expand`, with only one slot named `card`.
The `slots` key is used to add sub-nodes, and to construct the tree.
The list of available `properties` and `slots` depends on each type of module.
As shown in the full example above, we can create a wide variety of apps by combining and constructing [module trees](modules.md).

# Features

## Shortdef

To write more readable and compact apps' descriptions, the format includes a `shortdef` key.
The example below is identical to the previous one, except that it uses the key:

```yaml
---
root:
  type: Controller.Mesh
  slots:
    window:
      type: Window.Simple
      slots:
        content:
          type: Pager.Simple
          slots:
            home-page:
              shortdef: 'ContentGroup.ContentGroup(expand: true)'
              slots:
                arrangement:
                  shortdef: 'Arrangement.List(expand: true)'
                  slots:
                    card: 'Card.List(expand: true)'
                selection:
                  type: Selection.All
                  slots:
                    filter: Filter.Articles
                    order: Order.Sequence
```

In this example, the `type` and `properties` keys are combined into single lines with the help of the `shortdef` key, e.g. `shortdef: 'Arrangement.List(expand: true)'`.
When no slots are needed, the `shortdef` key can be omitted, using the short description directly on the slot name, e.g. `card: 'Card.List(expand: true)'`.

## References

Some modules need access to other modules' properties.
To do this, the format includes the `id` and `references` keys, see the example below:

```yaml
---
root:
  type: Controller.Mesh
  slots:
    window:
      type: Window.Simple
      slots:
        content:
          type: Pager.Simple
          slots:
            home-page:
              shortdef: 'Layout.InfiniteScrolling(expand: true)'
              references:
                lazy-load: all-articles
              slots:
                content:
                  shortdef: 'ContentGroup.ContentGroup(expand: true)'
                  slots:
                    arrangement:
                      shortdef: 'Arrangement.List(expand: true)'
                      slots:
                        card: 'Card.List(expand: true)'
                    selection:
                      type: Selection.All
                      id: all-articles
                      slots:
                        filter: Filter.Articles
                        order: Order.Sequence
```

In this example a [Layout.InfiniteScrolling](Layout.InfiniteScrolling) module is added, which needs access to the [Selection.All](Selection.All) module.
To do this, the selection module defines its identifier `all-articles` using the `id` key.
Then, the scrolling module `references` the selection using the identifier.
The `lazy-load` reference name is what the scrolling module uses to access this reference.
The list of available references names depends on each type of module.

## Styles

App creators will likely need to style specific nodes and, to avoid complex CSS selectors, the easiest way to do it is by adding custom CSS classes.
The format includes the `styles` key to add one or more CSS classes.
See the example below:

```yaml
---
root:
  type: Controller.Mesh
  slots:
    window:
      type: Window.Simple
      slots:
        content:
          type: Pager.Simple
          slots:
            home-page:
              shortdef: 'Layout.InfiniteScrolling(expand: true)'
              references:
                lazy-load: all-articles
              slots:
                content:
                  shortdef: 'ContentGroup.ContentGroup(expand: true)'
                  styles:
                    - ContentGroup--articles
                  slots:
                    arrangement:
                      shortdef: 'Arrangement.List(expand: true)'
                      slots:
                        card: 'Card.List(expand: true)'
                    selection:
                      type: Selection.All
                      id: all-articles
                      slots:
                        filter: Filter.Articles
                        order: Order.Sequence
```

In this example, a `ContentGroup--articles` [BEM-style](https://css-tricks.com/bem-101/) CSS class is added to a node.
After that, the CSS class can be used from the app's theme to style that specific node.

## Imports

Each app must include its own app description, but there is no need to write it from scratch.
The framework provides pre-defined apps' descriptions or presets, for different kinds of app experiences.
The format includes the `!import` tag to use these presets.
See the example below:

```yaml
---
!import 'news'
```

In this example the app includes its own complete copy of the `news` preset, provided by the framework.
The copy occurs while building the app.

## Overrides

Using a preset can be limiting, as app creators often want to customize things.
One way to overcome this limitation is to manually copy and modify the preset, but [forking](https://simple.wikipedia.org/wiki/Fork_(software_development)) the preset makes the maintenance of the apps harder.
Overrides provides a better way of handling this situation, by allowing app creators to customize specific parts of a preset without forking it.
The format includes two different override methods: variables overrides and custom overrides.

### Variables and Overrides

The YAML format allows to add customization points to the presets, by declaring variables in a `vars` section of the preset.
Each variable is defined with a default value and the variables can be referenced from within the preset using the `refvar` key.
See the example below:

```yaml
---
vars:
  home-arrangement:
    shortdef: 'Arrangement.List(expand: true)'
  home-card:
    shortdef: 'Card.List(expand: true)'
root:
  type: Controller.Mesh
  slots:
    window:
      type: Window.Simple
      slots:
        content:
          type: Pager.Simple
          slots:
            home-page:
              shortdef: 'Layout.InfiniteScrolling(expand: true)'
              references:
                lazy-load: all-articles
              slots:
                content:
                  shortdef: 'ContentGroup.ContentGroup(expand: true)'
                  styles:
                    - ContentGroup--articles
                  slots:
                    arrangement:
                      refvar: $home-arrangement
                      slots:
                        card: $home-card
                    selection:
                      type: Selection.All
                      id: all-articles
                      slots:
                        filter: Filter.Articles
                        order: Order.Sequence
```

In this example, two variables `home-arrangement` and `home-card` were added to the example from before.
These variables are referenced from within the preset using the `refvar` key.
Note that a `$` prefix is needed for referencing variable names.
A short form is also available when referencing variables from a node name, e.g. `card: $home-card`.

Once variables are available in a preset, the app creators can use and customize these presets by overriding the defaults.
To override the preset defaults an `overrides` section must be added to the app description.
See the example below:

```yaml
---
overrides:
  home-arrangement:
    shortdef: 'Arrangement.Grid(expand: true)'
  home-card:
    shortdef: 'Card.Default(expand: true)'
---
!import 'example_preset'
```

In this example, the preset is imported and these two variables are overridden.
Note that this requires to split the same YAML file in two documents, adding the YAML `---` separator.
The benefit of using variables overrides is that these are more likely to be kept in future versions of the framework.
If a variable is removed from the framework, the override will be ignored.

### Custom Overrides

There are other cases where app creators need to customize parts of a preset that are not exposed with variables.
In these cases, custom overrides can be used as the example below:

```yaml
---
overrides:
  home-arrangement:
    shortdef: 'Arrangement.Grid(expand: true)'
  home-card:
    shortdef: 'Card.Default(expand: true)'
  root.window.content:
    type: Pager.ParallaxBackground
---
!import 'example_preset'
```

In this example, a custom override was added to the overrides section to customize a node that is not exposed with a variable.
Instead of a variable name, the node identifier is composed of the names of the nodes from the root node to the target node, forming a path, e.g. `root.window.content`.

The benefit of this feature is that app creators can modify any portion of the preset.
But power comes with a price, these paths can change if the preset changes its structure, e.g. during a refactor of the preset.
In that case, the custom override will be ignored.
Therefore, use this override method with care and always double check when porting apps to newer major versions of the framework.

