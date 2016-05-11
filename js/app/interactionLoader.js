const EvinceDocument = imports.gi.EvinceDocument;
const Gio = imports.gi.Gio;

const ModuleFactory = imports.app.moduleFactory;
const Utils = imports.app.utils;

let create_interaction = function (application, resource_path) {
    // Initialize libraries
    EvinceDocument.init();

    let app_resource = Gio.Resource.load(resource_path);
    app_resource._register();

    let appname = app_resource.enumerate_children('/com/endlessm', Gio.FileQueryInfoFlags.NONE, null)[0];
    let resource_file = Gio.File.new_for_uri('resource:///com/endlessm/' + appname);
    let app_json_file = resource_file.get_child('app.json');
    let app_json = Utils.parse_object_from_file(app_json_file);
    let overrides_css_file = resource_file.get_child('overrides.css');

    let factory = new ModuleFactory.ModuleFactory({
        app_json: app_json,
    });

    let css = '';
    if (overrides_css_file.query_exists(null)) {
        let [success, data] = overrides_css_file.load_contents(null);
        css = data.toString();
    }

    application.image_attribution_file = resource_file.get_child('credits.json');

    return factory.create_module_tree({
        // v2 app.jsons have no templateType key
        template_type: app_json['templateType'] || '',
        css: css,
        application: application,
    });
};
