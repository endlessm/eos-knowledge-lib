// Copyright (C) 2016 Endless Mobile, Inc.

const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const CssClassMatcher = imports.tests.CssClassMatcher;
const Previewer = imports.app.widgets.previewer;
const StyleClasses = imports.app.styleClasses;
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

    it('can be constructed', function () {
        expect(previewer).toBeDefined();
    });

    it('can open an image file', function () {
        let fn = function () {
            let stream = Gio.File.new_for_path(TEST_CONTENT_DIR + 'joffrey.jpg').read(null);
            previewer.set_content(stream, 'image/jpeg');
        };
        expect(fn).not.toThrow();
    });

    it('can open a gif', function () {
        let fn = function () {
            let stream = Gio.File.new_for_uri('resource://com/endlessm/thrones/dog.gif').read(null);
            previewer.set_content(stream, 'image/gif');
        };
        expect(fn).not.toThrow();
    });

    describe('CSS style context', function () {
        it('has previewer class', function () {
            expect(previewer).toHaveCssClass(StyleClasses.PREVIEWER);
        });
    });
});
