const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Utils = imports.app.utils;
const Card = imports.app.interfaces.card;
const Module = imports.app.interfaces.module;
const Previewer = imports.app.previewer;

/**
 * Class: MediaCard
 *
 * A card which display an image along with a caption and attribution text, best
 * used with a MediaObject Model.
 */
const MediaCard = new Lang.Class({
    Name: 'MediaCard',
    GTypeName: 'EknMediaCard',
    Extends: Gtk.Frame,
    Implements: [ Module.Module, Card.Card ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'model': GObject.ParamSpec.override('model', Card.Card),
        'page-number': GObject.ParamSpec.override('page-number', Card.Card),
        'title-capitalization': GObject.ParamSpec.override('title-capitalization',
            Card.Card),
    },

    Template: 'resource:///com/endlessm/knowledge/widgets/mediaCard.ui',
    Children: [ 'caption-label', 'attribution-label' ],
    InternalChildren: [ 'grid', 'attribution-button', 'separator' ],

    _MIN_WIDTH: 200,
    _css_has_loaded: false,

    _init: function (props={}) {
        this.parent(props);

        if (!this._css_has_loaded) {
            let css = Gio.File.new_for_uri('resource:///com/endlessm/knowledge/css/mediaCard.css');
            Utils.add_css_provider_from_file(css, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
            this._css_has_loaded = true;
        }

        // We can't make gjs types through templates right now, so previewer
        // must be constructed in code
        this.previewer = new Previewer.Previewer({
            visible: true,
        });
        this._grid.insert_row(0);
        this._grid.attach(this.previewer, 0, 0, 1, 1);

        this.populate_from_model();

        this._attribution_button.visible = this.attribution_label.visible;
        this._separator.visible = this.attribution_label.visible &&
                                  this.caption_label.visible;
    },

    vfunc_get_preferred_width: function () {
        let padding = this.get_style_context().get_padding(this.get_state_flags());
        return this.previewer.get_preferred_width().map((v) =>
            Math.max(this._MIN_WIDTH, v) + padding.right + padding.left);
    },
});
