// Copyright 2016 Endless Mobile, Inc.

const ContentObjectModel = imports.search.contentObjectModel;
const SeeMore = imports.app.modules.filter.seeMore;
const HistoryStore = imports.app.historyStore;
const Pages = imports.app.pages;
const SetObjectModel = imports.search.setObjectModel;

describe('Filter.SeeMore', function () {
    const SETS = [
        new SetObjectModel.SetObjectModel({
            ekn_id: 'ekn://set1',
            tags: ['EknSetObject'],
        }),
        new SetObjectModel.SetObjectModel({
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

                filter = new SeeMore.SeeMore({
                    invert: mode,
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
