const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

const Engine = imports.search.engine;
const SetObjectModel = imports.search.setObjectModel;
const Utils = imports.app.utils;

function load_v1_compatibility_preset (templateType) {
    let preset_uri = 'resource:///com/endlessm/knowledge/data/compat/v1-preset-json/' + templateType + '.json';
    let file = Gio.File.new_for_uri(preset_uri);
    return Utils.parse_object_from_file(file);
}

function transform_v1_description(json) {
    let preset = load_v1_compatibility_preset(json.templateType);
    // Setup helpers for modifying the preset with old json data
    let set_prop_on_module = (module, property, value) => {
        if (!module.hasOwnProperty('properties'))
            module['properties'] = {};
        module['properties'][property] = value;
    };
    let set_prop_for_name = (factory_name, property, value) => {
        let parts = factory_name.split('.');
        let module = preset['modules'][parts[0]];
        for (let slot of parts.slice(1))
            module = module['slots'][slot];
        set_prop_on_module(module, property, value);
    };
    let set_prop_for_type = (type, property, value) => {
        let recurse = (module) => {
            if (type === module.type)
                set_prop_on_module(module, property, value);
            if (!module['slots'])
                return;
            for (let slot in module['slots']) {
                let slot_value = module['slots'][slot];
                if (typeof slot_value === 'object' && slot_value !== null)
                    recurse(slot_value);
            }
        };
        for (let name in preset['modules'])
            recurse(preset['modules'][name]);
    };

    switch (json.templateType) {
    case "A":
    case "B":
    case "buffet":
        set_prop_for_name('window', 'title', json['appTitle']);
        set_prop_for_name('window', 'background-image-uri', json['backgroundHomeURI']);
        set_prop_for_name('window', 'blur-background-image-uri', json['backgroundSectionURI']);
        break;
    case "encyclopedia":
        set_prop_for_name('window', 'title', json['appTitle']);
        set_prop_for_name('window', 'home-background-uri', json['backgroundHomeURI']);
        set_prop_for_name('window', 'results-background-uri', json['backgroundSectionURI']);
        break;
    case "reader":
        set_prop_for_name('window', 'title', json['appTitle']);
        set_prop_for_name('window', 'title-image-uri', json['titleImageURI']);
        set_prop_for_name('window', 'home-background-uri', json['backgroundHomeURI']);
        set_prop_for_name('front-page', 'background-image-uri', json['backgroundHomeURI']);
        set_prop_for_name('back-page', 'background-image-uri', json['backgroundSectionURI']);
        set_prop_for_name('standalone-page', 'title', json['appTitle']);
        set_prop_for_name('standalone-page', 'title-image-uri', json['titleImageURI']);
        set_prop_for_name('standalone-page', 'home-background-uri', json['backgroundHomeURI']);
        break;
    default:
        throw new Error('Unrecognized v1 preset type: ' + json.templateType);
    }

    // Setting properties for types should be relevant no matter what the preset
    set_prop_for_type('AppBanner', 'image-uri', json['titleImageURI']);

    return preset;
}

function create_v1_set_models(json, engine) {
    if (!json.hasOwnProperty('sections'))
        return;

    let sections = json['sections'];
    delete json['sections'];
    sections.forEach((section) => {
        if (!section.hasOwnProperty('thumbnailURI'))
            log("WARNING: Missing category thumbnail for " + section['title']);

        let domain = engine.default_domain;
        let sha = GLib.compute_checksum_for_string(GLib.ChecksumType.SHA1,
            'category' + domain + section['title'], -1);
        let id = 'ekn://' + domain + '/' + sha;

        let model = new SetObjectModel.SetObjectModel({
            ekn_id: id,
            title: section['title'],
            thumbnail_uri: section['thumbnailURI'],
            featured: !!section['featured'],
            tags: [Engine.HOME_PAGE_TAG],
            // In v1, categories had what we now call "child tags", and not what
            // we now call "tags". However, "child tags" were denoted with the
            // "tags" property in app.json.
            child_tags: section['tags'],
        });
        engine.add_runtime_object(id, model);
    });
}

// External links used to be prepended with 'browser-', this strips them off.
function normalize_old_browser_urls (uri) {
    let scheme = GLib.uri_parse_scheme(uri);
    if (scheme !== null && scheme.startsWith('browser-'))
        uri = uri.slice('browser-'.length);
    return uri;
}
