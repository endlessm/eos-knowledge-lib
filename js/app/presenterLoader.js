const EvinceDocument = imports.gi.EvinceDocument;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const System = imports.system;

const Config = imports.app.config;
const ModuleFactory = imports.app.moduleFactory;
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
    let app_json_file = resource_file.get_child('app.json');
    let app_json = Utils.parse_object_from_file(app_json_file);
    let overrides_css_file = resource_file.get_child('overrides.css');

    let factory = new ModuleFactory.ModuleFactory({
        app_json: app_json,
    });

    if (overrides_css_file.query_exists(null)) {
        let [success, data] = overrides_css_file.load_contents(null);
        app_json['styles'] = StyleKnobGenerator.get_knobs_from_css(data.toString(), app_json['templateType']);
    } else {
        app_json['styles'] = {};
    }

    application.image_attribution_file = resource_file.get_child('credits.json');

    let PresenterClass;
    switch(app_json['templateType']) {
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
        case 'encyclopedia': {
            const EncyclopediaPresenter = imports.app.encyclopedia.presenter;
            PresenterClass = EncyclopediaPresenter.EncyclopediaPresenter;
        }
            break;
        default:
            printerr('Unknown template type', app_json['templateType']);
            System.exit(1);
    }

    return new PresenterClass(app_json, {
        application: application,
        factory: factory,
    });
};
