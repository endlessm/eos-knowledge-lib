const EosKnowledge = imports.gi.EosKnowledge;
const Endless = imports.gi.Endless;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;

EosKnowledge.init();

const TESTDIR = Endless.getCurrentFileDir() + '/..';
// Working directory should be top of the builddir
const TESTBUILDDIR = GLib.get_current_dir() + '/tests';

function parse_object_from_path(path) {
    let file = Gio.file_new_for_uri(path);
    let [success, data] = file.load_contents(null);
    return JSON.parse(data);
}

describe('Presenter', function () {
    let presenter;
    let view;
    let data;
    let test_app_filename = 'file://' + TESTDIR + '/test-content/app.json';

    beforeEach(function (done) {

        data = parse_object_from_path(test_app_filename);

        // Load and register the GResource which has content for this app
        let resource = Gio.Resource.load(TESTBUILDDIR + '/test-content/test-content.gresource');
        resource._register();

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

    it('can set title image on view from json', function () {
        expect(view.home_page.title_image_uri).toBe(data['titleImageURI']);
    });

    it('can set cards on view from json', function () {
        expect(data['sections'].map(function (section) {
            return section['title'];
        })).toEqual(view.home_page.cards.map(function (card) {
            return card.title;
        }));
        
        expect(data['sections'].map(function (section) {
            return section['thumbnailURI'];
        })).toEqual(view.home_page.cards.map(function (card) {
            return card.thumbnail_uri;
        }));
    });

});
