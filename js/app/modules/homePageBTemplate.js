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
    },

    Template: 'resource:///com/endlessm/knowledge/widgets/homePageBTemplate.ui',

    _init: function (props={}) {
        this._cards = null;
        this.parent(props);

        const PACKING_ARGS = {
            'top_left': [0, 0, 1, 1],
            'top_right': [1, 0, 1, 1],
            'bottom': [0, 1, 2, 2],
        };
        this.get_slot_names().forEach((slot) => {
            let submodule = this.create_submodule(slot);
            this.attach.bind(this, submodule).apply(this, PACKING_ARGS[slot]);
            this['_' + slot] = submodule;
        });

        this.get_style_context().add_class(StyleClasses.HOME_PAGE);
    },

    get_slot_names: function () {
        return [ 'top_left', 'top_right', 'bottom' ];
    },
});
