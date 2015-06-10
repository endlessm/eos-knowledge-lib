// Copyright 2014 Endless Mobile, Inc.

const Gettext = imports.gettext;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Config = imports.app.config;
const HomePage = imports.app.homePage;
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
    Extends: HomePage.HomePage,

    Properties: {
        'animating': GObject.ParamSpec.boolean('animating',
            'Animating', 'Set true if this page is animating and should hide its show all button',
            GObject.ParamFlags.READWRITE, false),
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

        this._all_categories_button = new TabButton.TabButton({
            position: Gtk.PositionType.BOTTOM,
            label: _("SEE ALL CATEGORIES")
        });

        this._animating = false;
        this._all_categories_button.connect('clicked', function () {
            this._hide_button();
            let id = this._button_stack.connect('notify::transition-running', function () {
                if (!this._button_stack.transition_running && this._button_stack.visible_child != this._all_categories_button) {
                    this.emit('show-categories');
                }
                this._button_stack.disconnect(id);
            }.bind(this));
        }.bind(this));
        this._card_container.connect('notify::all-visible',
            this._update_button_visibility.bind(this));

        this._button_stack.add(this._invisible_frame);
        this._button_stack.add(this._all_categories_button);

        this.parent(props);

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
        this._button_stack.visible_child = this._all_categories_button;
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
            if (a.featured) sortVal--;
            if (b.featured) sortVal++;
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
