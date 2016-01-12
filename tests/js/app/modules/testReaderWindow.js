// Copyright 2015 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Actions = imports.app.actions;
const CssClassMatcher = imports.tests.CssClassMatcher;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;
const Launcher = imports.app.interfaces.launcher;
const Minimal = imports.tests.minimal;
const MockDispatcher = imports.tests.mockDispatcher;
const MockFactory = imports.tests.mockFactory;
const MockWidgets = imports.tests.mockWidgets;
const ReaderWindow = imports.app.modules.readerWindow;

const EXPECTED_TOTAL_PAGES = 17;

describe('Window widget', function () {
    let view, app, factory, dispatcher;

    beforeAll(function (done) {
        // Generate a unique ID for each app instance that we test
        let fake_pid = GLib.random_int();
        let id_string = 'com.endlessm.knowledge.test.dummy' + GLib.get_real_time() + fake_pid;
        app = new Endless.Application({
            application_id: id_string,
            flags: 0,
        });
        app.connect('startup', done);
        app.hold();
        app.run([]);
    });

    afterAll(function () {
        app.release();
    });

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
        dispatcher = MockDispatcher.mock_default();

        factory = new MockFactory.MockFactory();
        factory.add_named_mock('top-bar-search', MockWidgets.MockSearchBox);
        factory.add_named_mock('document-card', Minimal.MinimalDocumentCard);
        factory.add_named_mock('front-page', MockWidgets.MockSidebarTemplate);
        factory.add_named_mock('back-page', Minimal.MinimalBackCover);
        factory.add_named_mock('search-page', Minimal.MinimalPage);
        factory.add_named_mock('standalone-page', Minimal.MinimalBinModule);
        factory.add_named_mock('document-arrangement', Minimal.MinimalArrangement);
        factory.add_named_mock('lightbox', Minimal.MinimalBinModule);
        factory.add_named_mock('navigation', Minimal.MinimalBinModule);
        factory.add_named_mock('window', ReaderWindow.ReaderWindow, {
            'front-page': 'front-page',
            'back-page': 'back-page',
            'search-page': 'search-page',
            'standalone-page': 'standalone-page',
            'document-arrangement': 'document-arrangement',
            'navigation': 'navigation',
            'lightbox': 'lightbox',
            'search': 'top-bar-search',
        });

        view = new ReaderWindow.ReaderWindow({
            application: app,
            factory: factory,
            factory_name: 'window',
        });
        for (let i = 0; i < 15; i++) {
            let a = factory.create_named_module('document-card', {
                info_notice: new Gtk.Label(),
            });
            view.append_article_page(a);
        }
    });

    afterEach(function () {
        view.destroy();
    });

    it('constructs', function () {});

    it('has a standalone-page widget', function () {
        expect(view.standalone_page).toBeA(Gtk.Widget);
    });

    it('has a debug buttons widget', function () {
        expect(view.issue_nav_buttons).toBeA(Gtk.Widget);
    });

    it('contains 16 pages', function () {
        expect(view.total_pages).toMatch(String(EXPECTED_TOTAL_PAGES));
    });

    it('can remove all pages but the done page', function () {
        view.remove_all_article_pages();
        expect(view.total_pages).toBe(2);  // back-cover and overview page remain
    });

    it('throws an error when out of bounds pages are accessed', function () {
        expect(function () {
            view.show_article_page(400, true);
        }).toThrow();
        expect(function () {
            view.show_article_page(2, true);
        }).not.toThrow();
    });

    it('disables back navigation on the overview page', function () {
        let payload = dispatcher.last_payload_with_type(Actions.NAV_BACK_ENABLED_CHANGED);
        expect(payload.enabled).toBe(false);
    });

    it('enables navigation on an article page', function () {
        view.show_article_page(2, true);
        let payload = dispatcher.last_payload_with_type(Actions.NAV_BACK_ENABLED_CHANGED);
        expect(payload.enabled).toBe(true);
        payload = dispatcher.last_payload_with_type(Actions.NAV_FORWARD_ENABLED_CHANGED);
        expect(payload.enabled).toBe(true);
    });

    it('disables navigation on standalone page', function () {
        view.show_in_app_standalone_page();
        let payload = dispatcher.last_payload_with_type(Actions.NAV_BACK_ENABLED_CHANGED);
        expect(payload.enabled).toBe(false);
        payload = dispatcher.last_payload_with_type(Actions.NAV_FORWARD_ENABLED_CHANGED);
        expect(payload.enabled).toBe(false);
    });

    it('sets progress labels correctly', function () {
        let progress_label = new Gtk.Label();
        let a = factory.create_named_module('document-card', {
            info_notice: progress_label,
        });
        view.append_article_page(a);
        expect(progress_label.current_page).toBe(EXPECTED_TOTAL_PAGES);
    });

    it('ensures visible page updates with show_*_page functions', function () {
        view.show_article_page(1);
        expect(view.article_pages_visible()).toBe(true);
        view.show_in_app_standalone_page();
        expect(view.article_pages_visible()).toBe(false);
    });

    // The following three tests are identical to those in testWindow.js.
    // To be removed when merging ReaderWindow and Window.
    it('indicates busy during a search', function () {
        spyOn(view, 'set_busy');
        dispatcher.dispatch({
            action_type: Actions.SEARCH_STARTED,
        });
        expect(view.set_busy).toHaveBeenCalledWith(true);
        dispatcher.dispatch({
            action_type: Actions.SEARCH_READY,
        });
        expect(view.set_busy).toHaveBeenCalledWith(false);
    });

    it('indicates busy during a failed search', function () {
        spyOn(view, 'set_busy');
        dispatcher.dispatch({
            action_type: Actions.SEARCH_STARTED,
        });
        expect(view.set_busy).toHaveBeenCalledWith(true);
        dispatcher.dispatch({
            action_type: Actions.SEARCH_FAILED,
        });
        expect(view.set_busy).toHaveBeenCalledWith(false);
    });

    it('presents itself when the app launches', function () {
        spyOn(view, 'show_all');
        spyOn(view, 'present');
        spyOn(view, 'present_with_time');
        dispatcher.dispatch({
            action_type: Actions.FIRST_LAUNCH,
            timestamp: 0,
            launch_type: Launcher.LaunchType.DESKTOP,
        });
        expect(view.present.calls.any() || view.present_with_time.calls.any()).toBeTruthy();
    });
});
