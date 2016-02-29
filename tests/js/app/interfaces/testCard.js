// Copyright 2015 Endless Mobile, Inc.

const Lang = imports.lang;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Mainloop = imports.mainloop;

const Utils = imports.tests.utils;
Utils.register_gresource();

const ArticleObjectModel = imports.search.articleObjectModel;
const CssClassMatcher = imports.tests.CssClassMatcher;
const MediaObjectModel = imports.search.mediaObjectModel;
const Minimal = imports.tests.minimal;
const MockEngine = imports.tests.mockEngine;
const SetMap = imports.app.setMap;
const SetObjectModel = imports.search.setObjectModel;
const StyleClasses = imports.app.styleClasses;

Gtk.init(null);

describe('Card interface', function () {
    let card, model;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        let data = [
            {
                ekn_id: '1',
                title: 'Foo',
                child_tags: ['foo'],
            },
            {
                ekn_id: '2',
                title: 'Bar',
                child_tags: ['bar'],
            },
        ];
        let sets = data.map((obj) => new SetObjectModel.SetObjectModel(obj));
        SetMap.init_map_with_models(sets);
        model = new ArticleObjectModel.ArticleObjectModel({
            title: 'record title &',
            thumbnail_uri: 'ekn://foo/bar',
            authors: ['record author &'],
            article_number: 0,
            tags: ['foo', 'bar'],
        });
        card = new Minimal.MinimalCard({
            model: model,
        });
    });

    it('adds the "invisible" and "fade-in" style classes while fading', function (done) {
        card.FADE_IN_TIME_MS = 20;
        card.fade_in();
        expect(card).toHaveCssClass(StyleClasses.INVISIBLE);
        expect(card).toHaveCssClass(StyleClasses.FADE_IN);
        Utils.update_gui();
        Mainloop.timeout_add(25, () => {
            expect(card).not.toHaveCssClass(StyleClasses.INVISIBLE);
            expect(card).not.toHaveCssClass(StyleClasses.FADE_IN);
            done();
            return GLib.SOURCE_REMOVE;
        });
    });

    it('is insensitive while fading', function (done) {
        card.FADE_IN_TIME_MS = 20;
        card.fade_in();
        expect(card.sensitive).toBeFalsy();
        Utils.update_gui();
        Mainloop.timeout_add(25, () => {
            expect(card.sensitive).toBeTruthy();
            done();
            return GLib.SOURCE_REMOVE;
        });
    });

    it('sets a title label visible if model has a title', function () {
        let label = new Gtk.Label();
        card.set_title_label_from_model(label);
        expect(label.visible).toBeTruthy();
    });

    it('sets a context label visible if model has tags', function () {
        let grid = new Gtk.Grid();
        card.set_context_label_from_model(grid);
        let first_tag = Gtk.test_find_label(grid, 'Foo');
        expect(first_tag).not.toBeNull();
        let second_tag = Gtk.test_find_label(grid, ' | Bar');
        expect(second_tag).not.toBeNull();
    });

    it('markup-escapes the title', function () {
        let label = new Gtk.Label();
        card.set_title_label_from_model(label);
        expect(label.label).toContain('&amp;');
    });

    it('sets a author label visible if model has authors', function () {
        let label = new Gtk.Label();
        card.set_author_label_from_model(label);
        expect(label.visible).toBeTruthy();
    });

    it('markup-escapes the authors', function () {
        let label = new Gtk.Label();
        card.set_author_label_from_model(label);
        expect(label.label).toContain('&amp;');
    });

    it('highlights substring in title', function () {
        let css = '.highlighted{background-color:#ff0000;}';
        card = new Minimal.MinimalCard({
            model: model,
            highlight_string: 'title',
        });
        let label = new Gtk.Label();
        label.get_style_context().add_class('highlighted');
        let provider = new Gtk.CssProvider();
        provider.load_from_data(css);
        label.get_style_context().add_provider(provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
        card.set_title_label_with_highlight(label);
        expect(label.label.match(/<span .*bgcolor="#ff0000.*">title<\/span>/)).not.toBeNull();
    });

    it('updates the highlight string', function () {
        card = new Minimal.MinimalCard({ model: model });
        spyOn(card, 'update_highlight_string');
        card.highlight_string = 'title';
        expect(card.update_highlight_string).toHaveBeenCalled();
    });

    it('sets a thumbnail frame visible if model has a thumbnail uri', function () {
        let engine = MockEngine.mock_default();
        engine.get_object_by_id_finish.and.callFake(() =>
            new MediaObjectModel.MediaObjectModel({
                get_content_stream: () => new Gio.MemoryInputStream(),
            }));
        let frame = new Gtk.Frame();
        card.set_thumbnail_frame_from_model(frame);
        expect(frame.visible).toBeTruthy();
    });

    it('adds a style variant if the model has an article number', function () {
        card.set_style_variant_from_model();
        expect(card).toHaveCssClass('variant0');
    });

    it('only has three different style variants', function () {
        card.model.article_number = 5;
        card.set_style_variant_from_model();
        expect(card).toHaveCssClass('variant2');
    });

    describe ('specific sizing classes', function () {
        // These values fall in the middle of the range of dimensions for such class name
        let in_between_class_dimensions = {
            A: 150,
            B: 250,
            C: 350,
            D: 450,
            E: 650,
            F: 850,
            G: 1050,
            H: 1250,
        };

        beforeEach(function () {
            this.win = new Gtk.OffscreenWindow();
        });

        afterEach(function () {
            this.win.destroy();
        });

        Object.keys(StyleClasses.CARD_WIDTH).forEach(width_class => {
            Object.keys(StyleClasses.CARD_HEIGHT).forEach(height_class => {
                let width = in_between_class_dimensions[width_class];
                let height = in_between_class_dimensions[height_class];
                test_style_classes_for_height_and_width(StyleClasses.CARD_WIDTH[width_class], StyleClasses.CARD_HEIGHT[height_class], height, width);
            });
        });
    });

    // FIXME: no way to verify this.
    it('displays the record thumbnail in the thumbnail frame');
});

function test_style_classes_for_height_and_width(style_class_height, style_class_width, height, width) {
    it ('assigns correct classes to card of dimensions (' + width + ', ' + height + ')', function () {
        let card = new Minimal.MinimalCard();

        this.win.add(card);
        this.win.set_size_request(width, height);
        this.win.show_all();
        Utils.update_gui();

        expect(card).toHaveCssClass(style_class_height);
        expect(card).toHaveCssClass(style_class_width);
    });
}
