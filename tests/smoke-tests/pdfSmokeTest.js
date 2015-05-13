const EvinceDocument = imports.gi.EvinceDocument;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const WebKit2 = imports.gi.WebKit2;

const EvinceWebviewAdapter = imports.app.evinceWebviewAdapter;
const WebviewSwitcherView = imports.app.webviewSwitcherView;

// Create objects
let win = new Gtk.Window({
    default_width: 500,
    default_height: 500
});
let bar = new Gtk.HeaderBar({
    show_close_button: true
});
let buttons = new Gtk.Box();
buttons.get_style_context().add_class(Gtk.STYLE_CLASS_LINKED);
let button1 = new Gtk.Button({
    label: 'PDF 1'
});
let button2 = new Gtk.Button({
    label: 'PDF 2'
});
let button3 = new Gtk.Button({
    label: 'HTML 1'
});
let combo = new Gtk.ComboBoxText();
// added in order so that the index of each item is a value of
// EosKnowledge.LoadingAnimationType
combo.append_text('No animation');
combo.append_text('Forwards');
combo.append_text('Backwards');
combo.active = 0;
let page = new WebviewSwitcherView.WebviewSwitcherView({
    transition_duration: 500,
    expand: true
});
let file1 = Gio.File.new_for_path('tests/test-content/pdf-sample1.pdf');
let file2 = Gio.File.new_for_path('tests/test-content/pdf-sample2.pdf');
let file3 = Gio.File.new_for_path('tests/test-content/Brazil.html');

// Put objects together
buttons.add(button1);
buttons.add(button2);
buttons.add(button3);
bar.pack_start(buttons);
bar.pack_start(combo);
win.set_titlebar(bar);
win.add(page);

function button_clicked(file) {
    page.load_uri(file.get_uri(), combo.active);
}

// Connect signals
win.connect('destroy', Gtk.main_quit);
page.connect('create-view-for-file', function (page, file) {
    let mime_type = EvinceDocument.file_get_mime_type(file.get_uri(),
        false /* don't use fast MIME type detection */);
    if (mime_type === 'text/html')
        return new WebKit2.WebView();
    return new EvinceWebviewAdapter.EvinceWebviewAdapter();
});
button1.connect('clicked', button_clicked.bind(undefined, file1));
button2.connect('clicked', button_clicked.bind(undefined, file2));
button3.connect('clicked', button_clicked.bind(undefined, file3));

// Setup app
win.show_all();

Gtk.main();
