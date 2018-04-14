const {DModel, Gtk} = imports.gi;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Actions = imports.app.actions;
const AppUtils = imports.app.utils;
const ArticleStack = imports.app.modules.layout.articleStack;
const Box = imports.app.modules.layout.box;
const ContentGroup = imports.app.modules.contentGroup.contentGroup;
const HistoryStore = imports.app.historyStore;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;
const Minimal = imports.tests.minimal;
const MockDispatcher = imports.tests.mockDispatcher;
const MockFactory = imports.tests.mockFactory;
const Pages = imports.app.pages;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);

describe('Layout.ArticleStack', function () {
    let module, view, selection, root, factory, dispatcher, article_model;
    let store;

    beforeEach(function () {
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);
        dispatcher = MockDispatcher.mock_default();
        store = new HistoryStore.HistoryStore();
        HistoryStore.set_default(store);

        [root, factory] = new MockFactory.setup_tree({
            type: Box.Box,
            slots: {
                contents: [
                {
                    type: ArticleStack.ArticleStack,
                    references: {
                        'selection': 'selection',
                    },
                    slots: {
                        'article': { type: Minimal.MinimalView },
                    },
                },
                {
                    type: ContentGroup.ContentGroup,
                    slots: {
                        'arrangement': {
                            type: Minimal.MinimalArrangement,
                            slots: {
                                'card': { type: Minimal.MinimalCard },
                            },
                        },
                        'selection': {
                            type: Minimal.MinimalSelection,
                            id: 'selection',
                        },
                    },
                }
                ],
            }
        });

        module = factory.get_created('contents')[0];
        spyOn(AppUtils, 'get_web_plugin_dbus_name').and.returnValue('test0');

        article_model = new DModel.Article();
        store.set_current_item_from_props({
            page_type: Pages.ARTICLE,
            model: article_model,
        });

        selection = factory.get_last_created('contents.selection');
        view = factory.get_last_created('contents.article.0');
    });

    it('transitions in new content when state changes to article page', function () {
        expect(module).toHaveDescendant(view);
    });

    it('shows the article without animation when first loading the article page', function () {
        expect(module.transition_type).toBe(Gtk.StackTransitionType.NONE);
    });

    it('dispatches article link clicked', function () {
        let id = 'ekn://foo/bar';
        view.emit('ekn-link-clicked', id);
        let payload = dispatcher.last_payload_with_type(Actions.ARTICLE_LINK_CLICKED);
        expect(payload.id).toBe(id);
    });

    it('loads a new article when selection changes', function () {
        spyOn(selection, 'get_models');
        let different_article_model = new DModel.Article();
        selection.get_models.and.returnValue([different_article_model]);
        selection.emit('models-changed');
        Utils.update_gui();
        let new_view = factory.get_created('contents.article.1')[0];
        expect(new_view).toBeDefined();
        expect(module).toHaveDescendant(new_view);
    });

    it('still works without a selection reference', function () {
        [module, factory] = new MockFactory.setup_tree({
            type: ArticleStack.ArticleStack,
            slots: {
                'article': { type: Minimal.MinimalView },
            },
        });
        expect(module).toBeDefined();
    });
});
