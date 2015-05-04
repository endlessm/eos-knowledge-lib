const Endless = imports.gi.Endless;
const Gettext = imports.gettext;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Config = imports.app.config;

const ASSETS_PATH = '/com/endlessm/knowledge/assets/';
const LOGO_FILE = 'logo.png';

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

// These should come from SDK at some point
const PopupWindow = imports.app.encyclopedia.popupWindow;
const DisclaimerIcon = imports.app.encyclopedia.disclaimerIcon;

const EncyclopediaLayoutPage = new Lang.Class({
    Name: 'EncyclopediaLayoutPage',
    Extends: Gtk.Overlay,

    SEARCH_BOX_PLACEHOLDER_TEXT: _("Search the world's information!"),

    Properties: {
        'search-box': GObject.ParamSpec.object('search-box', 'Search Box',
            'The seach box for this view.',
            GObject.ParamFlags.READABLE,
            Endless.SearchBox)
    },

    _init: function(props) {
        this._logo_resource = this._getLocalizedResource(ASSETS_PATH,
                                                         LOGO_FILE);

        this._disclaimer_icon = new DisclaimerIcon.DisclaimerIcon({});

        this._disclaimer_icon.connect('clicked',
                                      this._disclaimer_clicked.bind(this));

        this.parent(props);
    },

    _getLocalizedResource: function(resource_path, filename) {
        let languages = GLib.get_language_names();
        let directories = Gio.
                          resources_enumerate_children(resource_path,
                                                       Gio.ResourceLookupFlags.
                                                       NONE);
        let location = '';
        // Finds the resource appropriate for the current langauge
        // If can't find language, will return file in C/
        for (let i = 0; i < languages.length; i++) {
            let lang_code = languages[i] + '/';
            if (directories.indexOf(lang_code) !== -1) {
                location = resource_path + lang_code + filename;
                break;
            }
        }
        return location;
    },

    _disclaimer_clicked: function() {
        let popupWindow = new PopupWindow.PopupWindow();
        this.add_overlay(popupWindow);
        popupWindow.connect('close-me', function () {
            this.remove(popupWindow);
        }.bind(this));
        popupWindow.show_all();
    }
});
