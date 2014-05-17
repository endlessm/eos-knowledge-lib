const EosKnowledge = imports.gi.EosKnowledge;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

EosKnowledge.init();

const MockWebview = new Lang.Class({
    Name: 'MockWebview',
    Extends: Gtk.Label,
    Signals: {
        'load-changed': {
            param_types: [ GObject.TYPE_INT /* WebKitLoadEvent */ ]
        }
    },

    // Mimic WebKitLoadEvent enum
    STARTED: 0,
    FINISHED: 3,

    load_uri: function (uri) {
        this.uri = uri;
        GLib.idle_add(GLib.PRIORITY_HIGH_IDLE, function () {
            this.emit('load-changed', this.STARTED);
            GLib.timeout_add(GLib.PRIORITY_DEFAULT, 50 /* ms */, function () {
                this.emit('load-changed', this.FINISHED);
                return false;  // G_SOURCE_REMOVE
            }.bind(this));
            return false;  // G_SOURCE_REMOVE
        }.bind(this));
    }
});

describe('Webview switcher view', function () {
    let switcher;

    beforeEach(function () {
        switcher = new EosKnowledge.WebviewSwitcherView();
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
                currentView = new MockWebview();
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
                switcher.load_uri('baked://beans');
                switcher.load_uri('corn://bread');
                // FIXME: in GTK 3.12, wait for notify::transition-running instead?
                // switcher.connect('notify::transition-running', function () {
                //     if (!switcher.transition_running)
                //         done();
                // });
                setTimeout(done, 500 /* ms */);
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
