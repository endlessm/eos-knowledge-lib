// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Actions = imports.app.actions;
const Minimal = imports.tests.minimal;
const MockDispatcher = imports.tests.mockDispatcher;

Gtk.init(null);

describe('Scrollable interface', function () {
    let scrollable, dispatcher;

    beforeEach(function () {
        dispatcher = MockDispatcher.mock_default();
        scrollable = new Minimal.MinimalScrollable({
            scroll_server: 'my-server',
        });
        spyOn(scrollable, 'show_more_content');
    });

    it ('Constructs', function () {});

    it('has a minimal implementation', function () {
        expect(scrollable).toBeDefined();
    });

    it('shows more content when scroll server requests it', function () {
        dispatcher.dispatch({
            action_type: Actions.NEED_MORE_CONTENT,
            scroll_server: 'my-server',
        });
        expect(scrollable.show_more_content).toHaveBeenCalled();
    });
});
