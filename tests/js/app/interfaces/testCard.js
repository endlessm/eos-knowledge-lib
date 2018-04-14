// Copyright 2015 Endless Mobile, Inc.

const {DModel, Gio, GLib, GObject, Gtk} = imports.gi;
const Lang = imports.lang;
const Mainloop = imports.mainloop;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Card = imports.app.interfaces.card;
const CssClassMatcher = imports.tests.CssClassMatcher;
const Minimal = imports.tests.minimal;
const MockEngine = imports.tests.mockEngine;
const SetMap = imports.app.setMap;

Gtk.init(null);

describe('Card interface', function () {
    let card, model;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        let data = [
            {
                id: '1',
                title: 'Foo',
                child_tags: ['foo'],
            },
            {
                id: '2',
                title: 'Bar',
                child_tags: ['bar'],
            },
        ];
        let sets = data.map(props => new DModel.Set(props));
        SetMap.init_map_with_models(sets);
        model = new DModel.Article({
            title: 'record title &',
            thumbnail_uri: 'file:///dev/zero',
            authors: ['record author &'],
            tags: ['foo', 'bar'],
        });
        card = new Minimal.MinimalCard({
            model: model,
        });
    });

    it('adds the "invisible" and "fade-in" style classes while fading', function (done) {
        card.FADE_IN_TIME_MS = 10;
        card.fade_in();
        expect(card).toHaveCssClass('invisible');
        expect(card).toHaveCssClass('fade-in');
        Utils.update_gui();
        Mainloop.timeout_add(25, () => {
            expect(card).not.toHaveCssClass('invisible');
            expect(card).not.toHaveCssClass('fade-in');
            done();
            return GLib.SOURCE_REMOVE;
        });
    });

    it('is insensitive while fading', function (done) {
        card.FADE_IN_TIME_MS = 10;
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

    it('sets a label for the duration', function () {
        let label = new Gtk.Label();
        card.set_duration_label(label, 2);
        expect(label.visible).toBeTruthy();
        expect(label.label).toBe('0:02 minutes');

        card.set_duration_label(label, 605);
        expect(label.label).toBe('10:05 minutes');

        card.set_duration_label(label, 60);
        expect(label.label).toBe('1:00 minute');

        card.set_duration_label(label, undefined);
        expect(label.visible).toBeFalsy();
    });

    it('sets up a context widget with model tags', function () {
        let widget = card.create_context_widget_from_model();
        let first_tag = Gtk.test_find_label(widget, 'Foo');
        expect(first_tag).not.toBeNull();
        let second_tag = Gtk.test_find_label(widget, ' | Bar');
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
        let provider = new Gtk.CssProvider();
        provider.load_from_data(css);
        label.get_style_context().add_provider(provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
        card.set_title_label_with_highlight(label);
        expect(label.label.match(/<span .*bgcolor="#ff0000.*">title<\/span>/)).not.toBeNull();
    });

    it('updates the highlight string', function () {
        let css = '.highlighted{background-color:#ff0000;}';
        card = new Minimal.MinimalCard({
            model: model,
            highlight_string: 'title',
        });
        let label = new Gtk.Label();
        let provider = new Gtk.CssProvider();
        provider.load_from_data(css);
        label.get_style_context().add_provider(provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
        card.set_title_label_with_highlight(label);
        card.highlight_string = 'ti';
        expect(label.label.match(/<span .*bgcolor="#ff0000.*">ti<\/span>/)).not.toBeNull();
    });

    it('sets a thumbnail frame visible if model has a thumbnail uri', function () {
        let frame = new Gtk.Frame();
        card.set_thumbnail_frame_from_model(frame);
        expect(frame.visible).toBeTruthy();
    });

    describe ('sequence', function () {
        it('is none by default', function () {
            expect(card.sequence).toBe(Card.Sequence.NONE);
        });

        it('can be set properly', function () {
            card.sequence = Card.Sequence.PREVIOUS;
            expect(card.sequence).toBe(Card.Sequence.PREVIOUS);
            card.sequence = Card.Sequence.NEXT;
            expect(card.sequence).toBe(Card.Sequence.NEXT);
            card.sequence = Card.Sequence.NONE;
            expect(card.sequence).toBe(Card.Sequence.NONE);
        });

        it('notifies when changed', function (done) {
            card.connect('notify::sequence', done);
            card.sequence = Card.Sequence.PREVIOUS;
        });
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

        Object.keys(Card.WIDTH_STYLE_CLASSES).forEach(width_class => {
            Object.keys(Card.HEIGHT_STYLE_CLASSES).forEach(height_class => {
                let width = in_between_class_dimensions[width_class];
                let height = in_between_class_dimensions[height_class];
                test_style_classes_for_height_and_width(Card.WIDTH_STYLE_CLASSES[width_class], Card.HEIGHT_STYLE_CLASSES[height_class], height, width);
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
