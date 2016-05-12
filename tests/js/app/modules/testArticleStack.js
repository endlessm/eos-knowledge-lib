const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Actions = imports.app.actions;
const AppUtils = imports.app.utils;
const ArticleObjectModel = imports.search.articleObjectModel;
const ArticleStack = imports.app.modules.articleStack;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;
const Minimal = imports.tests.minimal;
const MockDispatcher = imports.tests.mockDispatcher;
const MockFactory = imports.tests.mockFactory;
const SequenceCard = imports.app.modules.sequenceCard;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);

describe('Article stack', function () {
    let module, card, dispatcher, article_model, previous_model, next_model;

    beforeEach(function () {
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);
        dispatcher = MockDispatcher.mock_default();

        let factory = new MockFactory.MockFactory({
            'Card': Minimal.MinimalDocumentCard,
            'NavCard': Minimal.MinimalNavigationCard,
            'ArticleStack': ArticleStack.ArticleStack,
        }, {
            type: 'ArticleStack',
            slots: {
                'card-type': {
                    type: 'Card',
                },
                'nav-card-type': {
                    type: 'NavCard',
                },
            },
        });
        module = factory.create_module_tree();

        spyOn(AppUtils, 'get_web_plugin_dbus_name').and.returnValue('test0');

        article_model = new ArticleObjectModel.ArticleObjectModel();
        previous_model = new ArticleObjectModel.ArticleObjectModel({
            title: 'foo',
        });
        next_model = new ArticleObjectModel.ArticleObjectModel({
            title: 'bar',
        });
        dispatcher.dispatch({
            action_type: Actions.SHOW_ARTICLE,
            model: article_model,
            previous_model: previous_model,
            next_model: next_model,
        });

        card = factory.get_created_mocks('Card')[0];
    });

    it('can be constructed', function () {
        expect(module).toBeDefined();
    });

    it('transitions in new content when show-article dispatched', function () {
        expect(module).toHaveDescendant(card);
    });

    it('sets up a previous and next card if in the payload', function () {
        expect(card.previous_card).toBeA(Minimal.MinimalNavigationCard);
        expect(card.next_card).toBeA(Minimal.MinimalNavigationCard);
    });

    it('dispatches article link clicked', function () {
        let id = 'ekn://foo/bar';
        card.emit('ekn-link-clicked', id);
        let payload = dispatcher.last_payload_with_type(Actions.ARTICLE_LINK_CLICKED);
        expect(payload.ekn_id).toBe(id);
    });

    it('dispatches previous clicked', function () {
        card.previous_card.emit('clicked');
        let payload = dispatcher.last_payload_with_type(Actions.PREVIOUS_DOCUMENT_CLICKED);
        expect(payload.model).toBe(previous_model);
    });

    it('dispatches next clicked', function () {
        card.next_card.emit('clicked');
        let payload = dispatcher.last_payload_with_type(Actions.NEXT_DOCUMENT_CLICKED);
        expect(payload.model).toBe(next_model);
    });
});
