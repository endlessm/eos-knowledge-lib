// Copyright 2016 Endless Mobile, Inc.

const ContentObjectModel = imports.search.contentObjectModel;
const CurrentSet = imports.app.modules.filter.currentSet;
const HistoryStore = imports.app.historyStore;
const MockFactory = imports.tests.mockFactory;
const Pages = imports.app.pages;
const SetMap = imports.app.setMap;
const SetObjectModel = imports.search.setObjectModel;

describe('Filter.CurrentSet', function () {
    const SETS = [
        new SetObjectModel.SetObjectModel({
            ekn_id: 'ekn://set',
            tags: ['EknSetObject'],
            child_tags: ['set'],
        }),
        new SetObjectModel.SetObjectModel({
            ekn_id: 'ekn://subset',
            tags: ['set', 'EknSetObject'],
            child_tags: ['subset'],
        }),
    ];

    const ARTICLES = [
        new ContentObjectModel.ContentObjectModel({
            ekn_id: 'ekn://belongs_to_set',
            tags: ['set', 'EknArticleObject'],
        }),
        new ContentObjectModel.ContentObjectModel({
            ekn_id: 'ekn://belongs_to_subset',
            tags: ['set', 'subset', 'EknArticleObject'],
        }),
        new ContentObjectModel.ContentObjectModel({
            ekn_id: 'ekn://belongs_to_none',
            tags: ['EknArticleObject'],
        }),
    ];

    let filter, store;

    function test_with_mode(mode, description, values) {
        describe('Inversed mode set to ' + mode, function () {
            beforeEach(function () {
                SetMap.init_map_with_models(SETS);

                store = new HistoryStore.HistoryStore();
                HistoryStore.set_default(store);

                [filter, factory] = MockFactory.setup_tree({
                    type: CurrentSet.CurrentSet,
                    properties: {
                        invert: mode,
                    }
                });
            });

            it(description, function () {
                store.set_current_item_from_props({
                    page_type: Pages.SET,
                    model: SETS[0],
                });

                expect(filter.include(ARTICLES[0])).toEqual(values[0]);
                expect(filter.include(ARTICLES[1])).toEqual(values[1]);
                expect(filter.include(ARTICLES[2])).toEqual(values[2]);
            });
        });
    }
    test_with_mode(false, 'filters out what does not belong to the set', [true, false, false]);
    test_with_mode(true, 'filters out what does belong to the set', [false, true, true]);
});
