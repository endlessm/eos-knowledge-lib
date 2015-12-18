const Gtk = imports.gi.Gtk;

const ImageCoverFrame = imports.app.widgets.imageCoverFrame;

Gtk.init(null);

describe('Image Cover Frame', function () {
    let frame;
    beforeEach(function () {
        frame = new ImageCoverFrame.ImageCoverFrame();
    });

    it('can be constructed', function () {});
});
