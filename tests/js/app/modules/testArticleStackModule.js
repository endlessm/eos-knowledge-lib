const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Actions = imports.app.actions;
const ArticleStackModule = imports.app.modules.articleStackModule;
const ContentObjectModel = imports.search.contentObjectModel;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;
const MockDispatcher = imports.tests.mockDispatcher;
const MockFactory = imports.tests.mockFactory;
const Minimal = imports.tests.minimal;
const SequenceCard = imports.app.modules.sequenceCard;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);

describe('Article Page A', function () {
    let module, factory, dispatcher;

    beforeEach(function () {
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);
        dispatcher = MockDispatcher.mock_default();

        factory = new MockFactory.MockFactory();
        factory.add_named_mock('mock-card', Minimal.MinimalDocumentCard);
        factory.add_named_mock('article-stack-module', ArticleStackModule.ArticleStackModule, {
            'card-type': 'mock-card',
        });

        module = new ArticleStackModule.ArticleStackModule({
            factory: factory,
            factory_name: 'article-stack-module',
        });
    });

    it('can be constructed', function () {
        expect(module).toBeDefined();
    });

    it('transitions in new content when show-article dispatched', function () {
        let model_t = new ContentObjectModel.ContentObjectModel();
        dispatcher.dispatch({
            action_type: Actions.SHOW_ARTICLE,
            model: model_t,
        });
        let card = factory.get_created_named_mocks('mock-card')[0];
        expect(module).toHaveDescendant(card);
    });

    it('sets up a previous and next card if in the payload', function () {
        let model_t = new ContentObjectModel.ContentObjectModel();
        let model_s = new ContentObjectModel.ContentObjectModel({
            title: 'foo',
        });
        let model_hansel = new ContentObjectModel.ContentObjectModel({
            title: 'bar',
        });
        dispatcher.dispatch({
            action_type: Actions.SHOW_ARTICLE,
            model: model_t,
            previous_model: model_s,
            next_model: model_hansel,
        });
        let card = factory.get_created_named_mocks('mock-card')[0];
        expect(card.previous_card).toBeA(SequenceCard.SequenceCard);
        expect(card.next_card).toBeA(SequenceCard.SequenceCard);
    });
});
