const Gdk = imports.gi.Gdk;
const Gtk = imports.gi.Gtk;

/* Not part of public API. Changes @widget's GdkWindow to have the 'hand' cursor
indicating a clickable UI element. */
function set_hand_cursor_on_widget(widget) {
    widget.add_events(Gdk.EventMask.ENTER_NOTIFY_MASK |
        Gdk.EventMask.LEAVE_NOTIFY_MASK);

    widget.connect('enter-notify-event', function (widget) {
        let cursor = Gdk.Cursor.new_for_display(Gdk.Display.get_default(),
            Gdk.CursorType.HAND1);
        widget.window.set_cursor(cursor);
    });
    widget.connect('leave-notify-event', function (widget) {
        widget.window.set_cursor(null);
    });
}

/* Helper function to load a JSON object from a file */
function parse_object_from_file (file) {
    try {
        let [success, data] = file.load_contents(null);
        return JSON.parse(data);
    } catch(e) {
        printerr(e);
        printerr(e.stack);
    }
    return null;
}

/* Helper add a new css provider to the default screen object */
function add_css_provider_from_file (file, priority) {
    let provider = new Gtk.CssProvider();
    provider.load_from_file(file);
    Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
            provider, priority);
}
