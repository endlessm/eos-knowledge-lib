const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

imports.searchPath.unshift('.');
const Builder = imports.builder;

const Hello = new Lang.Class({
    Name: 'Hello',
    Extends: Gtk.Window,
    Template: 'resource:///com/endlessm/test/hello.ui.xml',
    InternalChildren: ['main', 'label'],

    _init: function (props={}) {
        props.border_width = 6;
        this.parent(props);
        this.init_template();
        this.add(this._main);
    },

    on_hello_clicked: function () {
        this._label.label = 'Hello World!';
    },

    on_goodbye_clicked: function () {
        this._label.label = 'Goodbye Cruel World!';
    },
});
Builder.bind_template(Hello.prototype);

Gtk.init(null);
Gio.Resource.load('test.gresource')._register();

let win = new Hello();
win.connect('destroy', Gtk.main_quit);
win.show_all();
Gtk.main();
