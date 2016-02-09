const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const ContentObjectModel = imports.search.contentObjectModel;
const CssClassMatcher = imports.tests.CssClassMatcher;
const Minimal = imports.tests.minimal;
const MockDispatcher = imports.tests.mockDispatcher;
const MockFactory = imports.tests.mockFactory;
const StyleClasses = imports.app.styleClasses;
const SetPreviewCard = imports.app.modules.setPreviewCard;
const TextCard = imports.app.modules.textCard;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);

describe('Set Preview card widget', function () {
    let card, factory;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

        factory = new MockFactory.MockFactory();
        factory.add_named_mock('arrangement', Minimal.MinimalArrangement);
        factory.add_named_mock('article-card', Minimal.MinimalCard);
        factory.add_named_mock('preview-card-module', SetPreviewCard.SetPreviewCard, {
            'arrangement': 'arrangement',
            'card-type': 'article-card',
        });
        card = new SetPreviewCard.SetPreviewCard({
            model: new ContentObjectModel.ContentObjectModel(),
            factory: factory,
            factory_name: 'preview-card-module',
        });
    });

    it('has card class', function () {
        expect(card).toHaveCssClass(StyleClasses.CARD);
    });

    it('has a label with title class', function () {
        expect(card).toHaveDescendantWithCssClass(StyleClasses.CARD_TITLE);
    });

    it('has a text card descendant', function () {
        expect(card).toHaveDescendantWithClass(TextCard.TextCard);
    });

    it('has labels that understand Pango markup', function () {
        let card = new SetPreviewCard.SetPreviewCard({
            model: new ContentObjectModel.ContentObjectModel({
                title: '!!!',
            }),
            factory: factory,
            factory_name: 'preview-card-module'
        });
        expect(Gtk.test_find_label(card, '*!!!*').use_markup).toBeTruthy();
    });
});
