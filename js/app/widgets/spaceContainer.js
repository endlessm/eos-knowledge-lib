const Endless = imports.gi.Endless;
const Gdk = imports.gi.Gdk;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Knowledge = imports.app.knowledge;
const Utils = imports.app.utils;

/**
 * Class: SpaceContainer
 * Container that shows only as many widgets as it has space for
 *
 * Usually a container will try to display all the widgets that have been added
 * to it.
 * You can add as many widgets as you want to *SpaceContainer*, but it will only
 * show as many as it has space for.
 * If you resize your window so that there is space for more widgets, they will
 * appear.
 *
 * Parent class:
 *   *Endless.CustomContainer*
 */
const SpaceContainer = new Knowledge.Class({
    Name: 'SpaceContainer',
    Extends: Endless.CustomContainer,
    Implements: [Gtk.Orientable],
    Properties: {
        /**
         * Property: spacing
         * The amount of space between children
         *
         * Default:
         *   0
         */
        'spacing': GObject.ParamSpec.uint('spacing', 'Spacing',
            'The amount of space between children',
            GObject.ParamFlags.READWRITE,
            0, GLib.MAXUINT16, 0),
        /**
         * Property: all-visible
         * Whether all children are visible or some were cut off
         *
         * Flags:
         *   read-only
         */
        'all-visible': GObject.ParamSpec.boolean('all-visible', 'All visible',
            'All children visible',
            GObject.ParamFlags.READABLE,
            true),
    },

    _init: function (props={}) {
        this._all_fit = true;
        this._spacing = 0;
        this._children = [];
        this._orientation = Gtk.Orientation.HORIZONTAL;
        this.parent(props);
    },

    get orientation() {
        return this._orientation;
    },

    set orientation(value) {
        if (this._orientation === value)
            return;
        this._orientation = value;
        this.notify('orientation');
        this.queue_resize();
    },

    get spacing() {
        return this._spacing;
    },

    set spacing(value) {
        if (this._spacing === value)
            return;
        this._spacing = value;
        this.notify('spacing');
        this.queue_resize();
    },

    get all_visible() {
        return this._all_fit;
    },

    add: function (child) {
        Gtk.Container.prototype.add.call(this, child);
        this._children.push(child);
    },

    remove: function (child) {
        Gtk.Container.prototype.remove.call(this, child);
        let index_to_remove = this._children.indexOf(child);
        if (index_to_remove === -1)
            throw new Error('Widget not found');
        this._children.splice(index_to_remove, 1);
    },

    insert: function (child, position) {
        Gtk.Container.prototype.add.call(this, child);
        this._children.splice(position, 0, child);
    },

    _get_visible_children: function () {
        return this._children.filter((child) => child.visible);
    },

    _get_css_box_sizes: function () {
        let context = this.get_style_context();
        let flags = this.get_state_flags();

        context.save();
        context.set_state(flags);
        let margin = context.get_margin(flags);
        let border = context.get_border(flags);
        let padding = context.get_padding(flags);
        context.restore();

        return [margin, border, padding];
    },

    _get_css_box_size_for_dimension: function (dimension) {
        if (dimension === 'height') {
            return this._get_css_box_sizes().reduce((total, border) => {
                return total + border.top + border.bottom;
            }, 0);
        }
        return this._get_css_box_sizes().reduce((total, border) => {
            return total + border.left + border.right;
        }, 0);
    },

    // The secondary dimension (i.e., width if orientation == VERTICAL) is the
    // maximum minimal and natural secondary dimensions of any one child, even
    // including ones that are not shown.
    _get_preferred_secondary: function (secondary, space) {
        let extra = this._get_css_box_size_for_dimension(secondary);
        if (this._children.length === 0)
            return [extra, extra];
        let [min, nat] = this._children.reduce((accum, child) => {
            let [min, nat] = accum;
            let [child_min, child_nat] = this._child_get_preferred_size(child, secondary, space);
            return [Math.max(child_min, min), Math.max(child_nat, nat)];
        }, [0, 0]);
        return [min + extra, nat + extra];
    },

    // The primary dimension is height if orientation == VERTICAL, for example.
    // Preferred minimal primary dimension is the minimal primary dimension of
    // the first child, since the widget can shrink down to one child; preferred
    // natural primary dimension is the combined natural primary dimension of
    // all children, since given enough space we would display all of them.
    _get_preferred_primary: function (primary, space) {
        let extra = this._get_css_box_size_for_dimension(primary);
        let children = this._get_visible_children();
        if (children.length === 0)
            return [extra, extra];
        let [min, nat] = this._child_get_preferred_size(children[0], primary, space);
        nat += children.slice(1).reduce((accum, child) => {
            let [child_min, child_nat] = this._child_get_preferred_size(child, primary, space);
            return accum + child_nat + this._spacing;
        }, 0);
        return [min + extra, nat + extra];
    },

    _child_get_preferred_size: function (child, dimension, orthogonal_space) {
        if (child.get_request_mode() === Gtk.SizeRequestMode.HEIGHT_FOR_WIDTH &&
            dimension === 'height' && orthogonal_space > -1) {
            return child.get_preferred_height_for_width(orthogonal_space);
        }
        if (child.get_request_mode() === Gtk.SizeRequestMode.WIDTH_FOR_HEIGHT &&
            dimension === 'width' && orthogonal_space > -1) {
            return child.get_preferred_width_for_height(orthogonal_space);
        }
        return child['get_preferred_' + dimension]();
    },

    _get_shown_children_info: function (children, primary, available_space, secondary_space) {
        let cum_min_size = 0;
        let shown_children_info = [];
        let ran_out_of_space = false;
        // Determine how many children will fit in the available space.
        children.forEach((child, ix) => {
            let [child_min, child_nat] =
                this._child_get_preferred_size(child, primary, secondary_space);
            cum_min_size += child_min;
            if (ix > 0)
                cum_min_size += this._spacing;
            if (!ran_out_of_space && cum_min_size <= available_space) {
                shown_children_info.push({
                    minimum: child_min,
                    natural: child_nat,
                    child: child,
                });
                child.set_child_visible(true);
            } else {
                child.set_child_visible(false);
                // If #3 won't fit, then #4 shouldn't be shown even if it fits.
                ran_out_of_space = true;
            }
        });
        if (ran_out_of_space === this._all_fit) {
            this._all_fit = !ran_out_of_space;
            this.notify('all-visible');
        }
        return shown_children_info;
    },

    _allocate_primary_space: function (shown_children_info, available_space) {
        // Start by giving each visible child its minimum height.
        let allocated_sizes = shown_children_info.map((info) => info.minimum);
        let extra_space = available_space -
            (shown_children_info.length - 1) * this._spacing -
            _sum(allocated_sizes);

        // If there is extra space, give each visible child more height up to
        // its natural height.
        if (extra_space > 0) {
            let requested_diff = allocated_sizes.map((size, ix) =>
                shown_children_info[ix].natural - size);
            let space_for_all_naturals = _sum(requested_diff);
            // If possible, give every child its natural height, otherwise give
            // each child a fair proportion of its natural height.
            let proportion = (space_for_all_naturals <= extra_space) ? 1.0 :
                extra_space / space_for_all_naturals;
            requested_diff.forEach((diff, ix) => {
                let adjustment = Math.round(diff * proportion);
                allocated_sizes[ix] += adjustment;
                extra_space -= adjustment;
            });
        }

        // If there is still extra space, divide it between any widgets that
        // are effectively expanded.
        if (extra_space > 0) {
            let num_expanded = 0;
            let expanded = shown_children_info.map((info) => {
                let expand = info.child.compute_expand(this.orientation);
                if (expand)
                    num_expanded++;
                return expand;
            });
            if (num_expanded > 0) {
                let extra_allotment = Math.round(extra_space / num_expanded);
                expanded.forEach((expand, ix) => {
                    if (expand) {
                        allocated_sizes[ix] += extra_allotment;
                        extra_space -= extra_allotment;
                    }
                });
            }
        }
        // If any extra space after that, just don't use it; pass it back to the
        // caller since they know what side of the widget to pad.

        return [allocated_sizes, extra_space];
    },

    vfunc_get_preferred_width: function () {
        if (this.orientation === Gtk.Orientation.VERTICAL)
            return this._get_preferred_secondary('width', -1);
        return this._get_preferred_primary('width', -1);
    },

    vfunc_get_preferred_width_for_height: function (height) {
        if (this.orientation === Gtk.Orientation.VERTICAL)
            return this._get_preferred_secondary('width', height);
        return this._get_preferred_primary('width', height);
    },

    vfunc_get_preferred_height: function () {
        if (this.orientation === Gtk.Orientation.VERTICAL)
            return this._get_preferred_primary('height', -1);
        return this._get_preferred_secondary('height', -1);
    },

    vfunc_get_preferred_height_for_width: function (width) {
        if (this.orientation === Gtk.Orientation.VERTICAL)
            return this._get_preferred_primary('height', width);
        return this._get_preferred_secondary('height', width);
    },

    _shrink_allocation: function (allocation, border) {
        allocation.x += border.left;
        allocation.y += border.top;
        allocation.width -= border.left + border.right;
        allocation.height -= border.top + border.bottom;
    },

    vfunc_size_allocate: function (allocation) {
        let [margin, border, padding] = this._get_css_box_sizes();
        this._shrink_allocation(allocation, margin);
        this.parent(allocation);
        this._shrink_allocation(allocation, border);
        this._shrink_allocation(allocation, padding);

        let children = this._get_visible_children();
        if (children.length === 0)
            return;

        let primary, secondary, primary_pos, secondary_pos, primary_align;
        if (this.orientation === Gtk.Orientation.VERTICAL) {
            primary = 'height';
            secondary = 'width';
            primary_pos = 'y';
            secondary_pos = 'x';
            primary_align = 'valign';
        } else {
            primary = 'width';
            secondary = 'height';
            primary_pos = 'x';
            secondary_pos = 'y';
            primary_align = 'halign';
        }

        let shown_children_info = this._get_shown_children_info(children,
            primary, allocation[primary], allocation[secondary]);
        if (shown_children_info.length === 0)
            return;  // No widgets fit, nothing to do.

        let [allocated_primary_sizes, extra_space] =
            this._allocate_primary_space(shown_children_info, allocation[primary]);

        // Calculate the positions of the widgets, taking into account the
        // spacing; one widget begins where the previous widget ends, plus the
        // spacing.
        let cum_primary_sizes = _cumsum(allocated_primary_sizes.map((size) =>
            size + this._spacing));
        let cum_rel_positions = cum_primary_sizes.slice();
        cum_rel_positions.unshift(0);

        // Also take into account the primary align property if we received more
        // space than we requested.
        let pad_start = 0;
        if (extra_space > 0) {
            switch (this[primary_align]) {
            case Gtk.Align.END:
                pad_start = extra_space;
                break;
            case Gtk.Align.CENTER:
            case Gtk.Align.FILL:
                pad_start = Math.round(extra_space / 2);
            }
        }

        shown_children_info.forEach((info, ix) => {
            let props = {};
            props[primary] = allocated_primary_sizes[ix];
            props[secondary] = allocation[secondary];
            props[primary_pos] = allocation[primary_pos] + pad_start + cum_rel_positions[ix];
            props[secondary_pos] = allocation[secondary_pos];
            let rect = new Gdk.Rectangle(props);
            info.child.size_allocate(rect);
        });
    },

    vfunc_draw: Utils.vfunc_draw_background_default,
});

function _sum(array) {
    return array.reduce((total, val) => total + val, 0);
}

function _cumsum(array) {
    let retval = [];
    array.reduce((total, val, ix) => {
        total += val;
        retval[ix] = total;
        return total;
    }, 0);
    return retval;
}
