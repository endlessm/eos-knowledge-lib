// Copyright 2016 Endless Mobile, Inc.

const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const Actions = imports.app.actions;
const Background = imports.app.modules.background;
const ContentObjectModel = imports.search.contentObjectModel;
const MockDispatcher = imports.tests.mockDispatcher;
const MockFactory = imports.tests.mockFactory;
const Utils = imports.tests.utils;

const TEST_CONTENT_BUILDDIR = Utils.get_test_content_builddir();

Gtk.init(null);

describe('Background Module', function () {
    let module, dispatcher;

    beforeEach(function () {
        dispatcher = MockDispatcher.mock_default();
        let factory = new MockFactory.MockFactory({
            'Background': Background.Background,
        }, {
            type: 'Background',
            slots: {
                'content': {
                    type: 'Content',
                },
            },
        });
        module = factory.create_module_tree();

        let resource = Gio.Resource.load(TEST_CONTENT_BUILDDIR + 'test-content.gresource');
        resource._register();

        spyOn(Gtk.CssProvider.prototype, 'load_from_data');
    });

    it('constructs', function () {
        expect(module).toBeDefined();
    });

    it('listens to the corresponding event', function () {
        let color = /#604C28/;
        let image = 'resource:///com/endlessm/thrones/red_wedding.jpg';
        let model = new ContentObjectModel.ContentObjectModel({
            thumbnail_uri: image,
        });

        dispatcher.dispatch({
            action_type: Actions.FEATURE_ITEM,
            model: model,
        });
        Utils.update_gui();

        expect(Gtk.CssProvider.prototype.load_from_data.calls.mostRecent().args[0]).toMatch(color);
    });

    it('handles models without thumbnail', function () {
        let model = new ContentObjectModel.ContentObjectModel();

        dispatcher.dispatch({
            action_type: Actions.FEATURE_ITEM,
            model: model,
        });
        Utils.update_gui();

        expect(Gtk.CssProvider.prototype.load_from_data).toHaveBeenCalled();
    });
});
