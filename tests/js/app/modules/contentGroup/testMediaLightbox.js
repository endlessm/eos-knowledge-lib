const {DModel, Gtk} = imports.gi;

const Utils = imports.tests.utils;
Utils.register_gresource();

const HistoryStore = imports.app.historyStore;
const Minimal = imports.tests.minimal;
const MockEngine = imports.tests.mockEngine;
const MockFactory = imports.tests.mockFactory;
const MediaLightbox = imports.app.modules.contentGroup.mediaLightbox;
const Pages = imports.app.pages;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);

describe('ContentGroup.MediaLightbox', function () {
    let module, engine, factory, store;
    let media_model, article_model;

    beforeEach(function () {
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);
        engine = MockEngine.mock_default();
        store = new HistoryStore.HistoryStore();
        HistoryStore.set_default(store);

        [module, factory] = MockFactory.setup_tree({
            type: MediaLightbox.MediaLightbox,
            slots: {
                'view': { type: Minimal.MinimalCard },
                'content': { type: null },
            },
        });

        media_model = new DModel.Media({
            id: 'ekn://foo/bar',
        });
        article_model = new DModel.Article({
            resources: ['ekn://foo/bar'],
        });
    });

    it('packs its content', function () {
        let content = factory.get_last_created('content');
        expect(module).toHaveDescendant(content);
    });

    it('shows a media object on change to history item with media model', function () {
        store.set_current_item_from_props({
            page_type: Pages.ARTICLE,
            context: article_model.resources,
            media_model: media_model,
        });
        expect(module.reveal_overlays).toBeTruthy();
        expect(module).toHaveDescendantWithClass(Minimal.MinimalCard);
    });

    it('loads media into lightbox if and only if it is a member of article\'s resource array', function () {
        store.set_current_item_from_props({
            page_type: Pages.ARTICLE,
            context: article_model.resources,
            media_model: media_model,
        });
        expect(factory.get_created('view').length).toBe(1);

        let nonexistent_media_object = new DModel.Media();
        store.set_current_item_from_props({
            page_type: Pages.ARTICLE,
            context: article_model.resources,
            media_model: nonexistent_media_object,
        });
        expect(factory.get_created('view').length).toBe(1);
    });

    it('closes the lightbox on history item without media model', function () {
        store.set_current_item_from_props({
            page_type: Pages.ARTICLE,
            context: article_model.resources,
            media_model: media_model,
        });
        expect(module.reveal_overlays).toBeTruthy();
        store.set_current_item_from_props({
            page_type: Pages.ARTICLE,
            model: article_model,
        });
        expect(module.reveal_overlays).toBeFalsy();
    });
});
