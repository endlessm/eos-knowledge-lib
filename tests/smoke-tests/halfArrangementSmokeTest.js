const Gtk = imports.gi.Gtk;

const ColoredBox = imports.tests.coloredBox;
const HalfArrangement = imports.app.modules.halfArrangement;

Gtk.init(null);

let win = new Gtk.Window();
let scrolled_win = new Gtk.ScrolledWindow({
    min_content_width: 600,
    min_content_height: 600,
});
let arrangement = new HalfArrangement.HalfArrangement({
    hexpand: true,
    valign: Gtk.Align.START,
    spacing: 0,
});

for (let i = 0; i < 10; i++) {
    let card = new ColoredBox.ColoredBox({
        expand: true,
    });
    arrangement.add_card(card);
}

scrolled_win.add(arrangement);
win.add(scrolled_win);
win.connect('destroy', Gtk.main_quit);
win.show_all();
Gtk.main();
