const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Actions = imports.app.actions;
const ArticleObjectModel = imports.search.articleObjectModel;
const AppUtils = imports.app.utils;
const ArticleStackModule = imports.app.modules.articleStackModule;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;
const MockDispatcher = imports.tests.mockDispatcher;
const MockFactory = imports.tests.mockFactory;
const Minimal = imports.tests.minimal;
const SequenceCard = imports.app.modules.sequenceCard;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);

describe('Article Page A', function () {
    let module, factory, dispatcher, article_model, previous_model, next_model;

    beforeEach(function () {
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);
        dispatcher = MockDispatcher.mock_default();

        factory = new MockFactory.MockFactory();
        factory.add_named_mock('mock-card', Minimal.MinimalDocumentCard);
        factory.add_named_mock('article-stack-module', ArticleStackModule.ArticleStackModule, {
            'card-type': 'mock-card',
        });

        article_model = new ArticleObjectModel.ArticleObjectModel();
        previous_model = new ArticleObjectModel.ArticleObjectModel({
            title: 'foo',
        });
        next_model = new ArticleObjectModel.ArticleObjectModel({
            title: 'bar',
        });

        spyOn(AppUtils, 'get_web_plugin_dbus_name').and.returnValue("test0");
        module = new ArticleStackModule.ArticleStackModule({
            factory: factory,
            factory_name: 'article-stack-module',
        });

        dispatcher.dispatch({
            action_type: Actions.SHOW_ARTICLE,
            model: article_model,
            previous_model: previous_model,
            next_model: next_model,
        });
    });

    it('can be constructed', function () {
        expect(module).toBeDefined();
    });

    it('transitions in new content when show-article dispatched', function () {
        let card = factory.get_created_named_mocks('mock-card')[0];
        expect(module).toHaveDescendant(card);
    });

    it('sets up a previous and next card if in the payload', function () {
        let card = factory.get_created_named_mocks('mock-card')[0];
        expect(card.previous_card).toBeA(SequenceCard.SequenceCard);
        expect(card.next_card).toBeA(SequenceCard.SequenceCard);
    });

    it('dispatches article link clicked', function () {
        let card = factory.get_created_named_mocks('mock-card')[0];
        let id = 'ekn://foo/bar';
        card.emit('ekn-link-clicked', id);
        let payload = dispatcher.last_payload_with_type(Actions.ARTICLE_LINK_CLICKED);
        expect(payload.ekn_id).toBe(id);
    });

    it('dispatches previous clicked', function () {
        let card = factory.get_created_named_mocks('mock-card')[0];
        card.previous_card.emit('clicked');
        let payload = dispatcher.last_payload_with_type(Actions.PREVIOUS_DOCUMENT_CLICKED);
        expect(payload.model).toBe(previous_model);
    });

    it('dispatches next clicked', function () {
        let card = factory.get_created_named_mocks('mock-card')[0];
        card.next_card.emit('clicked');
        let payload = dispatcher.last_payload_with_type(Actions.NEXT_DOCUMENT_CLICKED);
        expect(payload.model).toBe(next_model);
    });
});
