const EosKnowledge = imports.gi.EosKnowledge;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Mainloop = imports.mainloop;
const WebKit2 = imports.gi.WebKit2;

const TEST_NAME = 'test evince adapter';
const PDF_PATH = 'tests/test-content/pdf-sample1.pdf';

describe('Evince webview adapter', function () {
    let view, load_changed_handler;

    beforeEach(function () {
        view = new EosKnowledge.EvinceWebviewAdapter();
        load_changed_handler = jasmine.createSpy('load_changed_handler').and.stub();
        view.connect('load-changed', load_changed_handler);
    });

    it('notifies at least that the load started and finished', function () {
        try {
            view.load_uri('nonexistent://uri');
        } catch (e) {
            // May throw, but that is not what's being tested.
        }
        expect(load_changed_handler).toHaveBeenCalledWith(view, WebKit2.LoadEvent.STARTED);
        expect(load_changed_handler).toHaveBeenCalledWith(view, WebKit2.LoadEvent.FINISHED);
    });

    it('loads a real PDF document', function () {
        expect(function () {
            view.load_uri(Gio.File.new_for_path(PDF_PATH).get_uri());
        }).not.toThrow();
    });

    it('notifies that the load started, committed, and finished', function () {
        view.load_uri(Gio.File.new_for_path(PDF_PATH).get_uri());
        expect(load_changed_handler).toHaveBeenCalledWith(view, WebKit2.LoadEvent.STARTED);
        expect(load_changed_handler).toHaveBeenCalledWith(view, WebKit2.LoadEvent.COMMITTED);
        expect(load_changed_handler).toHaveBeenCalledWith(view, WebKit2.LoadEvent.FINISHED);
    });
});
