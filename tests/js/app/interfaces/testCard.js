// Copyright 2015 Endless Mobile, Inc.

const Lang = imports.lang;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Mainloop = imports.mainloop;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Card = imports.app.interfaces.card;
const ArticleObjectModel = imports.search.articleObjectModel;
const CssClassMatcher = imports.tests.CssClassMatcher;
const MinimalCard = imports.tests.minimalCard;

Gtk.init(null);

const TestCard = new Lang.Class({
    Name: 'TestCard',
    Extends: Gtk.Grid,
    Implements: [ Card.Card ],

    Properties: {
        'css': GObject.ParamSpec.override('css', Card.Card),
        'fade-in': GObject.ParamSpec.override('fade-in', Card.Card),
        'model': GObject.ParamSpec.override('model', Card.Card),
        'title-capitalization': GObject.ParamSpec.override('title-capitalization',
            Card.Card),
    },

    _init: function (props={}) {
        this.parent(props);
        this.label_child = new Gtk.Label({ label: 'Haha' });
        this.no_show_all_child = new Gtk.Label({
            label: 'Haha',
            no_show_all: true,
        });
        this.authors_label = new Gtk.Label();
        this.image_frame = new Gtk.Frame();
        this.synopsis_label = new Gtk.Label();
        this.title_label = new Gtk.Label();

        this.add(this.label_child);
        this.add(this.no_show_all_child);
        this.add(this.authors_label);
        this.add(this.image_frame);
        this.add(this.synopsis_label);
        this.add(this.title_label);

        this.populate_from_model();
    },
});

describe('Card interface', function () {
    let card, model;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        model = new ArticleObjectModel.ArticleObjectModel({
            title: 'record title',
            synopsis: 'record synopsis',
            thumbnail_uri: 'about:blank',
            authors: ['record author'],
        });
        card = new TestCard({
            model: model,
        });
    });

    it('reimplements Gtk.Widget.show_all() correctly', function () {
        card.show_all();
        Utils.update_gui();
        expect(card.visible).toBeTruthy();
        expect(card.label_child.visible).toBeTruthy();
        expect(card.no_show_all_child.visible).toBeFalsy();
    });

    it('adds the "visible" style class when showing without fading in', function () {
        card.show_all();
        Utils.update_gui();
        expect(card).toHaveCssClass('visible');
    });

    describe('when fading in', function () {
        beforeEach(function () {
            card = new TestCard({ fade_in: true });
        });

        it('adds the "fade-in" style class', function () {
            card.show_all();
            Utils.update_gui();
            expect(card).toHaveCssClass('fade-in');
        });

        it('is insensitive while fading', function (done) {
            card.FADE_IN_TIME_MS = 20;
            Mainloop.timeout_add(10, () => {
                expect(card.sensitive).toBeFalsy();
                return GLib.SOURCE_REMOVE;
            });
            Mainloop.timeout_add(25, () => {
                expect(card.sensitive).toBeTruthy();
                done();
                return GLib.SOURCE_REMOVE;
            });
            card.show_all();
            Utils.update_gui();
        });
    });

    it('displays the record authors in the authors label', function () {
        expect(card.authors_label.label).toEqual('by record author');
    });

    it('shows the authors label if the record has authors', function () {
        card.show_all();
        Utils.update_gui();
        expect(card.authors_label.visible).toBeTruthy();
    });

    // FIXME: no way to verify this.
    it('displays the record thumbnail in the image frame');

    it('shows the image frame if the record has an image', function () {
        card.show_all();
        Utils.update_gui();
        expect(card.image_frame.visible).toBeTruthy();
    });

    it('displays the record synopsis in the synopsis label', function () {
        expect(card.synopsis_label.label).toEqual('record synopsis');
    });

    it('shows the synopsis label if the record has a synopsis', function () {
        card.show_all();
        Utils.update_gui();
        expect(card.synopsis_label.visible).toBeTruthy();
    });

    it('displays the record title in the title label', function () {
        // The capitalization comes from a backwards-compatibility hack in
        // ContentObjectModel
        expect(card.title_label.label).toEqual('Record title');
    });

    it('shows the title label if the record has a title', function () {
        card.show_all();
        Utils.update_gui();
        expect(card.title_label.visible).toBeTruthy();
    });

    it('can also not display any of that stuff', function () {
        card = new MinimalCard.MinimalCard();  // should not complain
    });
});
