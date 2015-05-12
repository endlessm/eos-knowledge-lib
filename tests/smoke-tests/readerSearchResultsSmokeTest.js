/* Copyright 2015 Endless Mobile, Inc. */

const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const Card = imports.app.reader.card;
const SearchResultsPage = imports.app.reader.searchResultsPage;

/* We add some reset css code since GtkWindow does not load eos-sdk' reset CSS */
const RESET_CSS = [
    "GtkButton { padding: 0px; background-image: none; }",
    "GtkFlowBoxChild { background: 0px; padding: 0px; }",
    "GtkFrame { border: 0px; }",
    "GtkOverlay { padding: 0px; }",
].join('\n');

let reset_css_provider = new Gtk.CssProvider();
reset_css_provider.load_from_data(RESET_CSS);
Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
    reset_css_provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

let provider = new Gtk.CssProvider();
let css_file = Gio.File.new_for_uri('resource:///com/endlessm/knowledge/endless_reader.css');
provider.load_from_file(css_file);
Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
    provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

let cards = [{
        title: 'Frango',
        synopsis: 'Frango frito',
        style_variant: 0,
        page_number: 3,
    }, {
        title: 'Queijo',
        synopsis: 'Delicia!',
        style_variant: 1,
        archived: true,
    }, {
        title: 'Linguiça',
        synopsis: 'Muito bom!',
        style_variant: 2,
        page_number: 5,
    }, {
        title: 'Abacaxi',
        synopsis: 'Para fazer suco.',
        archived: true,
}].map((props) => {
    props.expand = false;
    props.halign = Gtk.Align.START;
    return new Card.Card(props);
});

let search_results_page = new SearchResultsPage.SearchResultsPage();
search_results_page.append_search_results(cards);

let win = new Gtk.Window({
    default_height: 500,
    default_width: 450,
    title: 'Search Results',
});
win.connect('destroy', Gtk.main_quit);
win.add(search_results_page);

win.show_all();
Gtk.main();
