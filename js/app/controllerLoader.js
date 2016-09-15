const EvinceDocument = imports.gi.EvinceDocument;
const Gio = imports.gi.Gio;

const ModuleFactory = imports.app.moduleFactory;
const Utils = imports.app.utils;

let create_controller_with_app_json = function (application, app_json, extra_props={}) {
    // Initialize libraries
    EvinceDocument.init();

    let factory = new ModuleFactory.ModuleFactory({
        app_json: app_json,
    });

    extra_props.application = application;
    return factory.create_root_module(extra_props);
}

let create_controller = function (application, resource_path) {
    let app_resource = Gio.Resource.load(resource_path);
    app_resource._register();

    let gresource_path = 'resource:///app/';
    let resource_file = Gio.File.new_for_uri(gresource_path);
    let app_json_file = resource_file.get_child('app.json');
    let app_json = Utils.parse_object_from_file(app_json_file);
    let overrides_css_file = resource_file.get_child('overrides.css');

    let css = '';
    if (overrides_css_file.query_exists(null)) {
        let [success, data] = overrides_css_file.load_contents(null);
        css = data.toString();
    }

    application.image_attribution_file = resource_file.get_child('credits.json');

    return create_controller_with_app_json(application, app_json, {
        css: css,
    });
};
