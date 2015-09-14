// Copyright 2015 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Module = imports.app.interfaces.module;

/**
 * Class: EncyclopediaContentTemplate
 *
 * A Template used for the search results page of encyclopedia apps.
 *
 * CSS Styles:
 *      encyclopedia-content-template - on the template
 *
 * Slots:
 *   - top_left
 *   - top_right
 *   - bottom
 */
const EncyclopediaContentTemplate = new Lang.Class({
    Name: 'EncyclopediaContentTemplate',
    GTypeName: 'EknEncyclopediaContentTemplate',
    Extends: Gtk.Grid,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        /**
         * Property: search-box
         *
         * The <SearchBox> widget created by this widget. Read-only,
         * modify using the <SearchBox> API. Use to type search queries and to display the last
         * query searched.
         */
        'search-box': GObject.ParamSpec.object('search-box', 'Search Box',
            'The Search box of this view widget',
            GObject.ParamFlags.READABLE,
            Endless.SearchBox),

        /**
         * Property: content-module
         * <Module> created by this widget which shows content
         *
         * FIXME: The dispatcher will make this property unnecessary.
         */
        'content-module': GObject.ParamSpec.object('content-module',
            'Content module', 'Content module for this view',
            GObject.ParamFlags.READABLE, GObject.Object.$gtype),

        /**
         * Property: search-banner
         * <SearchBanner> created by this widget
         *
         * FIXME: The dispatcher will make this property unnecessary.
         */
        'search-banner': GObject.ParamSpec.object('search-banner',
            'Search banner', 'Search banner for this view',
            GObject.ParamFlags.READABLE, GObject.Object.$gtype),
    },

    Template: 'resource:///com/endlessm/knowledge/widgets/encyclopediaContentTemplate.ui',

    _init: function (props={}) {
        this.parent(props);

        ['top_left', 'top_right', 'bottom'].forEach(this._pack_slot.bind(this));
        // FIXME: these lines should be replaced by the dispatcher
        this.search_box = this._top_right;
        this.search_banner = this._paper_top;
    },

    _pack_slot: function (slot, props={}) {
        let submodule = this.create_submodule(slot, props);
        if (submodule) {
            switch (slot) {
                case 'top_left':
                    this.attach(submodule, 0, 0, 1, 1);
                    break;
                case 'top_right':
                    this.attach(submodule, 1, 0, 1, 1);
                    break;
                case 'bottom':
                    this.attach(submodule, 0, 1, 2, 1);
                    break;
            }
            this['_' + slot] = submodule;
        }
    },

    get content_module () {
        return this._bottom;
    },
});
