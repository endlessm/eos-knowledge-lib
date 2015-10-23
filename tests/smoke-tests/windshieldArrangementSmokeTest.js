const Gtk = imports.gi.Gtk;

const ColoredBox = imports.tests.coloredBox;
const WindshieldArrangement = imports.app.modules.windshieldArrangement;

Gtk.init(null);

let win = new Gtk.Window();
let arrangement = new WindshieldArrangement.WindshieldArrangement({
    hexpand: true,
    valign: Gtk.Align.START,
    spacing: 0,
});

for (let i = 0; i < 6; i++) {
    let card = new ColoredBox.ColoredBox({
        expand: true,
    });
    arrangement.add_card(card);
}
win.connect('destroy', Gtk.main_quit);
win.add(arrangement);
win.show_all();
Gtk.main();
