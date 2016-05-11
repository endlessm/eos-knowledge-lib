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
                if (typeof slot_value === 'object' && slot_value !== null)
                    recurse(slot_value);
            }
        };
        recurse(preset['root']);
    }

    if (json.templateType === "reader")
        set_prop_for_type('SplitPercentageTemplate', 'background-image-uri', json['backgroundHomeURI']);

    set_prop_for_type('AppBanner', 'image-uri', json['titleImageURI']);
    set_prop_for_type('BackCover', 'background-image-uri', json['backgroundSectionURI']);
    set_prop_for_type('EncyclopediaWindow', 'title', json['appTitle']);
    set_prop_for_type('EncyclopediaWindow', 'home-background-uri', json['backgroundHomeURI']);
    set_prop_for_type('EncyclopediaWindow', 'results-background-uri', json['backgroundSectionURI']);
    set_prop_for_type('ReaderWindow', 'title', json['appTitle']);
    set_prop_for_type('ReaderWindow', 'title-image-uri', json['titleImageURI']);
    set_prop_for_type('ReaderWindow', 'home-background-uri', json['backgroundHomeURI']);
    set_prop_for_type('StandaloneBanner', 'title', json['appTitle']);
    set_prop_for_type('StandaloneBanner', 'title-image-uri', json['titleImageURI']);
    set_prop_for_type('StandaloneBanner', 'background-image-uri', json['backgroundHomeURI']);
    set_prop_for_type('Window', 'title', json['appTitle']);
    set_prop_for_type('Window', 'background-image-uri', json['backgroundHomeURI']);
    set_prop_for_type('Window', 'blur-background-image-uri', json['backgroundSectionURI']);

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
