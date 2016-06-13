// Copyright 2016 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const GLib = imports.gi.GLib;

const Actions = imports.app.actions;
const MockDispatcher = imports.tests.mockDispatcher;
const MockFactory = imports.tests.mockFactory;
const Encyclopedia = imports.app.modules.window.encyclopedia;

describe('Window.Encyclopedia', function () {
    let view, app, factory, dispatcher;

    beforeAll(function (done) {
        // Generate a unique ID for each app instance that we test
        let fake_pid = GLib.random_int();
        // FIXME In this version of GJS there is no Posix module, so fake the PID
        let id_string = 'com.endlessm.knowledge.test.dummy' + GLib.get_real_time() + fake_pid;
        app = new Endless.Application({
            application_id: id_string,
            flags: 0
        });
        app.connect('startup', done);
        app.hold();
        app.run([]);
    });

    afterAll(function () {
        app.release();
    });

    beforeEach(function () {
        dispatcher = MockDispatcher.mock_default();
        [view, factory] = MockFactory.setup_tree({
            type: Encyclopedia.Encyclopedia,
            properties: {
                'application': app,
            },
            slots: {
                'pager': { type: null },
            }
        });
    });

    afterEach(function () {
        view.destroy();
    });

    it('disables the home button when in the home page', function () {
        expect(view._home_button).toBeDefined();
        dispatcher.dispatch({ action_type: Actions.SHOW_SEARCH_PAGE });
        expect(view._home_button.sensitive).toBe(true);
        dispatcher.dispatch({ action_type: Actions.SHOW_HOME_PAGE });
        expect(view._home_button.sensitive).toBe(false);
    });

    it('presents itself after the first page is shown', function () {
        spyOn(view, 'show_all');
        spyOn(view, 'present');
        spyOn(view, 'present_with_time');
        dispatcher.dispatch({
            action_type: Actions.PRESENT_WINDOW,
            timestamp: 0,
        });
        expect(view.present).not.toHaveBeenCalled();
        expect(view.present_with_time).not.toHaveBeenCalled();
        dispatcher.dispatch({
            action_type: Actions.SHOW_HOME_PAGE,
        });
        expect(view.present.calls.any() || view.present_with_time.calls.any()).toBeTruthy();
    });
});
