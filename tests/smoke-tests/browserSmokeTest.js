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
history.connect('notify::current-item', function (history) {
    page.load_uri(history.current_item.title);
});
page.connect('decide-navigation-policy', function (page, decision) {
    page.navigate_forwards = true;
    history.current_item = new HistoryItem({ title: decision.request.uri });
    decision.ignore();
    return true;  // decision made
});
back_button.connect('clicked', function () {
    page.navigate_forwards = false;
    history.go_back();
});
forward_button.connect('clicked', function () {
    page.navigate_forwards = true;
    history.go_forward();
});

// Setup app
history.current_item = new HistoryItem({
    title: 'http://en.wikipedia.org/wiki/Main_Page'
});
win.show_all();

Gtk.main();
