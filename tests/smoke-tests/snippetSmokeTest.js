const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const ArticleSnippetCard = imports.app.modules.articleSnippetCard;
const ContentObjectModel = imports.search.contentObjectModel;
const SpaceContainer = imports.app.widgets.spaceContainer;

Gtk.init(null);

let win = new Gtk.Window();
let container = new SpaceContainer.SpaceContainer();
let model = new ContentObjectModel.ContentObjectModel({
    title: 'This is a long title about things that will wrap to two lines',
    synopsis: 'Not gonna lie, I do not enjoy the process of developing talks or presenting them. But I do like beer. I like it a lot. And so a week’s worth of work, a quiet hotel room to do that work in, and a flight across the country later a',
});
let card = new ArticleSnippetCard.ArticleSnippetCard({
    model: model 
});


container.add(card);
win.add(container);
win.connect('destroy', Gtk.main_quit);
win.show_all();

Utils.register_gresource();
let provider = new Gtk.CssProvider();
let css_file = Gio.File.new_for_uri('resource:///com/endlessm/knowledge/data/css/endless_reader.css');
provider.load_from_file(css_file);
Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
    provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

Gtk.main();
