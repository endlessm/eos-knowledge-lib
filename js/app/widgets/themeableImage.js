/* exported ThemeableImage */

const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const GObject = imports.gi.GObject;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;

const Knowledge = imports.app.knowledge;

const ThemeableImage = new Knowledge.Class({
    Name: 'ThemeableImage',
    Extends: Gtk.Widget,

    _init: function (props={}) {
        this.parent(props);
        this.get_style_context().add_class(Gtk.STYLE_CLASS_IMAGE);
        this.set_has_window(false);
        this._min_width = 0;
        this._min_height = 0;

        let provider = new Gtk.CssProvider();
        provider.load_from_data('* { -gtk-icon-source: none; }');
        this.get_style_context().add_provider(provider,  Gtk.STYLE_PROVIDER_PRIORITY_FALLBACK);

        this.connect('style-set', () => this._update_custom_style());
        this.connect('style-updated', () => this._update_custom_style());
    },

    _update_custom_style: function () {
        let min_width = EosKnowledgePrivate.style_context_get_int(this.get_style_context(),
                                                                  'min-width'
                                                                  this.get_state_flags());
        let min_height = EosKnowledgePrivate.style_context_get_int(this.get_style_context(),
                                                                   'min-height',
                                                                   this.get_state_flags());
        if (min_width !== this._min_width || min_height !== this._min_height)
            this.queue_resize();
        this._min_width = min_width;
        this._min_height = min_height;
    },

    _get_margin: function () {
        return this.get_style_context().get_margin(this.get_state_flags());
    },

    _get_border: function () {
        return this.get_style_context().get_border(this.get_state_flags());
    },

    _get_padding: function () {
        return this.get_style_context().get_padding(this.get_state_flags());
    },

    vfunc_get_request_mode: function () {
        return Gtk.SizeRequestMode.CONSTANT_SIZE;
    },

    vfunc_get_preferred_width: function () {
        let width = Math.max(this._min_width, this.width_request);
        width = [this._get_margin(), this._get_border(), this._get_padding()].reduce((total, border) => {
            return total + border.left + border.right;
        }, width);
        return [width, width];
    },

    vfunc_get_preferred_height: function () {
        let height = Math.max(this._min_height, this.height_request);
        height = [this._get_margin(), this._get_border(), this._get_padding()].reduce((total, border) => {
            return total + border.top + border.bottom;
        }, height);
        return [height, height];
    },

    vfunc_size_allocate: function (allocation) {
        let margin = this._get_margin();
        allocation.x += margin.left;
        allocation.y += margin.top;
        allocation.width -= margin.left + margin.right;
        allocation.height -= margin.top + margin.bottom;
        this.set_allocation(allocation);
        // FIXME: Clip is not set correctly for this widget as there's no way
        // for out of tree widgets to access box shadow extents. We could carry
        // a patch to fix this in Gtk if the need arises
    },

    vfunc_draw: function (cr) {
        let width = this.get_allocated_width();
        let height = this.get_allocated_height();
        Gtk.render_background(this.get_style_context(), cr,
            0, 0, width, height);
        Gtk.render_frame(this.get_style_context(), cr,
            0, 0, width, height);
        Gtk.render_focus(this.get_style_context(), cr,
            0, 0, width, height);
        let padding = this._get_padding();
        let border = this._get_border();
        Gtk.render_activity(this.get_style_context(), cr,
            padding.left + border.left,
            padding.top + border.top,
            width - padding.left - padding.right - border.left - border.right,
            height - padding.top - padding.bottom - border.top - border.bottom);
        cr.$dispose();
    },
});
