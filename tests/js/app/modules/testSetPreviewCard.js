const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const ContentObjectModel = imports.search.contentObjectModel;
const CssClassMatcher = imports.tests.CssClassMatcher;
const Minimal = imports.tests.minimal;
const MockFactory = imports.tests.mockFactory;
const StyleClasses = imports.app.styleClasses;
const SetPreviewCard = imports.app.modules.setPreviewCard;
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

    it('has a label with title class', function () {
        expect(card).toHaveDescendantWithCssClass(StyleClasses.CARD_TITLE);
    });

    it('sets label', function () {
        let card = new SetPreviewCard.SetPreviewCard({
            model: new ContentObjectModel.ContentObjectModel({
                title: 'Hello world',
            }),
            factory: factory,
            factory_name: 'preview-card-module'
        });
        expect(Gtk.test_find_label(card, 'Hello world')).toBeTruthy();
    });
});
