const Cairo = imports.gi.cairo;  // note GI module, not native module
const EosKnowledge = imports.gi.EosKnowledge;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const TEST_WINDOW_SIZE = 300;

// Colored box with a fixed size request of a particular size.
const IncompressibleBox = new Lang.Class({
    Name: 'IncompressibleBox',
    Extends: Gtk.Frame,
    _init: function (width, height, props={}) {
        if (!props.hasOwnProperty('valign'))
            props['valign'] = Gtk.Align.START;
        this.parent(props);
        this.width = width;
        this.height = height;
    },

    vfunc_get_preferred_width: function () {
        return [this.width, this.width];
    },

    vfunc_get_preferred_height: function () {
        return [this.height, this.height];
    }
});

// Colored box with a natural request of a particular size. It can be compressed
// by up to half of its natural request in either direction.
const CompressibleBox = new Lang.Class({
    Name: 'CompressibleBox',
    Extends: IncompressibleBox,

    vfunc_get_preferred_width: function () {
        let [min, nat] = this.parent();
        return [nat / 2, nat];
    },

    vfunc_get_preferred_height: function () {
        let [min, nat] = this.parent();
        return [nat / 2, nat];
    },
});

describe('Space container', function () {
    let container, win;

    beforeEach(function () {
        win = new Gtk.OffscreenWindow();
        container = new EosKnowledge.SpaceContainer();
        win.set_size_request(-1, TEST_WINDOW_SIZE);
        win.add(container);
        win.show_all();
    });

    afterEach(function () {
        win.destroy();
    });

    it('constructs', function () {});

    function add_box(box) {
        box.show_all();
        container.add(box);
        return box;
    }

    function update_gui() {
        while (Gtk.events_pending())
            Gtk.main_iteration(false);
    }

    // NOTE: These tests use get_child_visible() to test whether the container
    // determined there was enough space to show the child. That is an
    // implementation detail, unfortunately.

    it('gives a single child its natural request if there is enough space', function () {
        let box = add_box(new IncompressibleBox(100, 100));
        update_gui();

        expect(box.get_allocation().height).toBe(100);
        expect(box.get_child_visible()).toBe(true);
    });

    it('gives a single child as much space as it can', function () {
        let box = add_box(new CompressibleBox(100, 400));
        update_gui();

        expect(box.get_allocation().height).toBe(TEST_WINDOW_SIZE);
        expect(box.get_child_visible()).toBe(true);
    });

    // Pending, because there is currently no way to stop a Gtk.OffscreenWindow
    // from growing bigger due to its minimal size request.
    xit('shows no children if there is not enough space for a single child', function () {
        let box = add_box(new IncompressibleBox(100, 800));
        update_gui();

        expect(box.get_child_visible()).toBe(false);
    });

    it('shows only as many children as will fit', function () {
        let boxes = [200, 200].map((height) => add_box(new IncompressibleBox(100, height)));
        update_gui();

        expect(boxes[0].get_child_visible()).toBe(true);
        expect(boxes[1].get_child_visible()).toBe(false);
    });

    it('shares out extra space equally among visible children', function () {
        let boxes = [200, 200].map((height) => add_box(new CompressibleBox(100, height)));
        update_gui();

        expect(boxes[0].get_allocation().height).toBe(150);
        expect(boxes[1].get_allocation().height).toBe(150);
    });

    it('shares out extra space among visible children up to the natural size', function () {
        let boxes = [50, 50].map((height) => add_box(new CompressibleBox(100, height)));
        update_gui();

        expect(boxes[0].get_allocation().height).toBe(50);
        expect(boxes[1].get_allocation().height).toBe(50);
    });

    it('does not share out extra space to invisible children', function () {
        let boxes = [200, 200, 400].map((height) => add_box(new CompressibleBox(100, height)));
        update_gui();

        expect(boxes[0].get_allocation().height).toBe(150);
        expect(boxes[1].get_allocation().height).toBe(150);
        expect(boxes[2].get_child_visible()).toBe(false);
    });

    it('shares out extra space beyond the natural size to expandable visible children', function () {
        let boxes = [50, 50].map((height) => add_box(new CompressibleBox(100, height)));
        boxes[0].expand = true;
        boxes[0].valign = Gtk.Align.FILL;
        update_gui();

        expect(boxes[0].get_allocation().height).toBe(250);
        expect(boxes[1].get_allocation().height).toBe(50);
    });

    it('requests width equal to the maximum of its children', function () {
        add_box(new CompressibleBox(50, 50));
        add_box(new CompressibleBox(150, 150));
        add_box(new IncompressibleBox(100));

        let [minimum, natural] = container.get_preferred_width();
        expect(minimum).toBe(100);
        expect(natural).toBe(150);
    });

    it('requests minimum height equal to the minimum of its first child', function () {
        [50, 100, 150].forEach((size) => add_box(new CompressibleBox(size, size)));

        let [minimum, natural] = container.get_preferred_height();
        expect(minimum).toBe(25);
    });

    it('requests natural height equal to the sum of its children', function () {
        [50, 100, 150, 100].forEach((size) => add_box(new CompressibleBox(size, size)));

        let [minimum, natural] = container.get_preferred_height();
        expect(natural).toBe(400);
    });

    it('does not allocate space to invisible children', function () {
        let boxes = [150, 150, 150].map((size) => add_box(new IncompressibleBox(size, size)));
        boxes[1].hide();
        boxes.forEach((box) => spyOn(box, 'size_allocate'));
        update_gui();

        expect(boxes[0].get_child_visible()).toBe(true);
        expect(boxes[2].get_child_visible()).toBe(true);
        expect(boxes[1].size_allocate).not.toHaveBeenCalled();
    });

    it('does not show children past the first non-fitting one, even if it fits', function () {
        let boxes = [200, 300, 50].map((size) => add_box(new IncompressibleBox(size, size)));
        update_gui();

        expect(boxes[2].get_child_visible()).toBe(false);
    });
});
