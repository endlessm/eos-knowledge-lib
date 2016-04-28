// Copyright (C) 2016 Endless Mobile, Inc.

const Gdk = imports.gi.Gdk;
const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Card = imports.app.interfaces.card;
const ContentObjectModel = imports.search.contentObjectModel;
const CssClassMatcher = imports.tests.CssClassMatcher;
const AllTypeCard = imports.app.modules.allTypeCard;
const SetMap = imports.app.setMap;
const SetObjectModel = imports.search.setObjectModel;
const StyleClasses = imports.app.styleClasses;

Gtk.init(null);

describe('All Type Card', function () {
    let card, set;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        set = new SetObjectModel.SetObjectModel({
            ekn_id: '2',
            title: 'Bar',
        });
        spyOn(SetMap, 'get_set_for_tag').and.returnValue(set);
        card = new AllTypeCard.AllTypeCard({
            model: new ContentObjectModel.ContentObjectModel({
                title: '!!!',
                synopsis: '@@@',
                tags: ['???'],
            }),
        });
    });

    it('has the correct style class', function () {
        expect(card).toHaveCssClass(StyleClasses.ALL_TYPE_CARD);
    });

    it('has label style classes', function () {
        expect(card).toHaveDescendantWithCssClass(StyleClasses.CARD_TITLE);
        expect(card).toHaveDescendantWithCssClass(StyleClasses.CARD_SYNOPSIS);
        expect(card).toHaveDescendantWithCssClass(StyleClasses.CARD_CONTEXT);
    });

    it('has labels that understand Pango markup', function () {
        expect(Gtk.test_find_label(card, '*!!!*').use_markup).toBeTruthy();
        expect(Gtk.test_find_label(card, '*@@@*').use_markup).toBeTruthy();
        expect(Gtk.test_find_label(card, '*???*').use_markup).toBeTruthy();
    });

    describe('when resizing', function () {
        function _check_visibility_for_height (height, state) {
            it('with height ' + height + ' updates labels visibility', function () {
                let alloc = new Gdk.Rectangle({
                    height: height,
                    width: Card.MaxSize.A,
                });
                card.size_allocate(alloc);
                Utils.update_gui();
                expect(card._title_label.visible).toBe(state.title);
                expect(card._synopsis_label.visible).toBe(state.synopsis);
                expect(card._context_label.visible).toBe(state.context);
            });
        }
        _check_visibility_for_height(
            Card.MinSize.A, {
                title: true,
                synopsis: false,
                context: false
        });
        _check_visibility_for_height(
            Card.MinSize.B, {
                title: true,
                synopsis: false,
                context: true,
        });
        _check_visibility_for_height(
            Card.MinSize.C, {
                title: true,
                synopsis: true,
                context: true,
        });
    });
});
