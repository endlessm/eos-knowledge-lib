const Cairo = imports.gi.cairo;  // note GI module, not native module
const Endless = imports.gi.Endless;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

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
const SpaceContainer = new Lang.Class({
    Name: 'SpaceContainer',
    GTypeName: 'EknSpaceContainer',
    Extends: Endless.CustomContainer,

    _init: function (props={}) {
        props.vexpand = true;
        this.parent(props);
    },

    _get_visible_children: function () {
        // Reverse the children because CustomContainer prepends children to its list.
        return this.get_children().reverse().filter((child) => child.visible);
    },

    // Widths are the maximum minimal and natural widths of any one child, even
    // including ones that are not shown.
    vfunc_get_preferred_width: function () {
        let children = this.get_children();
        if (children.length === 0)
            return [0, 0];
        return children.reduce((accum, child) => {
            let [min, nat] = accum;
            let [child_min, child_nat] = child.get_preferred_width();
            return [Math.max(child_min, min), Math.max(child_nat, nat)];
        }, [0, 0]);
    },

    // Preferred minimal height is the minimal height of the first child, since
    // the widget can shrink down to one child; preferred natural height is the
    // combined natural height of all children, since given enough space we
    // would display all of them.
    vfunc_get_preferred_height: function () {
        let children = this._get_visible_children();
        if (children.length === 0)
            return [0, 0];
        let [min, nat] = children[0].get_preferred_height();
        nat += children.slice(1).reduce((accum, child) => {
            let [child_min, child_nat] = child.get_preferred_height();
            return accum + child_nat;
        }, 0);
        return [min, nat];
    },

    vfunc_size_allocate: function (allocation) {
        let children = this._get_visible_children();
        if (children.length === 0)
            return;

        let cum_min_height = 0;
        let shown_children_info = [];
        let ran_out_of_space = false;
        // Determine how many children will fit in the available space.
        children.forEach((child) => {
            let [child_min, child_nat] = child.get_preferred_height();
            cum_min_height += child_min;
            if (!ran_out_of_space && cum_min_height <= allocation.height) {
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
        if (shown_children_info.length === 0)
            return;  // No widgets fit, nothing to do.

        // Start by giving each visible child its minimum height.
        let allocated_heights = shown_children_info.map((info) => info.minimum);
        let extra_space = allocation.height - _sum(allocated_heights);

        // If there is extra space, give each visible child more height up to
        // its natural height.
        if (extra_space > 0) {
            let requested_diff = allocated_heights.map((height, ix) => shown_children_info[ix].natural - height);
            let space_for_all_naturals = _sum(requested_diff);
            // If possible, give every child its natural height, otherwise give
            // each child a fair proportion of its natural height.
            let proportion = (space_for_all_naturals <= extra_space) ? 1.0 :
                extra_space / space_for_all_naturals;
            requested_diff.forEach((diff, ix) => {
                let adjustment = Math.round(diff * proportion);
                allocated_heights[ix] += adjustment;
                extra_space -= adjustment;
            });
        }

        // If there is still extra space, divide it between any widgets that
        // are effectively expanded.
        if (extra_space > 0) {
            let num_expanded = 0;
            let expanded = shown_children_info.map((info) => {
                let expand = info.child.compute_expand(Gtk.Orientation.VERTICAL);
                if (expand)
                    num_expanded++;
                return expand;
            });
            if (num_expanded > 0) {
                let extra_allotment = Math.round(extra_space / num_expanded);
                expanded.forEach((expand, ix) => {
                    if (expand) {
                        allocated_heights[ix] += extra_allotment;
                        extra_space -= extra_allotment;
                    }
                });
            }
        }
        // If any extra space after that, just don't use it.

        let cum_heights = _cumsum(allocated_heights);
        let cum_rel_ys = cum_heights.slice();
        cum_rel_ys.unshift(0);
        shown_children_info.forEach((info, ix) => {
            let rect = new Cairo.RectangleInt({
                x: allocation.x,
                y: allocation.y + cum_rel_ys[ix],
                width: allocation.width,
                height: allocated_heights[ix],
            });
            info.child.size_allocate(rect);
        });

        this.set_allocation(allocation);
    },
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
