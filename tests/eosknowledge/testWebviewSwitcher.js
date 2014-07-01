const EosKnowledge = imports.gi.EosKnowledge;
const Gtk = imports.gi.Gtk;

const MockWebview = imports.MockWebview;

EosKnowledge.init();

describe('Webview switcher view', function () {
    let switcher;

    beforeEach(function () {
        let container = new Gtk.OffscreenWindow();
        switcher = new EosKnowledge.WebviewSwitcherView();
        container.add(switcher);
        container.show_all();
    });

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

        describe('asynchronously', function () {
            beforeEach(function (done) {
                // Wait for two 'display-ready' signals, signifying that each
                // page has finished loading in turn
                let displayReadyCount = 0;
                switcher.connect('display-ready', function () {
                    displayReadyCount++;
                    if(displayReadyCount == 2)
                        done();
                });
                switcher.load_uri('baked://beans');
                switcher.load_uri('corn://bread');
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
    });
});
