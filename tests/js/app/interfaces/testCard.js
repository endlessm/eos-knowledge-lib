// Copyright 2015 Endless Mobile, Inc.

const Lang = imports.lang;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Mainloop = imports.mainloop;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Card = imports.app.interfaces.card;
const CssClassMatcher = imports.tests.CssClassMatcher;

Gtk.init(null);

const TestCard = new Lang.Class({
    Name: 'TestCard',
    Extends: Gtk.Grid,
    Implements: [ Card.Card ],

    Properties: {
        'css': GObject.ParamSpec.override('css', Card.Card),
        'fade-in': GObject.ParamSpec.override('fade-in', Card.Card),
    },

    _init: function (props={}) {
        this.parent(props);
        this.label_child = new Gtk.Label({ label: 'Haha' });
        this.no_show_all_child = new Gtk.Label({
            label: 'Haha',
            no_show_all: true,
        });
        this.add(this.label_child);
        this.add(this.no_show_all_child);
    },
});

describe('Card interface', function () {
    let card;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        card = new TestCard();
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
});
