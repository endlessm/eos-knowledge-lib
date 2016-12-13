// Copyright 2016 Endless Mobile, Inc.

const Eknc = imports.gi.EosKnowledgeContent;

const SeeMore = imports.app.modules.filter.seeMore;
const HistoryStore = imports.app.historyStore;
const MockFactory = imports.tests.mockFactory;
const Pages = imports.app.pages;

describe('Filter.SeeMore', function () {
    const SETS = [
        Eknc.SetObjectModel.new_from_props({
            ekn_id: 'ekn://set1',
            tags: ['EknSetObject'],
        }),
        Eknc.SetObjectModel.new_from_props({
            ekn_id: 'ekn://set2',
            tags: ['EknSetObject'],
        }),
    ];

    let filter, store;

    function test_with_mode(mode, description, values) {
        describe('Inversed mode set to ' + mode, function () {
            beforeEach(function () {
                store = new HistoryStore.HistoryStore();
                HistoryStore.set_default(store);

                [filter, factory] = MockFactory.setup_tree({
                    type: SeeMore.SeeMore,
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

                expect(filter.include(SETS[0])).toEqual(values[0]);
                expect(filter.include(SETS[1])).toEqual(values[1]);
            });
        });
    }
    test_with_mode(false, 'filters out what is equal to current set', [false, true]);
    test_with_mode(true, 'filters out what is not equal to current set', [true, false]);
});
