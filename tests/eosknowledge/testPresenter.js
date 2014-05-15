const EosKnowledge = imports.gi.EosKnowledge;
const Endless = imports.gi.Endless;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;

Gtk.init(null);

const TESTDIR = Endless.getCurrentFileDir() + '/..';

function parse_object_from_path(path) {
    let file = Gio.file_new_for_path(path);
    let [success, data] = file.load_contents(null);
    return JSON.parse(data);
}

describe('Presenter', function () {
    let presenter;
    let view;
    let data;
    let test_app_filename = TESTDIR + '/test-content/got_app.json';

    beforeEach(function (done) {

        data = parse_object_from_path(test_app_filename);

        // Borrowed from jasmine test for WindowA
        // Generate a unique ID for each app instance that we test
        let fake_pid = GLib.random_int();
        // FIXME In this version of GJS there is no Posix module, so fake the PID
        let id_string = 'com.endlessm.knowledge.test.dummy' + GLib.get_real_time() + fake_pid;
        let app = new Endless.Application({
            application_id: id_string,
            flags: 0
        });
        app.connect('startup', function () {
            view = new EosKnowledge.WindowA({
                application: app
            });
            presenter = new EosKnowledge.Presenter({
                view: view
            }, test_app_filename);
            done();
        });

        app.run([]);

    });

    afterEach(function () {
        view.destroy();
    });

    it('can be constructed', function () {});

    it('can set title and subtitle on view from json', function () {
        expect(view.home_page.title).toBe(data['title']);
        expect(view.home_page.subtitle).toBe(data['tagline']);
    });

    it('can set cards on view from json', function () {
        expect(data['sections'].map(function (section) {
            return section['title'];
        })).toEqual(view.home_page.cards.map(function (card) {
            return card.title;
        }));
        
        expect(data['sections'].map(function (section) {
            return section['thumbnail_uri'];
        })).toEqual(view.home_page.cards.map(function (card) {
            return card.thumbnail_uri;
        }));
    });

});
