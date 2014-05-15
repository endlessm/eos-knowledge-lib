const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const CssClassMatcher = imports.CssClassMatcher;

const TESTDIR = Endless.getCurrentFileDir() + '/..';

Gtk.init(null);

describe('Previewer widget', function () {
    let previewer;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        previewer = new EosKnowledge.Previewer();
    });

    it('can be constructed', function () {
        expect(previewer).toBeDefined();
    });

    it('can open an image file', function () {
        let fn = function () {
            previewer.file = Gio.File.new_for_path(TESTDIR + '/test-content/pig1.jpg');
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
