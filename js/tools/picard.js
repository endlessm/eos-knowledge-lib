const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const System = imports.system;

const Card = imports.app.interfaces.card;
const ContentObjectModel = imports.search.contentObjectModel;
const Module = imports.app.interfaces.module;
const Warehouse = imports.app.warehouse;

// For those interested in picard's etymology, it goes roughly like this:
// Arrangement smoke test -> Tasteful floral arrangement -> Martha Stewart ->
// Patrick Stewart -> Jean-Luc Picard

const USAGE = [
    'usage: picard <ArrangementName>',
    '   (e.g. WindshieldArrangement)',
    '',
    'picard is a utility for exploring card containers.',
    '',
    'Here are the available arrangements:',
].join('\n');
const RESOLUTIONS = [[720, 576], [800, 600], [1024, 768], [1280, 800],
    [1920, 1080]];
const COLORS = ['fce94f', 'fcaf3e', 'e9b96e', '8ae234', '729fcf', 'ad7fa8',
    'ef2929', '888a85'];
const SPACING_UNIT = 6;
const DEFAULT_CARD_SPACING = 6;
const MAX_CARD_SPACING = 24;
// A little animation to guide the eye where to click first.
const CSS = '\
@keyframes glow {\
    from { box-shadow: 0px 0px 7px 3px alpha(#729fcf, 0.1),\
                       inset 0px 0px 10px alpha(#729fcf, 0.3); }\
    to { box-shadow: 0px 0px 7px 3px alpha(#729fcf, 0.4),\
                     inset 0px 0px 10px alpha(#729fcf, 0.8); }\
}\
.hint { animation: glow 1s infinite alternate; }';

let widgets = {};

function main() {
    if (ARGV.length < 1) {
        print(USAGE);
        list_available_arrangements();
        System.exit(0);
    }

    Gtk.init(null);

    let provider = new Gtk.CssProvider();
    provider.load_from_data(CSS);
    Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(), provider,
        Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

    let module_name = ARGV.shift() + 'Arrangement';
    let warehouse = new Warehouse.Warehouse();
    let ArrangementClass = warehouse.type_to_class(module_name);
    widgets.arrangement = new ArrangementClass();

    build_ui();
    connect_signals();
    widgets.titlebar.title = module_name;
    widgets.scroll.add(widgets.arrangement);
    widgets.window.show_all();
    Gtk.main();
}

function list_available_arrangements() {
    let modules_dir = Gio.File.new_for_uri('resource:///com/endlessm/knowledge/js/app/modules');
    let iter = modules_dir.enumerate_children('standard::*',
        Gio.FileQueryInfoFlags.NONE, null);
    let info;
    while ((info = iter.next_file(null))) {
        let name = info.get_display_name();
        if (!name.endsWith('Arrangement.js'))
            continue;
        name = name.replace(/Arrangement\.js$/, '');
        name = name[0].toUpperCase() + name.slice(1);
        print('  ' + name);
    }
}

function build_ui() {
    widgets.titlebar = new Gtk.HeaderBar({
        show_close_button: true,
        has_subtitle: true,
    });
    let add_remove = new Gtk.Box({
        orientation: Gtk.Orientation.HORIZONTAL,
    });
    add_remove.get_style_context().add_class(Gtk.STYLE_CLASS_LINKED);
    widgets.add_box = Gtk.Button.new_from_icon_name('list-add-symbolic',
        Gtk.IconSize.BUTTON);
    widgets.add_box.tooltip_text = 'Add a new card to the container';
    widgets.add_box.get_style_context().add_class('hint');
    widgets.remove_box = Gtk.Button.new_from_icon_name('list-remove-symbolic',
        Gtk.IconSize.BUTTON);
    widgets.remove_box.tooltip_text = 'Remove the last added card';
    widgets.remove_box.sensitive = false;
    widgets.clear = Gtk.Button.new_from_icon_name('user-trash-symbolic',
        Gtk.IconSize.BUTTON);
    widgets.clear.tooltip_text = 'Clear away all the cards';
    widgets.clear.sensitive = false;
    widgets.menu = new Gtk.Popover({
        border_width: SPACING_UNIT,
    });
    let menu_grid = new Gtk.Grid({
        row_spacing: SPACING_UNIT,
        column_spacing: SPACING_UNIT,
    });
    let spacing_label = new Gtk.Label({
        label: 'Spacing',
    });
    let spacing_adjustment = new Gtk.Adjustment({
        lower: 0,
        upper: MAX_CARD_SPACING,
        step_increment: 1,
    });
    widgets.spacing = new Gtk.SpinButton({
        adjustment: spacing_adjustment,
        tooltip_text: 'Control the spacing between the cards in pixels',
    });
    widgets.spacing.value = DEFAULT_CARD_SPACING;
    let resize_separator = new Gtk.Separator({
        orientation: Gtk.Orientation.HORIZONTAL,
        margin_top: SPACING_UNIT,
        margin_bottom: SPACING_UNIT,
    });
    let resize_label = new Gtk.Label({
        label: '<b>Resize window</b>',
        use_markup: true,
    });
    let resize_grid = new Gtk.ButtonBox({
        orientation: Gtk.Orientation.VERTICAL,
        halign: Gtk.Align.CENTER,
    });
    resize_grid.get_style_context().add_class(Gtk.STYLE_CLASS_LINKED);
    widgets.resize = RESOLUTIONS.map(res => {
        let [width, height] = res;
        let button = new Gtk.Button({
            label: width + 'x' + height,
            tooltip_text: 'Resize the window to see what it looks like at that resolution',
        });
        resize_grid.add(button);
        return button;
    });
    widgets.hamburger = new Gtk.MenuButton({
        popover: widgets.menu,
        direction: Gtk.ArrowType.NONE,
    });
    widgets.scroll = new Gtk.ScrolledWindow({
        hscrollbar_policy: Gtk.PolicyType.NEVER,
    });
    widgets.window = new Gtk.Window({
        title: 'Picard',
        default_width: RESOLUTIONS[2][0],
        default_height: RESOLUTIONS[2][1],
    });
    widgets.window.set_titlebar(widgets.titlebar);
    add_remove.add(widgets.add_box);
    add_remove.add(widgets.remove_box);
    widgets.titlebar.pack_start(add_remove);
    widgets.titlebar.pack_start(widgets.clear);
    widgets.titlebar.pack_start(widgets.hamburger);
    widgets.window.add(widgets.scroll);

    menu_grid.attach(spacing_label, 0, 0, 1, 1);
    menu_grid.attach(widgets.spacing, 1, 0, 1, 1);
    menu_grid.attach(resize_separator, 0, 1, 2, 1);
    menu_grid.attach(resize_label, 0, 2, 2, 1);
    menu_grid.attach(resize_grid, 0, 3, 2, 1);
    widgets.menu.add(menu_grid);
    menu_grid.show_all();  // doesn't get shown automatically
}

function connect_signals() {
    widgets.window.connect('destroy', Gtk.main_quit);
    widgets.window.connect('configure-event', () => {
        let [width, height] = widgets.window.get_size();
        widgets.titlebar.subtitle = width + 'x' + height;
    });
    widgets.add_box.connect('clicked', () => {
        let box = new ColorBox({
            model: new ContentObjectModel.ContentObjectModel(),
        });
        box.show_all();
        widgets.arrangement.add_card(box);
        widgets.remove_box.sensitive = true;
        widgets.clear.sensitive = true;
        widgets.add_box.get_style_context().remove_class('hint');
    });
    widgets.remove_box.connect('clicked', () => {
        let boxes = widgets.arrangement.get_cards();
        if (boxes.length === 0)
            return;
        if (boxes.length === 1) {
            widgets.remove_box.sensitive = false;
            widgets.clear.sensitive = false;
        }
        widgets.arrangement.remove(boxes[0]);
    });
    widgets.clear.connect('clicked', () => {
        widgets.arrangement.clear();
        widgets.remove_box.sensitive = false;
        widgets.clear.sensitive = false;
    });
    widgets.spacing.bind_property('value', widgets.arrangement, 'spacing',
        GObject.BindingFlags.SYNC_CREATE);
    RESOLUTIONS.forEach((res, ix) => {
        let button = widgets.resize[ix];
        button.connect('clicked', () => {
            widgets.window.resize(res[0], res[1]);
            widgets.menu.hide();
        });
    });
}

function format_card_class(size, use_height=false) {
    if (size <= Card.MaxSize.A)
        return 'A';
    if (size <= Card.MaxSize.B)
        return 'B';
    if (size <= Card.MaxSize.C)
        return 'C';
    if (size <= Card.MaxSize.D)
        return 'D';
    if (size <= Card.MaxSize.E || use_height)
        return 'E';
    if (size <= Card.MaxSize.F)
        return 'F';
    if (size <= Card.MaxSize.G)
        return 'G';
    return 'H';
}

// Colored box used instead of cards for smoke-testing
const ColorBox = new Lang.Class({
    Name: 'ColorBox',
    Extends: Gtk.Frame,
    Implements: [Module.Module, Card.Card],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name',
            Module.Module),
        'model': GObject.ParamSpec.override('model', Card.Card),
        'title-capitalization': GObject.ParamSpec.override('title-capitalization',
            Card.Card),
        'highlight-string': GObject.ParamSpec.override('highlight-string',
            Card.Card),
    },

    _init: function (props={}) {
        props.width_request = Card.MinSize.A;
        props.height_request = Card.MinSize.A;
        props.expand = true;
        this.parent(props);

        let grid = new Gtk.Grid({
            orientation: Gtk.Orientation.VERTICAL,
            halign: Gtk.Align.CENTER,
            valign: Gtk.Align.CENTER,
        });
        this._size_label = new Gtk.Label();
        grid.add(this._size_label);
        this._class_label = new Gtk.Label({
            use_markup: true,
        });
        grid.add(this._class_label);
        this.add(grid);

        let context = this.get_style_context();
        let color = COLORS[GLib.random_int_range(0, COLORS.length)];
        let provider = new Gtk.CssProvider();
        provider.load_from_data('*{background-color:#' + color + ';}');
        context.add_provider(provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

        this.connect_after('size-allocate', () => {
            if (this._idle_id)
                return;
            this._idle_id = GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE,
                this._update_labels.bind(this));
        });
    },

    _update_labels: function () {
        let alloc = this.get_allocation();
        if (alloc.width !== this._width || alloc.height !== this._height) {
            this._width = alloc.width;
            this._height = alloc.height;

            this._size_label.label = alloc.width + 'x' + alloc.height;
            this._class_label.label = '<big><big><b>' +
                format_card_class(alloc.width) +
                format_card_class(alloc.height, true) + '</b></big></big>';
        }

        this._idle_id = 0;
        return GLib.SOURCE_REMOVE;
    },
});
