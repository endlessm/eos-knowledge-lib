const Gtk = imports.gi.Gtk;
Gtk.init(null);

const Utils = imports.tests.utils;
Utils.register_gresource();

const Actions = imports.app.actions;
const BrandPage = imports.app.modules.layout.brandPage;
const MockDispatcher = imports.tests.mockDispatcher;
const MockFactory = imports.tests.mockFactory;

describe('Layout.BrandPage', function () {
    let module, factory, dispatcher, brand, content;

    beforeEach(function () {
        dispatcher = MockDispatcher.mock_default();
        [module, factory] = MockFactory.setup_tree({
            type: BrandPage.BrandPage,
            slots: {
                'brand': { type: null },
                'content': { type: null },
            },
        });
        brand = factory.get_last_created('brand');
        content = factory.get_last_created('content');
        spyOn(content, 'make_ready').and.callFake(function (cb) {
            if (cb) cb();
        });
    });

    it('starts on the brand screen', function () {
        expect(module.visible_child).toBe(brand);
    });

    it('shows the brand until timeout has expired and content is ready', function () {
        module.TRANSITION_TIME_MS = 0;
        module.make_ready();
        expect(module.visible_child).toBe(brand);
        Utils.update_gui();
        expect(module.visible_child).toBe(content);
        expect(content.make_ready).toHaveBeenCalled();
    });

    it('shows the brand only once', function () {
        module.TRANSITION_TIME_MS = 0;
        module.make_ready();
        Utils.update_gui();
        expect(module.visible_child).not.toBe(brand);
        module.make_ready();
        expect(module.visible_child).not.toBe(brand);
        Utils.update_gui();
        expect(module.visible_child).not.toBe(brand);
    });

    function does_not_show_brand_page (payload) {
        it('does not show the brand on ' + payload.action_type, function () {
            module.BRAND_PAGE_TIME_MS = 100000;  // must be interrupted!
            module.make_ready();
            dispatcher.dispatch(payload);
            Utils.update_gui();
            expect(module.visible_child).not.toBe(brand);
        });
    }
    does_not_show_brand_page({
        action_type: Actions.DBUS_LOAD_QUERY_CALLED,
        search_terms: 'foo',
        timestamp: 0,
    });
    does_not_show_brand_page({
        action_type: Actions.DBUS_LOAD_ITEM_CALLED,
        id: 'ekn:///1234512345abcdef',
        search_terms: 'foo',
        timestamp: 0,
    });
});
