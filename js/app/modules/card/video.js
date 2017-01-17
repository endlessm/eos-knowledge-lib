// Copyright 2016 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const ArticleContent = imports.app.interfaces.articleContent;
const AsyncTask = imports.app.asyncTask;
const Card = imports.app.interfaces.card;
const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const Module = imports.app.interfaces.module;

// Make sure included for glade template
const Utils = imports.app.utils;

/**
 * Class: Video
 *
 * A card for displaying video content.
 */
const Video = new Module.Class({
    Name: 'Card.Video',
    Extends: Gtk.Grid,
    Implements: [Card.Card, ArticleContent.ArticleContent],

    Properties: {
        /**
         * Property: show-titles
         *
         * Set true if the title label should be visible.
         */
        'show-title':  GObject.ParamSpec.boolean('show-title', 'Show Title Label',
            'Whether to show the title label',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, true),
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/card/video.ui',
    InternalChildren: [ 'title-label', 'synopsis-label' ],

    _init: function (props={}) {
        this.parent(props);

        this.set_title_label_from_model(this._title_label);
        this.set_label_or_hide(this._synopsis_label, this.model.synopsis);

        this._title_label.visible = this.show_title;
        let video_player = new EosKnowledgePrivate.MediaBin();
        video_player.get_style_context().add_class(Utils.get_element_style_class(Video, 'player'));
        video_player.set_uri(this.model.ekn_id)
        video_player.show_all();
        this.attach(video_player, 1, 1, 1, 1);
        this.content_view = video_player;
    },

    load_content: function (cancellable, callback) {
        let task = new AsyncTask.AsyncTask(this, cancellable, callback);
        task.catch_errors(() => {
            task.return_value();
        });
    },

    load_content_finish: function (task) {
        return task.finish();
    },

    set_active: function (is_active) {
        if (!is_active) {
            this.content_view.stop();
        }
    },
});
