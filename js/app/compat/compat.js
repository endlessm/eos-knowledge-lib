const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

const Engine = imports.search.engine;
const SetObjectModel = imports.search.setObjectModel;
const Utils = imports.app.utils;

function load_v1_compatibility_preset (templateType) {
    let preset_uri = 'resource:///com/endlessm/knowledge/compat/v1-preset-json/' + templateType + '.json';
    let file = Gio.File.new_for_uri(preset_uri);
    return Utils.parse_object_from_file(file);
}

function transform_v1_description(json) {
    let preset = load_v1_compatibility_preset(json.templateType);
    let set_property = (factory_name, property, value) => {
        let parts = factory_name.split('.');
        let module = preset['modules'][parts[0]];
        for (let slot of parts.slice(1))
            module = module['slots'][slot];
        module['properties'][property] = value;
    };
    switch (json.templateType) {
    case "A":
        set_property('window', 'title', json['appTitle']);
        set_property('window', 'background-image-uri', json['backgroundHomeURI']);
        set_property('window', 'blur-background-image-uri', json['backgroundSectionURI']);
        set_property('home-page.top', 'image-uri', json['titleImageURI']);
        break;
    case "B":
        set_property('window', 'title', json['appTitle']);
        set_property('window', 'background-image-uri', json['backgroundHomeURI']);
        set_property('window', 'blur-background-image-uri', json['backgroundSectionURI']);
        set_property('home-page.top-left', 'image-uri', json['titleImageURI']);
        break;
    case "encyclopedia":
        set_property('window', 'title', json['appTitle']);
        set_property('window', 'home-background-uri', json['backgroundHomeURI']);
        set_property('window', 'results-background-uri', json['backgroundSectionURI']);
        set_property('home-page.top', 'image-uri', json['titleImageURI']);
        set_property('search-page.top-left', 'image-uri', json['titleImageURI']);
        set_property('article-page.top-left', 'image-uri', json['titleImageURI']);
        break;
    case "reader":
        set_property('window', 'title', json['appTitle']);
        set_property('window', 'title-image-uri', json['titleImageURI']);
        set_property('window', 'home-background-uri', json['backgroundHomeURI']);
        set_property('front-page.content', 'image-uri', json['titleImageURI']);
        set_property('front-page.content', 'subtitle', json['appSubtitle']);
        set_property('front-page', 'background-image-uri', json['backgroundHomeURI']);
        set_property('back-page', 'background-image-uri', json['backgroundSectionURI']);
        break;
    default:
        throw new Error('Unrecognized v1 preset type: ' + json.templateType);
    }

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
