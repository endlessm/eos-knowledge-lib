// Copyright 2016 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const ArticleContent = imports.app.interfaces.articleContent;
const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const Module = imports.app.interfaces.module;
const {View} = imports.app.interfaces.view;

// Make sure included for glade template
const Utils = imports.app.utils;

/**
 * Class: Video
 *
 * A card for displaying video content.
 */
var Video = new Module.Class({
    Name: 'View.Video',
    Extends: Gtk.Grid,
    Implements: [View, ArticleContent.ArticleContent],

    Properties: {
        /**
         * Property: show-titles
         *
         * Set true if the title label should be visible.
         */
        'show-title':  GObject.ParamSpec.boolean('show-title', 'Show Title Label',
            'Whether to show the title label',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, true),
        /**
         * Property: show-synopsis
         *
         * Set true if the synopsis label should be visible.
         */
        'show-synopsis':  GObject.ParamSpec.boolean('show-synopsis', 'Show Synopsis Label',
            'Whether to show the synopsis label',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, true),
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/view/video.ui',
    InternalChildren: [ 'title-label', 'synopsis-label' ],

    _init: function (props={}) {
        this.parent(props);

        this.set_title_label_from_model(this._title_label);
        this.set_label_or_hide(this._synopsis_label, this.model.synopsis);

        this._title_label.visible = this.show_title;
        this._synopsis_label.visible = this.show_synopsis;
        let video_player = new EosKnowledgePrivate.MediaBin( {
            visible: true,
            uri: this.model.id,
            title: this.model.title,
            description: this.model.synopsis,
        });
        video_player.get_style_context().add_class(Utils.get_element_style_class(Video, 'player'));
        video_player.show_all();
        this.attach(video_player, 1, 1, 1, 1);
        this.content_view = video_player;
    },

    load_content_promise: function () {
        return Promise.resolve();
    },

    set_active: function (is_active) {
        if (!is_active) {
            this.content_view.stop();
        }
    },
});
