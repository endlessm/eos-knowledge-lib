const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const HomePage = new Lang.Class({
    Name: 'HomePage',
    Extends: Gtk.Frame, // This is an interface so it shouldn't extend anything

    _init: function (props) {
        this.parent(props);
        let label = new Gtk.Label({
            label: "I'm the home page",
        });
        this.add(label);
    },
});
