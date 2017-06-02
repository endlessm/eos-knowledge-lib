const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const CssClassMatcher = imports.tests.CssClassMatcher;
const Previewer = imports.app.widgets.previewer;
const Utils = imports.tests.utils;

const TEST_CONTENT_DIR = Utils.get_test_content_srcdir();
const TEST_CONTENT_BUILDDIR = Utils.get_test_content_builddir();

Gtk.init(null);

describe('Previewer widget', function () {
    let previewer;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        let resource = Gio.Resource.load(TEST_CONTENT_BUILDDIR + 'test-content.gresource');
        resource._register();

        previewer = new Previewer.Previewer();
    });

    it('can open an image file', function () {
        let fn = function () {
            previewer.set_uri('file://' + TEST_CONTENT_DIR + 'joffrey.jpg', 'image/jpeg');
        };
        expect(fn).not.toThrow();
    });

    it('can open a gif', function () {
        let fn = function () {
            previewer.set_uri('resource://com/endlessm/thrones/dog.gif', 'image/gif');
        };
        expect(fn).not.toThrow();
    });

    describe('CSS style context', function () {
        it('has previewer class', function () {
            expect(previewer).toHaveCssClass('previewer');
        });
    });
});
