const Gtk = imports.gi.Gtk;

const ColoredBox = imports.tests.coloredBox;
const SquareGuysArrangement = imports.app.modules.squareGuysArrangement;

Gtk.init(null);

let win = new Gtk.Window();
let scrolled_win = new Gtk.ScrolledWindow({
    min_content_width: 600,
    min_content_height: 600,
});
let arrangement = new SquareGuysArrangement.SquareGuysArrangement({
    hexpand: false,
    valign: Gtk.Align.START,
    spacing: 8,
    max_rows: 0,
});

for (let i = 0; i < 10; i++) {
    let card = new ColoredBox.ColoredBox({
        expand: true,
    });
    arrangement.add(card);
}

scrolled_win.add(arrangement);
win.add(scrolled_win);
win.connect('destroy', Gtk.main_quit);
win.show_all();
Gtk.main();
