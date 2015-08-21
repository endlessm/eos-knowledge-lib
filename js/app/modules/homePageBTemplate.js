const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const HomePage = imports.app.homePage;
const Module = imports.app.interfaces.module;
const StyleClasses = imports.app.styleClasses;

/**
 * Class: HomePageBTemplate
 *
 * A Home Page Template used for Template B apps.
 *
 * CSS Styles:
 *      home-page-b-template - on the template
 *      
 */
const HomePageBTemplate = new Lang.Class({
    Name: 'HomePageBTemplate',
    GTypeName: 'EknHomePageBTemplate',
    Extends: Gtk.Grid,
    Implements: [ Module.Module, HomePage.HomePage ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'search-box': GObject.ParamSpec.override('search-box',
            HomePage.HomePage),
    },

    Template: 'resource:///com/endlessm/knowledge/widgets/homePageBTemplate.ui',

    _packing_args: {
        'top_left': [0, 0, 1, 1],
        'top_right': [1, 0, 1, 1],
        'bottom': [0, 1, 2, 2],
    },

    _init: function (props={}) {
        this._cards = null;
        this.parent(props);
        this.get_slot_names().forEach(this.pack_module_for_slot, this);

        // FIXME: we should be able to get the search box out of the factory,
        // rather than reaching into our internal structure
        this.search_box = this._top_right;

        // FIXME: this should be replaced by the dispatcher
        this.connect_signals();

        this.get_style_context().add_class(StyleClasses.HOME_PAGE);
    },

    get_slot_names: function () {
        return [ 'top_left', 'top_right', 'bottom' ];
    },

    pack_module_for_slot: function(slot) {
        this['_' + slot] = this.create_submodule(slot);
        this.attach.bind(this, this['_' + slot]).apply(this, this._packing_args[slot]);
    },
});
