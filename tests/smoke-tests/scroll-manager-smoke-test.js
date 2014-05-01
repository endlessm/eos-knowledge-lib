const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const WebKit2 = imports.gi.WebKit2;
Gtk.init(null);

const TEST_APPLICATION_ID = 'com.endlessm.knowledge.test.scrollmanager';

// eventually will be an EKN uri
const JQUERY_URI = 'http://ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js';

const TestApplication = new Lang.Class({
    Name: 'ScrollManagerTest',
    Extends: Endless.Application,

    vfunc_startup: function () {
        this.parent();

        let webview = new WebKit2.WebView({
            expand: true
        });

        webview.set_settings(new WebKit2.Settings({
            'enable-write-console-messages-to-stdout': true,
            'enable-developer-extras': true
        }));

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

        webview.run_javascript_from_gresource('/com/endlessm/knowledge/smooth_scroll.js', null, Lang.bind(this, function () {
            webview.run_javascript_from_gresource('/com/endlessm/knowledge/scroll_manager.js', null, null);
        }));

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

        let window = new Endless.Window({
            application: this
        });
        grid.add(webview);
        grid.add(label);
        grid.add(button);

        window.page_manager.add(grid);
        window.show_all();
    }
});

let app = new TestApplication({
    application_id: TEST_APPLICATION_ID,
    flags: 0
});

app.run(ARGV);
