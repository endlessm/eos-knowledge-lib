const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Builder = imports.builder;

const AppBanner = new Lang.Class({
    Name: 'AppBanner',
    Extends: Gtk.Frame,
    Properties: {
        'app-logo-resource': GObject.ParamSpec.string('app-logo-resource',
            'App logo resource', 'Resource path to the app logo',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            ''),
    },
    Template: 'resource:///com/endlessm/test/data/app_banner.ui.xml',
    InternalChildren: [ 'logo' ],

    _init: function (props) {
        this.parent(props);
        this.init_template();
        this.add(this._logo);
        this.bind_property('app-logo-resource', this._logo, 'resource',
            GObject.BindingFlags.SYNC_CREATE);
    },
});
Builder.bind_template(AppBanner.prototype);

function create_me(props) {
    return new AppBanner(props);
}
