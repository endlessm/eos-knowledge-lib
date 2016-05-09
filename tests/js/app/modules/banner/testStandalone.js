// Copyright 2016 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

Gtk.init(null);

const Utils = imports.tests.utils;
Utils.register_gresource();

const Actions = imports.app.actions;
const MockDispatcher = imports.tests.mockDispatcher;
const Standalone = imports.app.modules.banner.standalone;

describe('Standalone banner', function () {
    let banner, dispatcher;

    beforeEach(function () {
        dispatcher = MockDispatcher.mock_default();
        banner = new Standalone.Standalone({
            title: 'App Title',
        });
    });

    it('displays the title in its UI somewhere', function () {
        expect(Gtk.test_find_label(banner, '*App Title*')).not.toBeNull();
    });

    it('dispatches when open button clicked', function () {
        banner.emit('response', 1);
        Utils.update_gui();
        expect(dispatcher.last_payload_with_type(Actions.LEAVE_PREVIEW_CLICKED))
            .toEqual(jasmine.any(Object));
    });
});
