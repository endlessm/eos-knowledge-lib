const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Interaction = imports.interfaces.interaction;

const Mesh = new Lang.Class({
    Name: 'Mesh',
    Extends: Interaction.Interaction,

    PAGE_TYPES: ['home', 'set', 'search_result', 'document', 'media_viewer'],

    _init: function (props) {
        this.parent(props);
    },
});

function create_me(props) {
    return new Mesh(props);
}
