// Copyright 2017 Endless Mobile, Inc.

const {DModel, Gtk} = imports.gi;

const Utils = imports.tests.utils;
Utils.register_gresource();

const ContentGroup = imports.app.modules.contentGroup.contentGroup;
const Minimal = imports.tests.minimal;
const MockFactory = imports.tests.mockFactory;
const OtherGroup = imports.app.modules.filter.otherGroup;
const Sidebar = imports.app.modules.layout.sidebar;

Gtk.init(null);

describe('Filter.OtherGroup', function () {
    let filter, ids_in_other_group;

    function setup_filter(mode) {
        let [, factory] = MockFactory.setup_tree({
            // Sidebar used randomly because it has two slots
            type: Sidebar.Sidebar,
            slots: {
                'sidebar': {
                    type: ContentGroup.ContentGroup,
                    slots: {
                        'selection': {
                            type: Minimal.MinimalSelection,
                            id: 'other',
                        },
                        'arrangement': {
                            type: Minimal.MinimalArrangement,
                            slots: {
                                'card': { type: Minimal.MinimalCard },
                            },
                        },
                    },
                },
                'content': {
                    type: ContentGroup.ContentGroup,
                    slots: {
                        'selection': {
                            type: Minimal.MinimalSelection,
                            slots: {
                                'filter': {
                                    type: OtherGroup.OtherGroup,
                                    properties: {
                                        'invert': mode,
                                    },
                                    references: {
                                        'other': 'other',
                                    },
                                },
                            },
                        },
                        'arrangement': {
                            type: Minimal.MinimalArrangement,
                            slots: {
                                'card': { type: Minimal.MinimalCard },
                            },
                        },
                    },
                },
            },
        });

        let selection = factory.get_last_created('sidebar.selection');
        filter = factory.get_last_created('content.selection.filter');

        selection.queue_load_more();
        ids_in_other_group = selection.get_models().map(({id}) => id);
    }

    describe('not inverted', function () {
        beforeEach(function () {
            setup_filter(false);
        });

        it('will not match IDs included in the other selection', function () {
            let query = filter.modify_xapian_query(new DModel.Query());
            expect(query.excluded_ids.length).toEqual(ids_in_other_group.length);
            ids_in_other_group.forEach(id => {
                expect(query.excluded_ids).toContain(id);
            });
        });
    });

    describe('inverted', function () {
        beforeEach(function () {
            setup_filter(true);
        });

        it('will only match IDs included in the other selection', function () {
            let query = filter.modify_xapian_query(new DModel.Query());
            expect(query.ids.length).toEqual(ids_in_other_group.length);
            ids_in_other_group.forEach(id => {
                expect(query.ids).toContain(id);
            });
        });
    });
});
