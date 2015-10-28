const Gtk = imports.gi.Gtk;

const ColoredBox = imports.tests.coloredBox;
const SquareGuysArrangement = imports.app.modules.squareGuysArrangement;

Gtk.init(null);

let win = new Gtk.Window();
let arrangement = new SquareGuysArrangement.SquareGuysArrangement({
    hexpand: false,
    valign: Gtk.Align.START,
    spacing: 8,
});

for (let i = 0; i < 10; i++) {
    let card = new ColoredBox.ColoredBox({
        expand: true,
    });
    arrangement.add(card);
}

win.connect('destroy', Gtk.main_quit);
win.add(arrangement);
win.show_all();
Gtk.main();
