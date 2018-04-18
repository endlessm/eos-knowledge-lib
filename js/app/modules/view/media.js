const Endless = imports.gi.Endless;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const Module = imports.app.interfaces.module;
const Previewer = imports.app.widgets.previewer;
const Utils = imports.app.utils;
const {View} = imports.app.interfaces.view;

/**
 * Class: Media
 *
 * A card which display an image along with a caption and attribution text, best
 * used with a MediaObject Model.
 */
var Media = new Module.Class({
    Name: 'View.Media',
    Extends: Gtk.Frame,
    Implements: [View],

    Template: 'resource:///com/endlessm/knowledge/data/widgets/view/media.ui',
    InternalChildren: [ 'caption-label', 'attribution-label', 'grid',
        'attribution-button'],

    _MIN_WIDTH: 200,

    _init: function (props={}) {
        this.parent(props);

        // We can't make gjs types through templates right now, so previewer
        // must be constructed in code
        this._previewer = new Previewer.Previewer({
            visible: true,
        });

        this._previewer.set_uri(this.model.id, this.model.content_type);
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
        }).join(' - '));
        this._attribution_button.visible = this._attribution_label.visible;
        this._attribution_button.connect('clicked', this._show_license_in_external_viewer.bind(this));
        /* When both the caption & attribution are present in the lightbox,
           add these classes so their spacing can be designed correctly. */
        if (this._caption_label.visible) {
            this.get_style_context().add_class(Utils.get_modifier_style_class(this.constructor, 'withCaption'));
        }
        if (this._attribution_label.visible) {
            this.get_style_context().add_class(Utils.get_modifier_style_class(this.constructor, 'withAttribution'));
        }
    },

    dropped: function () {
        this._previewer.set_uri(null);
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
