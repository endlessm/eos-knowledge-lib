const Endless = imports.gi.Endless;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

const DISCLAIMER_ICON_NORMAL = 'resource://com/endlessm/knowledge/assets/disclaimer_icon_normal.png';
const DISCLAIMER_ICON_HOVER = 'resource://com/endlessm/knowledge/assets/disclaimer_icon_hover.png';
const DISCLAIMER_ICON_ACTIVE = 'resource://com/endlessm/knowledge/assets/disclaimer_icon_pressed.png';

const DisclaimerIcon = new Lang.Class({
    Name: 'DisclaimerIcon',
    Extends: Endless.AssetButton,

    _init: function(props) {
        props.normal_image_uri = DISCLAIMER_ICON_NORMAL;
        props.active_image_uri = DISCLAIMER_ICON_ACTIVE;
        props.prelight_image_uri = DISCLAIMER_ICON_HOVER;
        props.halign = Gtk.Align.END;
        props.valign = Gtk.Align.END;
        this.parent(props);
    }
});
