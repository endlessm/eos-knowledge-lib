// Copyright 2014 Endless Mobile, Inc.

const Gettext = imports.gettext;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Config = imports.app.config;
const HomePage = imports.app.homePage;
const Module = imports.app.interfaces.module;
const SpaceContainer = imports.app.spaceContainer;
const StyleClasses = imports.app.styleClasses;
const TabButton = imports.app.tabButton;

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

const BUTTON_TRANSITION_DURATION = 500;
const MAX_CARDS = 6;
const CARD_EXTRA_MARGIN = 8;

/**
 * Class: HomePageA
 *
 * This represents the home page for template A of the knowledge apps.
 * It extends <HomePage> and has a title image and list of article cards to show
 *
 */
const HomePageA = new Lang.Class({
    Name: 'HomePageA',
    GTypeName: 'EknHomePageA',
    Extends: Gtk.Grid,
    // FIXME: HomePageA isn't a Module yet, but needs to implement it in order
    // to implement HomePage
    Implements: [ Module.Module, HomePage.HomePage ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'search-box': GObject.ParamSpec.override('search-box',
            HomePage.HomePage),
        'animating': GObject.ParamSpec.boolean('animating',
            'Animating', 'Set true if this page is animating and should hide its show all button',
            GObject.ParamFlags.READWRITE, false),
        /**
         * Property: tab-button
         *
         * The <TabButton> widget created by this widget. Read-only,
         * modify using the <TabButton> API.
         */
        'tab-button': GObject.ParamSpec.object('tab-button', 'Tab button',
            'The button to show all categories on this page.',
            GObject.ParamFlags.READABLE,
            TabButton.TabButton),
    },

    _init: function (props) {
        this._card_container = new SpaceContainer.SpaceContainer({
            halign: Gtk.Align.CENTER,
            valign: Gtk.Align.CENTER,
            expand: true,
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: CARD_EXTRA_MARGIN,
        });
        this._card_container.get_style_context().add_class(StyleClasses.CARD_CONTAINER);

        this._button_stack = new Gtk.Stack({
            transition_duration: BUTTON_TRANSITION_DURATION
        });

        this._invisible_frame = new Gtk.Frame();

        this.tab_button = new TabButton.TabButton({
            position: Gtk.PositionType.BOTTOM,
            label: _("SEE ALL CATEGORIES")
        });

        this._animating = false;
        this.tab_button.connect('clicked', function () {
            this._hide_button();
            let id = this._button_stack.connect('notify::transition-running', function () {
                if (!this._button_stack.transition_running && this._button_stack.visible_child != this.tab_button) {
                    this.emit('show-categories');
                }
                this._button_stack.disconnect(id);
            }.bind(this));
        }.bind(this));
        this._card_container.connect('notify::all-visible',
            this._update_button_visibility.bind(this));

        this._button_stack.add(this._invisible_frame);
        this._button_stack.add(this.tab_button);

        this._cards = null;

        this.parent(props);

        this.search_box = this.factory.create_named_module('home-search');
        this._app_banner = this.factory.create_named_module('app-banner');

        this.get_style_context().add_class(StyleClasses.HOME_PAGE);

        this.connect_signals();

        this.pack_widgets(this._app_banner, this.search_box);
        this.show_all();

        this._got_extra_cards = false;

        this.get_style_context().add_class(StyleClasses.HOME_PAGE_A);
    },

    get animating () {
        return this._animating;
    },

    set animating (v) {
        if (v === this._animating)
            return;
        this._animating = v;
        this._update_button_visibility();
        this.notify('animating');
    },

    get cards() {
        return this._cards;
    },

    set cards(v) {
        if (this._cards === v)
            return;
        this._cards = v;
        if (this._cards === null) {
            this.pack_cards([]);
        } else {
            this.pack_cards(this._cards);
        }
    },

    _update_button_visibility: function () {
        if (this._got_extra_cards || (!this._card_container.all_visible && !this._animating && this.get_mapped())) {
            this._show_button();
        } else {
            this._hide_button();
        }
    },

    _hide_button: function (widget) {
        this._button_stack.transition_type = Gtk.StackTransitionType.SLIDE_DOWN;
        this._button_stack.visible_child = this._invisible_frame;
    },

    _show_button: function () {
        this._button_stack.transition_type = Gtk.StackTransitionType.SLIDE_UP;
        this._button_stack.visible_child = this.tab_button;
    },

    _SEARCH_BOX_WIDTH: 400,
    pack_widgets: function (title_image, search_box) {
        title_image.margin_top = 8;
        title_image.margin_bottom = 30;

        let inner_grid = new Gtk.Grid({
            halign: Gtk.Align.CENTER,
            valign: Gtk.Align.END,
            expand: true,
            orientation: Gtk.Orientation.VERTICAL
        });
        search_box.width_request = this._SEARCH_BOX_WIDTH;
        search_box.halign = Gtk.Align.CENTER;
        inner_grid.add(title_image);
        inner_grid.add(search_box);

        this.orientation = Gtk.Orientation.VERTICAL;
        this.add(inner_grid);
        this.add(this._card_container);
        this.add(this._button_stack);
    },

    pack_cards: function (cards) {
        this._card_container.get_children().forEach((card) =>
            this._card_container.remove(card));
        let sorted_cards = cards.sort((a, b) => {
            let sortVal = 0;
            if (a.model.featured)
                sortVal--;
            if (b.model.featured)
                sortVal++;
            return sortVal;
        });
        if (sorted_cards.length > MAX_CARDS) {
            this._got_extra_cards = true;
        }
        sorted_cards.slice(0, MAX_CARDS).forEach((card) =>
            this._card_container.add(card));
        this._update_button_visibility();
    }
});
