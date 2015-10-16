const Gtk = imports.gi.Gtk;

const ImageCoverFrame = imports.app.widgets.imageCoverFrame;

Gtk.init(null);

describe('Image Cover Frame', function () {
    let frame;
    beforeEach(function () {
        frame = new ImageCoverFrame.ImageCoverFrame();
    });

    it('can be constructed', function () {});

    describe('resizing', function () {
        it('maintains a greater than 1 aspect ratio', function () {
            let new_size = frame.get_scaled_dimensions(1.4, 300, 400)
            expect(new_size).toEqual([560, 400]);

            new_size = frame.get_scaled_dimensions(1.4, 800, 400);
            expect(new_size).toEqual([800, 571]);
        });

        it('maintains a less than 1 aspect ratio', function () {
            let new_size = frame.get_scaled_dimensions(0.3, 300, 400);
            expect(new_size).toEqual([300, 1000]);

            new_size = frame.get_scaled_dimensions(0.3, 800, 400);
            expect(new_size).toEqual([800, 2667]);
        });

        it('maintains an aspect ratio of exactly 1', function () {
            let new_size = frame.get_scaled_dimensions(1, 500, 200);
            expect(new_size).toEqual([500, 500]);
        });

        it('handles edge case where allocation is zero', function () {
            // edge case
            new_size = frame.get_scaled_dimensions(0.5, 0, 0);
            expect(new_size).toEqual([0, 0]);
        });
    });
});
