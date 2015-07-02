// Copyright 2015 Endless Mobile, Inc.

const Lang = imports.lang;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Mainloop = imports.mainloop;

const Utils = imports.tests.utils;
Utils.register_gresource();

const ArticleObjectModel = imports.search.articleObjectModel;
const Card = imports.app.interfaces.card;
const CssClassMatcher = imports.tests.CssClassMatcher;
const MinimalCard = imports.tests.minimalCard;
const Module = imports.app.interfaces.module;
const StyleClasses = imports.app.styleClasses;

Gtk.init(null);

const TestCard = new Lang.Class({
    Name: 'TestCard',
    Extends: Gtk.Grid,
    Implements: [ Module.Module, Card.Card ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
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
        this.thumbnail_frame = new Gtk.Frame();
        this.synopsis_label = new Gtk.Label();
        this.title_label = new Gtk.Label();

        this.add(this.label_child);
        this.add(this.no_show_all_child);
        this.add(this.authors_label);
        this.add(this.thumbnail_frame);
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

    it('adds the "invisible" and "fade-in" style classes while fading', function (done) {
        card.FADE_IN_TIME_MS = 20;
        Mainloop.timeout_add(10, () => {
            expect(card).toHaveCssClass(StyleClasses.INVISIBLE);
            expect(card).toHaveCssClass(StyleClasses.FADE_IN);
            return GLib.SOURCE_REMOVE;
        });
        Mainloop.timeout_add(25, () => {
            expect(card).not.toHaveCssClass(StyleClasses.INVISIBLE);
            expect(card).not.toHaveCssClass(StyleClasses.FADE_IN);
            done();
            return GLib.SOURCE_REMOVE;
        });
        card.fade_in();
        Utils.update_gui();
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
        card.fade_in();
        Utils.update_gui();
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
        expect(card.thumbnail_frame.visible).toBeTruthy();
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
