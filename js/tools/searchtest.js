const QueryObject = imports.search.queryObject;
const Engine = imports.search.engine;
const Gtk = imports.gi.Gtk;

Gtk.init(null);

const BATCH_SIZE = 10;
const DEFAULT_DOMAIN = 'encyclopedia-en';

let win = new Gtk.Window();
let grid = new Gtk.Grid();

let d_textbox = new Gtk.Entry();
let q_textbox = new Gtk.Entry();
let results = new Gtk.TextView();

function query (domain, query_string) {
    clear_results();
    let engine = new Engine.Engine();
    let query_obj = new QueryObject.QueryObject({
        query: query_string,
        limit: BATCH_SIZE,
        domain: domain,
    });
    perform_query(engine, query_obj);
}

function perform_query (engine, query_obj, cb) {
    engine.get_objects_by_query(query_obj, null, (engine, task) => {
        try {
            let [results, more_results] = engine.get_objects_by_query_finish(task);
            results.forEach(function (result) {
                let id = result.ekn_id.split('/').pop();
                print_result(result.title);
            });

            // uncomment to fetch more than a single batch of results
            /*
            if (results.length >= BATCH_SIZE) {
                perform_query(engine, more_results);
            }
            */
        } catch (e) {
            printerr(e);
        }
    });
}

function clear_results () {
    let b = results.get_buffer();
    b.text = '';
}

function print_result (title) {
    let new_text = title + '\n';
    let b = results.get_buffer();
    b.text = b.text += new_text;
}

d_textbox.text = DEFAULT_DOMAIN;
q_textbox.connect('changed', (entry) => {
    query(d_textbox.text, entry.text);
});

grid.attach(d_textbox, 0, 0, 1, 1);
grid.attach(q_textbox, 1, 0, 1, 1);
grid.attach(results, 0, 1, 2, 1);

win.add(grid);
win.show_all();
Gtk.main();
