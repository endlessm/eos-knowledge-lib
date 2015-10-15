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
    let modules = preset['modules'];
    switch (json.templateType) {
    case "A":
        modules['window']['properties']['title'] = json['appTitle'];
        modules['window']['properties']['background-image-uri'] = json['backgroundHomeURI'];
        modules['window']['properties']['blur-background-image-uri'] = json['backgroundSectionURI'];
        modules['app-banner']['properties']['image-uri'] = json['titleImageURI'];
        break;
    case "B":
        modules['window']['properties']['title'] = json['appTitle'];
        modules['window']['properties']['background-image-uri'] = json['backgroundHomeURI'];
        modules['window']['properties']['blur-background-image-uri'] = json['backgroundSectionURI'];
        modules['app-banner']['properties']['image-uri'] = json['titleImageURI'];
        break;
    case "encyclopedia":
        modules['window']['properties']['title'] = json['appTitle'];
        modules['window']['properties']['home-background-uri'] = json['backgroundHomeURI'];
        modules['window']['properties']['results-background-uri'] = json['backgroundSectionURI'];
        modules['app-banner']['properties']['image-uri'] = json['titleImageURI'];
        modules['article-app-banner']['properties']['image-uri'] = json['titleImageURI'];
        break;
    case "reader":
        modules['window']['properties']['title'] = json['appTitle'];
        modules['window']['properties']['title-image-uri'] = json['titleImageURI'];
        modules['window']['properties']['home-background-uri'] = json['backgroundHomeURI'];
        modules['app-banner']['properties']['image-uri'] = json['titleImageURI'];
        modules['app-banner']['properties']['subtitle'] = json['appSubtitle'];
        modules['front-page']['properties']['background-image-uri'] = json['backgroundHomeURI'];
        modules['back-page']['properties']['background-image-uri'] = json['backgroundSectionURI'];
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
