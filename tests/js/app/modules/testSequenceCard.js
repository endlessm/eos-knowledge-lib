// Copyright (C) 2016 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const ContentObjectModel = imports.search.contentObjectModel;
const CssClassMatcher = imports.tests.CssClassMatcher;
const StyleClasses = imports.app.styleClasses;
const SequenceCard = imports.app.modules.sequenceCard;

Gtk.init(null);

describe('Sequence card widget', function () {
    let model;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        model = new ContentObjectModel.ContentObjectModel({
            title: '!!!',
        });
    });

    it('has card and text-card class', function () {
        let card = new SequenceCard.SequenceCard({
            model: model,
        });
        expect(card).toHaveCssClass(StyleClasses.CARD);
        expect(card).toHaveCssClass(StyleClasses.SEQUENCE_CARD);
    });

    it('has a label with title class', function () {
        let card = new SequenceCard.SequenceCard({
            model: model,
        });
        expect(card).toHaveDescendantWithCssClass(StyleClasses.CARD_TITLE);
    });

    it('has a label with previous/next style classes', function () {
        let card = new SequenceCard.SequenceCard({
            model: model,
        });
        expect(card).toHaveDescendantWithCssClass('previous-label');
        expect(card).toHaveDescendantWithCssClass('next-label');
    });

    it('has title label that understand Pango markup', function () {
        let card = new SequenceCard.SequenceCard({
            model: model,
        });
        expect(Gtk.test_find_label(card, '*!!!*').use_markup).toBeTruthy();
    });
});
