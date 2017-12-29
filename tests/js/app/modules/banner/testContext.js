// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;
Gtk.init(null);

const Context = imports.app.modules.banner.context;
const HistoryStore = imports.app.historyStore;
const Pages = imports.app.pages;

describe('Banner.Context', function () {
    let module, store;

    beforeEach(function () {
        store = new HistoryStore.HistoryStore();
        HistoryStore.set_default(store);
        module = new Context.Context();
        module.label = 'clobber me';
    });

    it('changes the context label when going to the home page', function () {
        store.set_current_item_from_props({ page_type: Pages.HOME });
        expect(module.label).not.toEqual('clobber me');
    });

    it('changes the context label when going to the all-sets page', function () {
        store.set_current_item_from_props({ page_type: 'all-sets' });
        expect(module.label).not.toEqual('clobber me');
    });

    it('displays the given context label when showing a set', function () {
        store.set_current_item_from_props({
            page_type: Pages.SET,
            context_label: 'Set title',
        });
        expect(module.label).toEqual('Set title');
    });

    it('displays the given context label when showing an article', function () {
        store.set_current_item_from_props({
            page_type: Pages.ARTICLE,
            context_label: 'Some context',
        });
        expect(module.label).toEqual('Some context');
    });

    it('displays the user query when showing search', function () {
        store.set_current_item_from_props({
            page_type: Pages.SEARCH,
            search_terms: 'some user text',
        });
        expect(module.label).toMatch(/some user text/);
    });
});
