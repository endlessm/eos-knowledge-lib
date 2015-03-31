/* global private_imports */

const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const System = imports.system;

const Presenter = private_imports.presenter;
const ReaderPresenter = private_imports.reader.presenter;
const Utils = private_imports.utils;

let get_presenter_for_resource = function (application, resource_path) {
    let resource = Gio.Resource.load(resource_path);
    resource._register();

    let appname = resource.enumerate_children('/com/endlessm', Gio.FileQueryInfoFlags.NONE, null)[0];
    let resource_file = Gio.File.new_for_uri('resource:///com/endlessm/' + appname);
    let app_info_file = resource_file.get_child('app.json');
    let app_info = Utils.parse_object_from_file(app_info_file);
    let overrides_css_file = resource_file.get_child('overrides.css');
    Utils.add_css_provider_from_file(overrides_css_file, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION + 1);
    application.image_attribution_file = resource_file.get_child('credits.json');

    let PresenterClass;
    switch(app_info['templateType']) {
        case 'A':
        case 'B':
            PresenterClass = Presenter.Presenter;
            // FIXME: We currently don't have image attribution files for the
            // template A and B knowledge apps. Override this here until we do.
            application.image_attribution_file = null;
            break;
        case 'reader':
            PresenterClass = ReaderPresenter.Presenter;
            break;
        default:
            printerr('Unknown template type', app_info['templateType']);
            System.exit(1);
    }

    return new PresenterClass(app_info, {
        application: application,
    });
};
