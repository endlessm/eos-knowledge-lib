// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const ContentGroup = imports.app.modules.contentGroup.contentGroup;
const HistoryStore = imports.app.historyStore;
const MockFactory = imports.tests.mockFactory;
const InfiniteScrolling = imports.app.modules.layout.infiniteScrolling;
const Minimal = imports.tests.minimal;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);

describe('Layout.InfiniteScrolling', function () {
    let factory, template, store;

    beforeEach(function () {
        store = new HistoryStore.HistoryStore();
        HistoryStore.set_default(store);
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

        [template, factory] = MockFactory.setup_tree({
            type: InfiniteScrolling.InfiniteScrolling,
            references: {
                'lazy-load': 'selection',
            },
            slots: {
                'content': {
                    type: ContentGroup.ContentGroup,
                    slots: {
                        'arrangement': { type: Minimal.MinimalArrangement },
                        'selection': {
                            type: Minimal.MinimalSelection,
                            id: 'selection',
                        },
                    },
                },
            },
        });
    });

    it('packs all its children', function () {
        let content = factory.get_last_created('content');
        expect(template).toHaveDescendant(content);
    });

    it('lazy loads more models when scrolling down', function () {
        let selection = factory.get_last_created('content.selection');
        selection.can_load_more = true;
        spyOn(selection, 'queue_load_more');
        template.emit('need-more-content');
        Utils.update_gui();
        expect(selection.queue_load_more).toHaveBeenCalled();
    });
});
