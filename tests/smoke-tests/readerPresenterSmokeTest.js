const EosKnowledge = imports.gi.EosKnowledge;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

// Load and register the GResource which has content for this app
let resource = Gio.Resource.load('tests/test-content/test-content.gresource');
resource._register();
let resource_path = Gio.File.new_for_uri('resource:///com/endlessm/thrones');

// Mock out the engine so that we aren't looking for an eos-thrones database
let mock_engine = new EosKnowledge.Engine();
mock_engine.ping = function () {};
mock_engine.get_object_by_id = function () {};
mock_engine.get_objects_by_query = function (domain, query, callback) {
    const OBJECTS = [
        {
            title: 'Article One',
            metadata: {
                author: 'Plward11',
                date: 'September 30, 2014',
            },
            ekn_id: 'about:blank',
        },
        {
            title: 'Article Two',
            metadata: {
                author: 'Ffarfan',
            },
            ekn_id: 'about:blank',
        },
        {
            title: 'Article Three',
            metadata: {
                date: 'September 30, 2014',
            },
            ekn_id: 'about:blank',
        },
    ];
    callback(undefined, OBJECTS.slice(0, query.limit));
};
mock_engine.get_ekn_uri = function () {};

const TestApplication = new Lang.Class({
    Name: 'TestApplication',
    Extends: EosKnowledge.Application,

    _init: function (props) {
        this.parent(props);
    },

    vfunc_startup: function () {
        this.parent();
        let view = new EosKnowledge.Reader.Window({
            application: this,
        });
        let presenter = new EosKnowledge.Reader.Presenter({
            app_file: resource_path.get_child('app.json'),
            engine: mock_engine,
            view: view,
        });
        view.show_all();
    },
});

let app = new TestApplication({
    application_id: 'com.endlessm.knowledge.readerPresenterSmokeTest',
    flags: Gio.ApplicationFlags.FLAGS_NONE,
    resource_file: resource_path,
    css_file: Gio.File.new_for_uri('resource:///com/endlessm/knowledge/endless_reader.css'),
});
app.run(ARGV);
