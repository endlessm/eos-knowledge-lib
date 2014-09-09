const EosKnowledge = imports.gi.EosKnowledge;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const MockWebview = imports.MockWebview;

describe('Webview switcher view', function () {
    let switcher;

    beforeEach(function () {
        let container = new Gtk.OffscreenWindow();
        switcher = new EosKnowledge.WebviewSwitcherView();
        container.add(switcher);
        container.show_all();
    });

    function switcher_setup (switcher, done, count) {
        // Wait for {count} 'display-ready' signals, signifying that each page
        // has finished loading in turn.
        let displayReadyCount = 0;
        switcher.connect('display-ready', function () {
            displayReadyCount++;
            if (displayReadyCount === count)
                done();
        });
    }

    it('creates a default webview if signal not connected', function () {
        // FIXME: remove leading underscore from _on_create_webivew. See
        // comments in webviewSwitcherView.js.
        spyOn(switcher, '_on_create_webview').and.callThrough();
        expect(function () {
            switcher.load_uri('about:blank');
        }).not.toThrow();
        expect(switcher._on_create_webview).toHaveBeenCalled();
    });

    describe('with mock webview', function () {
        let createWebview, currentView, previousView;

        beforeEach(function() {
            createWebview = jasmine.createSpy('createWebview').and.callFake(function () {
                previousView = currentView;
                currentView = new MockWebview.MockWebview();
                return currentView;
            });
            switcher.connect('create-webview', createWebview);
        });

        it('does not call the default create-webview signal handler', function () {
            spyOn(switcher, 'on_create_webview').and.callThrough();
            switcher.load_uri('baked://beans');
            expect(switcher.on_create_webview).not.toHaveBeenCalled();
        });

        it('opens with a blank widget', function () {
            expect(createWebview).not.toHaveBeenCalled();
        });

        it('creates a new webview when a page is loaded', function () {
            switcher.load_uri('baked://beans');
            expect(createWebview).toHaveBeenCalled();
        });

        describe('asynchronously with animation', function () {
            beforeEach(function (done) {
                switcher_setup(switcher, done, 2);
                switcher.load_uri('baked://beans', EosKnowledge.LoadingAnimationType.NONE);
                switcher.load_uri('corn://bread', EosKnowledge.LoadingAnimationType.FORWARDS_NAVIGATION);
            });

            xit('shows the new webview when a page is loaded', function (done) {
                // visible_child only works if the whole thing is visible.
                expect(switcher.visible_child).toBe(currentView);
                done();
            });

            it('loads the requested page into the new webview', function (done) {
                expect(currentView.uri).toEqual('corn://bread');
                done();
            });

            it('removes the old webview when a new page is loaded', function (done) {
                expect(previousView.uri).toEqual('baked://beans');
                expect(previousView.get_parent()).toBe(null);
                done();
            });
        });
        describe('asynchronously without animation', function () {
            beforeEach(function (done) {
                switcher_setup(switcher, done, 2)
                switcher.load_uri('baked://beans', EosKnowledge.LoadingAnimationType.NONE);
                switcher.load_uri('corn://bread', EosKnowledge.LoadingAnimationType.NONE);
            });

            it('loads the requested page into the new webview', function (done) {
                expect(currentView.uri).toEqual('corn://bread');
                done();
            });
        });
    });

    describe('create-view-for-file with mock webview', function () {
        let createViewForFile, currentView, previousView;

        beforeEach(function() {
            createViewForFile = jasmine.createSpy('createViewForFile').and.callFake(function () {
                previousView = currentView;
                currentView = new MockWebview.MockWebview();
                return currentView;
            });
            switcher.connect('create-view-for-file', createViewForFile);
        });

        it('opens with a blank widget', function () {
            expect(createViewForFile).not.toHaveBeenCalled();
        });

        it('creates a new view for the requested URI when a page is loaded', function () {
            switcher.load_uri('baked://beans');
            expect(createViewForFile.calls.count()).toEqual(1);
            expect(createViewForFile.calls.argsFor(0)[1].get_uri()).toEqual(Gio.File.new_for_uri('baked://beans').get_uri());
        });

        describe('asynchronously with animation', function () {
            beforeEach(function (done) {
                switcher_setup(switcher, done, 2);
                switcher.load_uri('baked://beans', EosKnowledge.LoadingAnimationType.NONE);
                switcher.load_uri('corn://bread', EosKnowledge.LoadingAnimationType.FORWARDS_NAVIGATION);
            });

            xit('shows the new webview when a page is loaded', function (done) {
                // FIXME: We should be testing this, but currently don't know
                // how. visible_child only works if the whole thing is visible.
                expect(switcher.visible_child).toBe(currentView);
                done();
            });

            it('loads the requested page into the new webview', function (done) {
                expect(currentView.uri).toEqual('corn://bread');
                done();
            });

            it('removes the old webview when a new page is loaded', function (done) {
                expect(previousView.uri).toEqual('baked://beans');
                expect(previousView.get_parent()).toBe(null);
                done();
            });
        });

        describe('asynchronously without animation', function () {
            beforeEach(function (done) {
                switcher_setup(switcher, done, 2);
                switcher.load_uri('baked://beans', EosKnowledge.LoadingAnimationType.NONE);
                switcher.load_uri('corn://bread', EosKnowledge.LoadingAnimationType.NONE);
            });

            it('loads the requested page into the new webview', function (done) {
                expect(currentView.uri).toEqual('corn://bread');
                done();
            });
        });
    });
});
