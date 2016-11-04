// Copyright 2016 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Card = imports.app.interfaces.card;
const Module = imports.app.interfaces.module;
const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;

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
    Implements: [Card.Card],

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

        this.show_all();

        this._title_label.visible = this.show_title;
        let video_player = new EosKnowledgePrivate.MediaBin();
        video_player.get_style_context().add_class(Utils.get_element_style_class(Video, 'player'));
        video_player.set_uri('file:///home/endless/checkout/eos-knowledge-lib/YUaYs_7vGAI.mp4')
        this.attach(video_player, 1, 1, 1, 1);
    },
});
