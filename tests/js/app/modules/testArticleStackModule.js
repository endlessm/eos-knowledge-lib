const Gtk = imports.gi.Gtk;

const Actions = imports.app.actions;
const ArticleStackModule = imports.app.modules.articleStackModule;
const ContentObjectModel = imports.search.contentObjectModel;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;
const MockDispatcher = imports.tests.mockDispatcher;
const MockFactory = imports.tests.mockFactory;
const Minimal = imports.tests.minimal;
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
});
