/* exported add_preset_style_classes, extract_css_from_v1_description,
load_v1_compatibility_preset, transform_v1_description */

const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const ModuleFactory = imports.app.moduleFactory;
const Utils = imports.app.utils;

function load_v1_compatibility_preset (templateType) {
    let preset_uri = 'resource:///com/endlessm/knowledge/data/compat/v1-preset-json/' + templateType + '.json';
    let file = Gio.File.new_for_uri(preset_uri);
    return Utils.parse_object_from_file(file);
}

function transform_v1_description(json) {
    let preset = load_v1_compatibility_preset(json.templateType);
    // Setup helpers for modifying the preset with old json data
    function set_prop_for_type (type, property, value) {
        let recurse = (module) => {
            if (type === module.type) {
                if (!module.hasOwnProperty('properties'))
                    module['properties'] = {};
                module['properties'][property] = value;
            }
            if (!module['slots'])
                return;
            for (let slot in module['slots']) {
                let slot_value = module['slots'][slot];
                if (Array.isArray(slot_value))
                    slot_value.forEach(recurse);

                if (typeof slot_value === 'object' && slot_value !== null)
                    recurse(slot_value);
            }
        };
        recurse(preset[ModuleFactory.ROOT_NAME]);
    }

    set_prop_for_type('Banner.App', 'image-uri', json['titleImageURI']);
    set_prop_for_type('Window.Encyclopedia', 'title', json['appTitle']);
    set_prop_for_type('Window.App', 'title', json['appTitle']);
    set_prop_for_type('Pager.ParallaxBackground', 'background-image-uri',
        json['backgroundHomeURI']);

    return preset;
}

function add_preset_style_classes(win, template_type) {
    if (template_type === 'A')
        win.get_style_context().add_class('preset-a');
    else if (template_type === 'B')
        win.get_style_context().add_class('preset-b');
}

function extract_css_from_v1_description(json) {
    let primary = json['backgroundHomeURI'];
    let secondary = json['backgroundSectionURI'];

    let css = '\nEosWindow { background-image: url("' + primary + '"); }\n';
    switch (json['templateType']) {
        case 'A':
        case 'B':
            css += '.PagerParallaxBackground--left {\
                background-image: url("' + primary + '");\
            }\
            .PagerParallaxBackground--center, .PagerParallaxBackground--right {\
                background-image: url("' + secondary + '");\
            }';
            break;
        case 'encyclopedia':
            css += '.article-page, .search-page {\
                background-image: url("' + secondary + '");\
            }';
    }

    let provider = new Gtk.CssProvider();
    provider.load_from_data(css);
    Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
        provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
}
