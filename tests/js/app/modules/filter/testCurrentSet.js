// Copyright 2016 Endless Mobile, Inc.

const Eknc = imports.gi.EosKnowledgeContent;

const CurrentSet = imports.app.modules.filter.currentSet;
const HistoryStore = imports.app.historyStore;
const MockFactory = imports.tests.mockFactory;
const Pages = imports.app.pages;
const SetMap = imports.app.setMap;

describe('Filter.CurrentSet', function () {
    const SETS = [
        Eknc.SetObjectModel.new_from_props({
            ekn_id: 'ekn://set',
            tags: ['EknSetObject'],
            child_tags: ['set'],
        }),
        Eknc.SetObjectModel.new_from_props({
            ekn_id: 'ekn://subset',
            tags: ['set', 'EknSetObject'],
            child_tags: ['subset'],
        }),
    ];

    const ARTICLES = [
        Eknc.ContentObjectModel.new_from_props({
            ekn_id: 'ekn://belongs_to_set',
            tags: ['set', 'EknArticleObject'],
        }),
        Eknc.ContentObjectModel.new_from_props({
            ekn_id: 'ekn://belongs_to_subset',
            tags: ['set', 'subset', 'EknArticleObject'],
        }),
        Eknc.ContentObjectModel.new_from_props({
            ekn_id: 'ekn://belongs_to_none',
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
    });
});
