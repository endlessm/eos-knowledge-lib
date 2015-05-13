const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const WIDTH = 400;
const HEIGHT = 200;

const FixedTextView = new Lang.Class({
    Name: 'FixedTextView',
    Extends: Gtk.TextView,

    vfunc_get_preferred_width: function(){
        return [WIDTH, WIDTH];
    },

    vfunc_get_preferred_height: function(){
        return [HEIGHT, HEIGHT];
    }
});
