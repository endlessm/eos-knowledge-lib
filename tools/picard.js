const {DModel, Gdk, Gio, GLib, GObject, Gtk} = imports.gi;
const Lang = imports.lang;

const Card = imports.app.interfaces.card;
const Knowledge = imports.app.knowledge;
const Module = imports.app.interfaces.module;
const ModuleFactory = imports.app.moduleFactory;
const ReadingHistoryModel = imports.app.readingHistoryModel;
const Selection = imports.app.modules.selection.selection;
const SetMap = imports.app.setMap;
const Utils = imports.app.utils;
const {View} = imports.app.interfaces.view;

// Patch in a reading history model that works without a GApplication.
const DummyReadingHistoryModel = new Knowledge.Class({
    Name: 'DummyReadingHistoryModel',
    Signals: {
        'changed': {},
    },
    Extends: GObject.Object,

    mark_article_read: function () { },
    is_read_article: function () { return false; },
    get_read_articles: function () { return []; },
});
let picard_reading_history = new DummyReadingHistoryModel();
ReadingHistoryModel.get_default = function () { return picard_reading_history; };

const PicardSelection = new Module.Class({
    Name: 'PicardSelection',
    Extends: Selection.Selection,

    _init: function (props={}) {
        this.parent(props);
        this._models = [];
    },

    add: function (model) {
        this._models.push(model);
        this.emit('models-changed');
    },

    remove: function () {
        this._models.pop();
        this.emit('models-changed');
    },

    clear: function () {
        this._models = [];
        this.emit('models-changed');
    },

    get_models: function () {
        return this._models;
    },
});


const IMAGES_DIR = 'resource:///com/endlessm/knowledge/data/images/tools/';
const CSS_DIR = 'resource:///com/endlessm/knowledge/data/css/';

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

const OBJECT_MODEL_TYPE = ['Article', 'Video', 'Audio'];

// A little animation to guide the eye where to click first.
const CSS = '\
@keyframes glow {\
    from { box-shadow: 0px 0px 7px 3px alpha(#729fcf, 0.1),\
                       inset 0px 0px 10px alpha(#729fcf, 0.3); }\
    to { box-shadow: 0px 0px 7px 3px alpha(#729fcf, 0.4),\
                     inset 0px 0px 10px alpha(#729fcf, 0.8); }\
}\
.hint { animation: glow 1s infinite alternate; }\
EosWindow { background-color: lightgray; }'

let widgets = {};

function main () {
    Gtk.init(null);
    let base_theme_uri = 'resource:///com/endlessm/sdk/css/endless-widgets.css';
    [base_theme_uri, CSS_DIR + 'picard.css', CSS_DIR + 'default.css']
    .map(uri => Gio.File.new_for_uri(uri))
    .forEach(file => {
        Utils.add_css_provider_from_file(file, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
    });

    let provider = new Gtk.CssProvider();
    provider.load_from_data(CSS);
    Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(), provider,
        Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

    Gtk.IconTheme.get_default().add_resource_path('/com/endlessm/knowledge/data/icons');

    build_ui();
    load_arrangement(widgets.arrangement_combo_box.get_active_text(), widgets.card_combo_box.get_active_text());
    connect_signals();
    widgets.window.show_all();
    Gtk.main();
}

function load_arrangement (arrangement_type, card_type) {
    if (widgets.scroll.get_child())
        widgets.scroll.remove(widgets.scroll.get_child());

    widgets.titlebar.title = arrangement_type + ' containing ' + card_type;
    let factory = new ModuleFactory.ModuleFactory({
        app_json: {
            "version": 2,
            "root": {
                "type": 'ContentGroup.ContentGroup',
                "slots": {
                    "arrangement": {
                        "type": arrangement_type,
                        "slots": {
                            "card": {
                                "type": card_type,
                            },
                        },
                    },
                    "selection": {
                        "type": 'PicardSelection',
                    },
                },
            },
        },
    });
    factory.warehouse.register_class('ColorBoxCard', ColorBox);
    factory.warehouse.register_class('PicardSelection', PicardSelection);
    widgets.content_group = factory.create_root_module();
    widgets.selection = widgets.content_group.get_selection();

    widgets.scroll.add(widgets.content_group);
    widgets.scroll.show_all();
}

function get_available_modules_for_type (type) {
    let modules_dir = Gio.File.new_for_uri('resource:///com/endlessm/knowledge/js/app/modules/' + type.toLowerCase());
    let iter = modules_dir.enumerate_children('standard::*',
        Gio.FileQueryInfoFlags.NONE, null);
    let info;
    let arr = [];
    while ((info = iter.next_file(null))) {
        let name = info.get_display_name();
        if (!name.endsWith('.js'))
            continue;
        arr.push(type + '.' + name[0].toUpperCase() + name.slice(1, -3)); // remove .js extension
    }
    return arr;
}

function get_dimensions_menu () {
    widgets.dimension_menu = new Gtk.Popover({
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
    });
    resize_separator.get_style_context().add_class('resize-separator');
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

    menu_grid.attach(spacing_label, 0, 0, 1, 1);
    menu_grid.attach(widgets.spacing, 1, 0, 1, 1);
    menu_grid.attach(resize_separator, 0, 1, 2, 1);
    menu_grid.attach(resize_label, 0, 2, 2, 1);
    menu_grid.attach(resize_grid, 0, 3, 2, 1);

    widgets.dimension_menu.add(menu_grid);
    menu_grid.show_all();
    return widgets.dimension_menu;
}

function get_module_menu () {
    let menu = new Gtk.Popover({
        border_width: SPACING_UNIT,
    });

    let menu_grid = new Gtk.Grid({
        orientation: Gtk.Orientation.VERTICAL,
        row_spacing: 2 * SPACING_UNIT,
    });

    widgets.card_combo_box = new Gtk.ComboBoxText();

    let card_types = get_available_modules_for_type('Card').sort()
        .filter(name => name !== 'Card.ContentGroup');
    card_types.unshift('ColorBoxCard');
    card_types.forEach((name) => widgets.card_combo_box.append_text(name));

    widgets.card_combo_box.set_active(0);

    widgets.arrangement_combo_box = new Gtk.ComboBoxText();
    get_available_modules_for_type('Arrangement')
    .sort()
    .forEach((name) => widgets.arrangement_combo_box.append_text(name));

    widgets.object_model_combo_box = new Gtk.ComboBoxText();
    OBJECT_MODEL_TYPE.forEach((name) => widgets.object_model_combo_box.append_text(name));
    widgets.object_model_combo_box.set_active(0);

    widgets.arrangement_combo_box.set_active(0);
    menu_grid.add(widgets.card_combo_box);
    menu_grid.add(widgets.arrangement_combo_box);
    menu_grid.add(widgets.object_model_combo_box);
    menu.add(menu_grid);
    menu_grid.show_all();
    return menu;
}

// Our sdk theme only resets widgets inside a window will css name EosWindow. We
// will take advantage of that to make an adwaita themed topbar with endless
// themed widgets inside.
const ResetThemeBox = new Lang.Class({
    Name: 'ResetTheme',
    Extends: Gtk.Box,
    CssName: 'EosWindow',
});

function build_ui () {
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

    let icon = Gtk.Image.new_from_icon_name('zoom-fit-best-symbolic',
                                                Gtk.IconSize.BUTTON);
    widgets.hamburger = new Gtk.MenuButton({
        popover: get_dimensions_menu(),
        direction: Gtk.ArrowType.NONE,
        image: icon,
    });

    widgets.module_selection = new Gtk.MenuButton({
        popover: get_module_menu(),
        direction: Gtk.ArrowType.NONE,
    });

    widgets.scroll = new Gtk.ScrolledWindow({
        hscrollbar_policy: Gtk.PolicyType.NEVER,
        expand: true,
    });
    widgets.window = new Gtk.Window({
        title: 'Picard',
        default_width: RESOLUTIONS[2][0],
        default_height: RESOLUTIONS[2][1],
    });
    // Add the .WindowSimple class so we get styling on the scrollbars
    widgets.window.get_style_context().add_class('WindowSimple');
    widgets.reset_theme_box = new ResetThemeBox();
    widgets.window.set_titlebar(widgets.titlebar);
    add_remove.add(widgets.add_box);
    add_remove.add(widgets.remove_box);
    widgets.titlebar.pack_start(add_remove);
    widgets.titlebar.pack_start(widgets.clear);
    widgets.titlebar.pack_end(widgets.hamburger);
    widgets.titlebar.pack_start(widgets.module_selection);
    widgets.window.add(widgets.reset_theme_box);
    widgets.reset_theme_box.add(widgets.scroll);
 }

const ARTICLE_SYNOPSIS = 'Aenean sollicitudin, purus ac \
feugiat fermentum, est nulla finibus enim, vitae \
convallis dui eros ac enim. Proin efficitur sollicitudin \
lectus, nec consequat turpis volutpat quis. Vestibulum \
sagittis ut leo nec ullamcorper. Nullam eget odio a elit \
placerat varius non id dui.';

const ARTICLE_TITLE = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';

// These images are all in public domain and were retrieved from
// http://publicdomainarchive.com
const ARTICLE_IMAGES = ['people.jpg', 'food.jpg', 'forest.jpg', 'silverbars.jpg'];

function clear_arrangement () {
    widgets.selection.clear();
    widgets.remove_box.sensitive = widgets.clear.sensitive = false;
}

function change_modules () {
    let models = widgets.selection.get_models();
    clear_arrangement();
    load_arrangement(widgets.arrangement_combo_box.get_active_text(),
        widgets.card_combo_box.get_active_text());
    models.forEach((model) => widgets.selection.add(model));

    // since clearing the arrangement above set it to false
    if (models.length > 0)
        widgets.clear.sensitive = widgets.remove_box.sensitive = true;
}

function change_models () {
    let object_model = widgets.object_model_combo_box.get_active_text();
    let models = widgets.selection.get_models();
    clear_arrangement();
    load_arrangement(widgets.arrangement_combo_box.get_active_text(),
        widgets.card_combo_box.get_active_text());
    models.forEach((model) => {
        let new_model = new DModel[object_model]({
            title: model.title,
            synopsis: model.synopsis,
            thumbnail_uri: model.thumbnail_uri,
            tags: model.tags,
        });
        widgets.selection.add(new_model);
    });

    // since clearing the arrangement above set it to false
    if (models.length > 0)
        widgets.clear.sensitive = widgets.remove_box.sensitive = true;
}


function connect_signals () {
    widgets.window.connect('destroy', () => Gtk.main_quit());
    widgets.window.connect('configure-event', () => {
        let [width, height] = widgets.window.get_size();
        widgets.titlebar.subtitle = width + 'x' + height;
    });

    let data = [
        {
            id: '1',
            title: 'Westeros',
            child_tags: ['Westeros'],
        },
        {
            id: '2',
            title: 'A Song of Ice and Fire',
            child_tags: ['A Song of Ice and Fire'],
        },
        {
            id: '3',
            title: 'House Lannister',
            child_tags: ['House Lannister'],
        },
    ];
    let sets = data.map(props => new DModel.Set(props));
    SetMap.init_map_with_models(sets);

    widgets.add_box.connect('clicked', () => {
        let object_model = widgets.object_model_combo_box.get_active_text();
        let model = new DModel[object_model]({
            title: ARTICLE_TITLE,
            synopsis: ARTICLE_SYNOPSIS,
            thumbnail_uri: IMAGES_DIR + ARTICLE_IMAGES[GLib.random_int_range(0, ARTICLE_IMAGES.length - 1)],
            tags: ['Westeros', 'A Song of Ice and Fire', 'Dragons'],
        });
        widgets.selection.add(model);
        widgets.remove_box.sensitive = true;
        widgets.clear.sensitive = true;
        widgets.add_box.get_style_context().remove_class('hint');
    });
    widgets.remove_box.connect('clicked', () => {
        let models = widgets.selection.get_models();
        if (models.length === 0)
            return;
        if (models.length === 1) {
            widgets.remove_box.sensitive = false;
            widgets.clear.sensitive = false;
        }
        widgets.selection.remove();
    });

    widgets.arrangement_combo_box.connect('changed', change_modules);
    widgets.card_combo_box.connect('changed', change_modules);
    widgets.object_model_combo_box.connect('changed', change_models);

    RESOLUTIONS.forEach((res, ix) => {
        let button = widgets.resize[ix];
        button.connect('clicked', () => {
            widgets.window.resize(res[0], res[1]);
            widgets.dimension_menu.hide();
        });
    });

    widgets.clear.connect('clicked', clear_arrangement);
}

function format_card_class (size, use_height=false) {
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
const ColorBox = new Module.Class({
    Name: 'ColorBox',
    Extends: Gtk.Frame,
    Implements: [View, Card.Card],

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
