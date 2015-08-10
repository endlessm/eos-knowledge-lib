const Endless = imports.gi.Endless;
const Gdk = imports.gi.Gdk;
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
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'model': GObject.ParamSpec.override('model', Card.Card),
        'page-number': GObject.ParamSpec.override('page-number', Card.Card),
        'title-capitalization': GObject.ParamSpec.override('title-capitalization',
            Card.Card),
    },

    Template: 'resource:///com/endlessm/knowledge/widgets/mediaCard.ui',
    InternalChildren: [ 'caption-label', 'attribution-label', 'grid',
        'attribution-button', 'separator' ],

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
        this._previewer = new Previewer.Previewer({
            visible: true,
        });
        this._previewer.set_content(this.model.get_content_stream(),
                                   this.model.content_type);
        this._grid.insert_row(0);
        this._grid.attach(this._previewer, 0, 0, 1, 1);

        this.set_label_or_hide(this._caption_label,
                               this.model.caption.split('\n').join(' '));

        this.license_uri = '';
        let attributions = [];
        this._attribution_button.sensitive = false;
        if (this.model.license) {
            let license_display_name = Endless.get_license_display_name(this.model.license);
            if (license_display_name) {
                attributions.push(license_display_name);
                let license_file = Endless.get_license_file(this.model.license);
                if (license_file !== null) {
                    this.license_uri = license_file.get_uri();
                    this._attribution_button.sensitive = true;
                }
            }
        }
        if (this.model.copyright_holder)
            attributions.push(this.model.copyright_holder);
        this.set_label_or_hide(this._attribution_label, attributions.map((s) => {
            return s.split('\n')[0];
        }).join(' - ').toUpperCase());
        this._attribution_button.visible = this._attribution_label.visible;
        this._attribution_button.connect('clicked', this._show_license_in_external_viewer.bind(this));

        this._separator.visible = this._attribution_label.visible &&
                                  this._caption_label.visible;
    },

    vfunc_get_preferred_width: function () {
        let padding = this.get_style_context().get_padding(this.get_state_flags());
        return this._previewer.get_preferred_width().map((v) =>
            Math.max(this._MIN_WIDTH, v) + padding.right + padding.left);
    },

    _show_license_in_external_viewer: function () {
        if (this.license_uri !== '')
            Gtk.show_uri(null, this.license_uri, Gdk.CURRENT_TIME);
    },
});
