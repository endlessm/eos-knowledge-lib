const EvinceDocument = imports.gi.EvinceDocument;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const System = imports.system;

const Config = imports.app.config;
const StyleKnobGenerator = imports.app.compat.styleKnobGenerator;
const Utils = imports.app.utils;

let setup_presenter_for_resource = function (application, resource_path) {
    // Initialize libraries
    EvinceDocument.init();

    // Need to register the knowledge resource before loading the presenter
    let knowledge_resource = Gio.Resource.load(Config.PKGDATADIR + '/eos-knowledge.gresource');
    knowledge_resource._register();

    let app_resource = Gio.Resource.load(resource_path);
    app_resource._register();

    let appname = app_resource.enumerate_children('/com/endlessm', Gio.FileQueryInfoFlags.NONE, null)[0];
    let resource_file = Gio.File.new_for_uri('resource:///com/endlessm/' + appname);
    let app_info_file = resource_file.get_child('app.json');
    let app_info = Utils.parse_object_from_file(app_info_file);
    let overrides_css_file = resource_file.get_child('overrides.css');

    let [success, data] = overrides_css_file.load_contents(null);
    app_info['styles'] = StyleKnobGenerator.get_knobs_from_css(data.toString(), app_info['templateType']);

    application.image_attribution_file = resource_file.get_child('credits.json');

    let PresenterClass;
    switch(app_info['templateType']) {
        case 'A':
        case 'B': {
            const Presenter = imports.app.presenter;
            PresenterClass = Presenter.Presenter;
        }
            break;
        case 'reader': {
            const ReaderPresenter = imports.app.reader.presenter;
            PresenterClass = ReaderPresenter.Presenter;
        }
            break;
        default:
            printerr('Unknown template type', app_info['templateType']);
            System.exit(1);
    }

    return new PresenterClass(app_info, {
        application: application,
    });
};
