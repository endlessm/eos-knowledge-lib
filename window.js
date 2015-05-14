const Endless = imports.gi.Endless;
const Lang = imports.lang;

const Window = new Lang.Class({
    Name: 'Window',
    Extends: Endless.Window,

    _init: function (props) {
        this.parent(props);
    },
});
