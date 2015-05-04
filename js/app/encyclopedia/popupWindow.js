const Gettext = imports.gettext;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Config = imports.app.config;
// This class allows us to have a fixed size text view
// Bypasses bug in GtkTextView which causes it to resize
// when it gets clicked
const FixedTextView = imports.app.encyclopedia.fixedTextView;

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

const WIKI_DISCLAIMER = _("Wikipedia and its associated marks are official trademarks of the Wikimedia Foundation in the United States and other countries. These marks are being used under license by the Wikimedia Foundation. Endless is not endorsed by or affiliated with the Wikimedia Foundation.");

const PopupWindow = new Lang.Class({
    Name: 'PopupWindow',
    GTypeName: 'PopupWindow',
    Extends: Gtk.EventBox,

    Signals: {
        'close-me': {}
    },

    _init: function(props) {
        this.parent(props);

        let grid = new Gtk.Grid({
            orientation: Gtk.Orientation.HORIZONTAL,
            valign: Gtk.Align.CENTER,
            halign: Gtk.Align.CENTER
        });

        this.add(grid);
        let frame = new Gtk.Frame({
            halign: Gtk.Align.CENTER,
            valign: Gtk.Align.CENTER
        });
        // Need to use a text view because label does not
        // allow us to change the line-height (pixels_inside_wrap)
        let view = new FixedTextView.FixedTextView({
            sensitive: false,
            editable: false,
            cursor_visible: false,
            margin: 40,
            pixels_inside_wrap: 10,
            wrap_mode: Gtk.WrapMode.WORD
        });
        view.buffer.set_text(WIKI_DISCLAIMER, -1);

        frame.add(view);
        grid.add(frame);
        let close_button = new Gtk.Button({ valign: Gtk.Align.START });
        let close_image = Gtk.Image.new_from_icon_name('window-close-symbolic',
            Gtk.IconSize.BUTTON);
        close_button.add(close_image);
        grid.add(close_button);

        // Ask parent to close when close button clicked
        close_button.connect('clicked', Lang.bind(this, function () {
            this.emit('close-me');
        }));
    }
});
