---
short-description: How to write and use a custom module
...
# Custom Modules

The framework provides [modules](modules.md) that app creators can combine to create their apps. Now, they can also write and use their own modules using [Gjs](https://gitlab.gnome.org/GNOME/gjs/wikis/Home).

## Writing a Module

A custom module can look as simple as the example below. Note that the custom `Fixed` class is created from the `Module` class, which is the basic requirement. Other requirements could apply depending on what type of module it is or, more importantly, the type of [slot](modules.md) it should go into.

```javascript
const Gtk = imports.gi.Gtk;
const Module = imports.app.interfaces.module;

var Fixed = new Module.Class({
    Name: 'Banner.Fixed',
    Extends: Gtk.Label,

    _init(props={}) {
        props.label = 'Fixed';
        this.parent(props);
    },
});
```

## Including a Module

To include a module, the file must be added under the `/app/js/` prefix in the app's `gresource` file.

```xml
<?xml version="1.0" ?>
<gresources>
    <gresource prefix="/app/js">
        <file>banner/fixed.js</file>
    </gresource>
</gresources>
```

## Using a Module

Finally, to use a module, it must be referenced from the app's [YAML](concepts/yaml_format.md) file.

```yaml
root:
  type: Banner.Fixed
```

## A Custom Importer

To access a custom module class, from another custom module, an importer named `custom_modules` is provided.

```javascript
const Fixed = custom_modules.banner.fixed;
```
