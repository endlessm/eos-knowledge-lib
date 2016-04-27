// Copyright (C) 2016 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const CardB = imports.app.modules.cardB;
const ContentObjectModel = imports.search.contentObjectModel;
const CssClassMatcher = imports.tests.CssClassMatcher;
const StyleClasses = imports.app.styleClasses;

Gtk.init(null);

describe('Card B', function () {
    let card;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        card = new CardB.CardB({
            model: new ContentObjectModel.ContentObjectModel(),
        });
    });

    describe('Style class of card', function () {
        it('has card class', function () {
            expect(card).toHaveCssClass(StyleClasses.CARD_B);
        });
    });

    it('has labels that understand Pango markup', function () {
        let card = new CardB.CardB({
            model: new ContentObjectModel.ContentObjectModel({
                title: '!!!',
            }),
        });
        expect(Gtk.test_find_label(card, '*!!!*').use_markup).toBeTruthy();
    });
});
