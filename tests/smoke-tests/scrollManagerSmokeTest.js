const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const WebKit2 = imports.gi.WebKit2;

const TEST_APPLICATION_ID = 'com.endlessm.knowledge.test.scrollmanager';

const TestApplication = new Lang.Class({
    Name: 'ScrollManagerTest',
    Extends: Endless.Application,

    vfunc_startup: function () {
        this.parent();
        WebKit2.WebView.prototype.run_javascript_from_gresource_after_load =
            this.run_javascript_from_gresource_after_load;
        let webview = new WebKit2.WebView({
            expand: true
        });

        let label = new Gtk.Label({
            label: 'Scroll somewhere man'
        });
        let button = new Gtk.Button({
            label: 'Click me to go somewhere random!'
        });
        let grid = new Gtk.Grid({
            expand: true,
            orientation: Gtk.Orientation.VERTICAL
        });

        webview.load_uri('file://' + Endless.getCurrentFileDir() + '/../test-content/Brazil.html');

        let sections = [
            'History',
            'Etymology',
            'Geography',
            'Law_and_order',
            // blah blah blah
        ];
        button.connect('clicked', function () {
            let randomIndex = Math.floor(Math.random() * sections.length);
            let randomSelection = sections[randomIndex];
            webview.load_uri(webview.uri.split('#')[0] + '#scroll-to-' + randomSelection);
        });
        
        webview.connect('notify::uri', function () {
            if (webview.uri.indexOf('#') >= 0) {
                var hash = webview.uri.split('#')[1];
                // if we scrolled past something, say so!
                if(hash.indexOf('scrolled-past-') === 0) {
                    label.label = 'You\'re reading: ' + hash.split('scrolled-past-')[1];
                }
            }
        });

        webview.run_javascript_from_gresource_after_load(
                '/com/endlessm/knowledge/smooth_scroll.js', null, null);
        webview.run_javascript_from_gresource_after_load(
                '/com/endlessm/knowledge/scroll_manager.js', null, null);

        let window = new Endless.Window({
            application: this
        });
        grid.add(webview);
        grid.add(label);
        grid.add(button);

        window.page_manager.add(grid);
        window.show_all();
    },

    run_javascript_from_gresource_after_load: function (location, cancellable, callback) {
        this.connect('load-changed', (function (v, status) {
            if(status == WebKit2.LoadEvent.FINISHED) {
                this.run_javascript_from_gresource(location, cancellable, callback);
            }
        }).bind(this));
    },
});

let app = new TestApplication({
    application_id: TEST_APPLICATION_ID,
    flags: 0
});

app.run(ARGV);
