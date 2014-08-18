const Gdk = imports.gi.Gdk;

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
