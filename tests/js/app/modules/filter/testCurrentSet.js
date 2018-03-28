// Copyright 2016 Endless Mobile, Inc.

const {DModel} = imports.gi;

const CurrentSet = imports.app.modules.filter.currentSet;
const HistoryStore = imports.app.historyStore;
const MockFactory = imports.tests.mockFactory;
const Pages = imports.app.pages;
const SetMap = imports.app.setMap;

describe('Filter.CurrentSet', function () {
    const SETS = [
        new DModel.Set({
            tags: ['EknSetObject'],
            child_tags: ['set'],
        }),
        new DModel.Set({
            tags: ['set', 'EknSetObject'],
            child_tags: ['subset'],
        }),
    ];

    const ARTICLES = [
        new DModel.Content({
            tags: ['set', 'EknArticleObject'],
        }),
        new DModel.Content({
            tags: ['set', 'subset', 'EknArticleObject'],
        }),
        new DModel.Content({
            tags: ['EknArticleObject'],
        }),
    ];

    let filter, store;

    function setup_filter(mode) {
        SetMap.init_map_with_models(SETS);

        let store = new HistoryStore.HistoryStore();
        HistoryStore.set_default(store);

        let [filter] = MockFactory.setup_tree({
            type: CurrentSet.CurrentSet,
            properties: {
                invert: mode,
            }
        });

        store.set_current_item_from_props({
            page_type: Pages.SET,
            model: SETS[0],
        });

        return [store, filter];
    }

    describe('not inverted', function () {
        beforeEach(function () {
            [store, filter] = setup_filter(false);
        });

        it('filters out what does not belong to the set', function () {
            expect(filter.include(ARTICLES[0])).toBeTruthy();
            expect(filter.include(ARTICLES[1])).toBeFalsy();
            expect(filter.include(ARTICLES[2])).toBeFalsy();
        });

        it('will match the set tag', function () {
            let query = filter.modify_xapian_query(new DModel.Query());
            expect(query.tags_match_any).toContain('set');
        });

        it('will not match the subset tag', function () {
            let query = filter.modify_xapian_query(new DModel.Query());
            expect(query.excluded_tags).toContain('subset');
        });
    });

    describe('inverted', function () {
        beforeEach(function () {
            [store, filter] = setup_filter(true);
        });

        it('filters out what does belong to the set', function () {
            expect(filter.include(ARTICLES[0])).toBeFalsy();
            expect(filter.include(ARTICLES[1])).toBeTruthy();
            expect(filter.include(ARTICLES[2])).toBeTruthy();
        });

        it('will not match the set tag', function () {
            let query = filter.modify_xapian_query(new DModel.Query());
            expect(query.excluded_tags).toContain('set');
        });

        it('will match the subset tag', function () {
            let query = filter.modify_xapian_query(new DModel.Query());
            expect(query.tags_match_any).toContain('subset');
        });
    });
});
