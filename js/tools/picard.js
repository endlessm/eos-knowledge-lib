const Endless = imports.gi.Endless;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Card = imports.app.interfaces.card;
const ArticleObjectModel = imports.search.articleObjectModel;
const Module = imports.app.interfaces.module;
const ModuleFactory = imports.app.moduleFactory;

const CONTENTDIR = Endless.getCurrentFileDir() + '/js/tools/content/';
const CSSDIR = Endless.getCurrentFileDir() + '/data/css/';

// For those interested in picard's etymology, it goes roughly like this:
// Arrangement smoke test -> Tasteful floral arrangement -> Martha Stewart ->
// Patrick Stewart -> Jean-Luc Picard

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
    Gtk.init(null);

    _load_library_css();
    let provider = new Gtk.CssProvider();
    provider.load_from_data(CSS);
    Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(), provider,
        Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

    build_ui();
    load_arrangement(widgets.arrangement_combo_box.get_active_text() + 'Arrangement', widgets.card_combo_box.get_active_text() + 'Card');
    connect_signals();
    widgets.window.show_all();
    Gtk.main();
}

function _load_library_css () {
    ['endless_knowledge.css', 'buffet_core.css'].forEach((file) => {
        let css_file = Gio.File.new_for_uri('file://' + CSSDIR + file);
        let provider = new Gtk.CssProvider();
        provider.load_from_file(css_file);
        Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
                                                 provider,
                                                 Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
    });
}

function load_arrangement (arrangement_type, card_type) {
    if (widgets.scroll.get_child())
        widgets.scroll.remove(widgets.scroll.get_child());

    widgets.titlebar.title = arrangement_type + ' containing ' + card_type;
    let factory = new ModuleFactory.ModuleFactory({
        app_json: {
            "version": 2,
            "modules": {
                "arrangement": {
                    "type": arrangement_type,
                    "slots": {
                        "card-type": {
                            "type": card_type,
                        },
                    },
                },
            },
        },
    });
    factory.warehouse.register_class('ColorBoxCard', ColorBox);
    widgets.arrangement = factory.create_named_module('arrangement');
    widgets.scroll.add(widgets.arrangement);
    widgets.scroll.show_all();
}

function get_available_module_type(type) {
    let modules_dir = Gio.File.new_for_uri('resource:///com/endlessm/knowledge/js/app/modules');
    let iter = modules_dir.enumerate_children('standard::*',
        Gio.FileQueryInfoFlags.NONE, null);
    let info;
    let arr = [];
    while ((info = iter.next_file(null))) {
        let name = info.get_display_name();
        if (!name.endsWith(type + '.js'))
            continue;
        name = name.replace(new RegExp(type + '\.js$'), '');
        name = name[0].toUpperCase() + name.slice(1);
        arr.push(name);
    }
    return arr;
}

const UNUSED_CARDS = [
    'KnowledgeDocument',
    'ReaderDocument',
    'SetPreview',
    'Media',
];

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

    widgets.card_combo_box = new Gtk.ComboBoxText();
    get_available_module_type('Card').concat(['ColorBox']).filter((name) => {
        return UNUSED_CARDS.indexOf(name) < 0;
    }).forEach((name) => {
        widgets.card_combo_box.append_text(name);
    });
    widgets.card_combo_box.set_active(0);

    widgets.arrangement_combo_box = new Gtk.ComboBoxText();
    get_available_module_type('Arrangement').forEach((name) => {
        widgets.arrangement_combo_box.append_text(name);
    });
    widgets.arrangement_combo_box.set_active(0);

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
    widgets.titlebar.pack_start(widgets.arrangement_combo_box);
    widgets.titlebar.pack_start(widgets.card_combo_box);
    widgets.window.add(widgets.scroll);

    menu_grid.attach(spacing_label, 0, 0, 1, 1);
    menu_grid.attach(widgets.spacing, 1, 0, 1, 1);
    menu_grid.attach(resize_separator, 0, 1, 2, 1);
    menu_grid.attach(resize_label, 0, 2, 2, 1);
    menu_grid.attach(resize_grid, 0, 3, 2, 1);
    widgets.menu.add(menu_grid);
    menu_grid.show_all();  // doesn't get shown automatically
}
const SYNOPSIS = 'Aenean sollicitudin, purus ac \
feugiat fermentum, est nulla finibus enim, vitae \
convallis dui eros ac enim. Proin efficitur sollicitudin \
lectus, nec consequat turpis volutpat quis. Vestibulum \
sagittis ut leo nec ullamcorper. Nullam eget odio a elit \
placerat varius non id dui.';

const IMAGES = ['joffrey.jpg', 'kings_landing.jpg', 'whitewalker.jpg'];

function clear_arrangement () {
    widgets.arrangement.clear();
    widgets.remove_box.sensitive = false;
    widgets.clear.sensitive = false;
}

function change_modules () {
    let models = widgets.arrangement.get_models();
    clear_arrangement();
    load_arrangement(widgets.arrangement_combo_box.get_active_text() + 'Arrangement',
                     widgets.card_combo_box.get_active_text() + 'Card');
    models.forEach((model) => {
        widgets.arrangement.add_model(model);
    });
}

function connect_signals() {
    widgets.window.connect('destroy', Gtk.main_quit);
    widgets.window.connect('configure-event', () => {
        let [width, height] = widgets.window.get_size();
        widgets.titlebar.subtitle = width + 'x' + height;
    });
    widgets.add_box.connect('clicked', () => {
        let model = new ArticleObjectModel.ArticleObjectModel({
            title: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
            synopsis: SYNOPSIS,
            thumbnail_uri: 'file://' + CONTENTDIR + IMAGES[GLib.random_int_range(0, IMAGES.length)],
        });
        widgets.arrangement.add_model(model);
        widgets.remove_box.sensitive = true;
        widgets.clear.sensitive = true;
        widgets.add_box.get_style_context().remove_class('hint');
    });
    widgets.remove_box.connect('clicked', () => {
        let models = widgets.arrangement.get_models();
        if (models.length === 0)
            return;
        if (models.length === 1) {
            widgets.remove_box.sensitive = false;
            widgets.clear.sensitive = false;
        }
        widgets.arrangement.remove_model(models[models.length -1 ]);
    });

    widgets.arrangement_combo_box.connect('changed', change_modules)
    widgets.card_combo_box.connect('changed', change_modules);

    widgets.clear.connect('clicked', clear_arrangement);
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
        'text-halign': GObject.ParamSpec.override('text-halign', Card.Card),
        'sequence': GObject.ParamSpec.override('sequence', Card.Card),
        'context-capitalization': GObject.ParamSpec.override('context-capitalization',
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
