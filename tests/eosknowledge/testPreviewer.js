const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;

const CssClassMatcher = imports.CssClassMatcher;

const TESTDIR = Endless.getCurrentFileDir() + '/..';
// Working directory should be top of the builddir
const TESTBUILDDIR = GLib.get_current_dir() + '/tests';

describe('Previewer widget', function () {
    let previewer;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        let resource = Gio.Resource.load(TESTBUILDDIR + '/test-content/test-content.gresource');
        resource._register();

        previewer = new EosKnowledge.Previewer();
    });

    it('can be constructed', function () {
        expect(previewer).toBeDefined();
    });

    it('can open an image file', function () {
        let fn = function () {
            previewer.file = Gio.File.new_for_path(TESTDIR + '/test-content/joffrey.jpg');
        };
        expect(fn).not.toThrow();
    });

    it('can open an image file from a resource', function () {
        let fn = function () {
            previewer.file = Gio.File.new_for_uri('resource://com/endlessm/thrones/joffrey.jpg');
        };
        expect(fn).not.toThrow();
    });

    it('can open a video file', function () {
        let fn = function () {
            previewer.file = Gio.File.new_for_path(TESTDIR + '/test-content/sample.mp4');
        };
        expect(fn).not.toThrow();
    });

    it('can open a video file from a resource', function () {
        let fn = function () {
            previewer.file = Gio.File.new_for_uri('resource://com/endlessm/thrones/sample.mp4');
        };
        expect(fn).not.toThrow();
    });

    it('cannot open a directory', function () {
        let fn = function () {
            previewer.file = Gio.File.new_for_path(TESTDIR);
        };
        expect(fn).toThrow();
    });

    describe('CSS style context', function () {
        it('has previewer class', function () {
            expect(previewer).toHaveCssClass(EosKnowledge.STYLE_CLASS_PREVIEWER);
        });
    });
});
