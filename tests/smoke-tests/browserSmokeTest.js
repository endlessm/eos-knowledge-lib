const EosKnowledge = imports.gi.EosKnowledge;
const Gdk = imports.gi.Gdk;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Pango = imports.gi.Pango;
const WebKit2 = imports.gi.WebKit2;

EosKnowledge.init();

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

const HistoryItem = new Lang.Class({
    Name: 'HistoryItem',
    Extends: GObject.Object,
    Implements: [ EosKnowledge.HistoryItemModel ],
    Properties: {
        'title': GObject.ParamSpec.string('title', 'override', 'override',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            '')
    }
});

// Create objects
let win = new Gtk.Window({
    default_width: 900,
    default_height: 600
});
let bar = new Gtk.HeaderBar({
    show_close_button: true
});
let buttons = new Gtk.Box();
buttons.get_style_context().add_class(Gtk.STYLE_CLASS_LINKED);
let back_button = new Gtk.Button({
    image: Gtk.Image.new_from_icon_name('go-previous-symbolic',
        Gtk.IconSize.SMALL_TOOLBAR)
});
let forward_button = new Gtk.Button({
    image: Gtk.Image.new_from_icon_name('go-next-symbolic',
        Gtk.IconSize.SMALL_TOOLBAR)
});
let page = new EosKnowledge.WebviewSwitcherView({
    transition_duration: 500,
    expand: true
});
let history = new EosKnowledge.HistoryModel();

// Put objects together
buttons.add(back_button);
buttons.add(forward_button);
bar.pack_start(buttons);
win.set_titlebar(bar);
win.add(page);

// Connect signals
win.connect('destroy', Gtk.main_quit);
history.bind_property('can-go-back', back_button, 'sensitive',
    GObject.BindingFlags.SYNC_CREATE);
history.bind_property('can-go-forward', forward_button, 'sensitive',
    GObject.BindingFlags.SYNC_CREATE);

page.connect('decide-navigation-policy', function (page, decision) {
    if (history.current_item.title.indexOf(decision.request.uri) === 0) {
        decision.use();
        return false;
    } else {
        history.current_item = new HistoryItem({ title: decision.request.uri });
        page.load_uri(history.current_item.title, EosKnowledge.LoadingAnimationType.FORWARDS_NAVIGATION);
        decision.ignore();
        return true;  // decision made
    }
});
back_button.connect('clicked', function () {
    history.go_back();
    page.load_uri(history.current_item.title, EosKnowledge.LoadingAnimationType.BACKWARDS_NAVIGATION);
});
forward_button.connect('clicked', function () {
    history.go_forward();
    page.load_uri(history.current_item.title, EosKnowledge.LoadingAnimationType.FORWARDS_NAVIGATION);
});

let wiki_uri = 'http://en.wikipedia.org/wiki/Main_Page';
page.load_uri(wiki_uri, EosKnowledge.LoadingAnimationType.NONE);
history.current_item = new HistoryItem({ title: wiki_uri });

win.show_all();

Gtk.main();
