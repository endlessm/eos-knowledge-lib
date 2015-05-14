const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

// AppFactoryFactoryFactory
// This component interprets app.json and creates 

const Factory = new Lang.Class({
    Name: 'Factory',
    Extends: GObject.Object,
    Properties: {
        'app-description': GObject.ParamSpec.object('app-description',
            'App description', 'File handle to app.json describing the app',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            GObject.Object.$gtype),  // FIXME: should be Gio.File
        'application-id': GObject.ParamSpec.string('application-id',
            'Application ID', 'Application ID to pass to GApplication',
            GObject.ParamFlags.READABLE,
            ''),
        'title': GObject.ParamSpec.string('title', 'Title',
            'Title of the application',
            GObject.ParamFlags.READABLE,
            ''),
    },

    _init: function (props) {
        this.parent(props);

        // Should be async init
        let [success, contents] = this.app_description.load_contents(null);
        this._description = JSON.parse(contents);

        this._application_id = this._description['id'];
        this._title = this._description['title'];
    },

    get application_id() {
        return this._application_id;
    },

    get title() {
        return this._title;
    },

    create_app: function () {
        // Import this here because the app has a factory as a property
        const App = imports.app;
        return new App.App({
            application_id: this.application_id,
            css_file: Gio.File.new_for_uri(this._description['css']),
            factory: this,
        });
    },

    create_interaction: function (page_manager) {
        let name = this._description['interaction']['type'];
        let Interaction = imports.components.interactions[name];
        return Interaction.create_me({
            page_manager: page_manager,
        });
    },

    create_module: function (page_name, name) {
        let Module = imports.components.modules[name];
        let props = {};

        // Better way to specify that some modules need input from the app.json?
        if (name === 'app_banner')
            props['app_logo_resource'] =
                this._description['titleImageURI'].slice('resource://'.length);

        return Module.create_me(props);
    },

    create_modules: function (page_name) {
        let retval = {};
        let modules_description = this._description['pages'][page_name]['modules'];
        Object.keys(modules_description).forEach((name) => {
            retval[name] = this.create_module(page_name, name);
        });
        return retval;
    },

    create_page: function (name) {
        let Template = imports.components.templates[this._description['pages'][name]['template']['type']];
        return Template.create_me();
    },

    create_pages: function () {
        let retval = {};
        Object.keys(this._description['pages']).forEach((name) => {
            retval[name] = this.create_page(name);
        });
        return retval;
    },
});
