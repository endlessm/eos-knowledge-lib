// Copyright 2015 Endless Mobile, Inc.

const {DModel, Gtk} = imports.gi;

const BannerSet = imports.framework.modules.banner.set;
const HistoryStore = imports.framework.historyStore;
const MockFactory = imports.tests.mockFactory;
const Minimal = imports.tests.minimal;
const Pages = imports.framework.pages;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);

describe('Banner.Set', function () {
    let module, factory, store;

    beforeEach(function () {
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);
        store = new HistoryStore.HistoryStore();
        HistoryStore.set_default(store);

        [module, factory] = MockFactory.setup_tree({
            type: BannerSet.Set,
            slots: {
                'card': { type: Minimal.MinimalCard },
            },
        });
    });

    it('creates a card when state changes to set page', function () {
        let model = new DModel.Set();
        store.set_current_item_from_props({
            page_type: Pages.SET,
            model: model,
        });
        let card = factory.get_last_created('card');
        expect(card.model).toBe(model);
        expect(module).toHaveDescendant(card);
    });

    it('creates a new card for each new set model on set page', function () {
        let model1 = new DModel.Set();
        let model2 = new DModel.Set();
        store.set_current_item_from_props({
            page_type: Pages.SET,
            model: model1,
        });
        store.set_current_item_from_props({
            page_type: Pages.SET,
            model: model2,
        });
        expect(factory.get_created('card').length).toBe(2);
    });

    it('does not change for the same set model', function () {
        let model = new DModel.Set();
        store.set_current_item_from_props({
            page_type: Pages.SET,
            model: model,
        });
        store.set_current_item_from_props({
            page_type: Pages.HOME,
        });
        store.set_current_item_from_props({
            page_type: Pages.SET,
            model: model,
        });
        expect(factory.get_created('card').length).toBe(1);
    });
});
