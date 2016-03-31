// Copyright 2016 Endless Mobile, Inc.
/* exported FakeVideoDocumentCard */

const Format = imports.format;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const AsyncTask = imports.search.asyncTask;
const Card = imports.app.interfaces.card;
const DocumentCard = imports.app.interfaces.documentCard;
const Module = imports.app.interfaces.module;

String.prototype.format = Format.format;

const FakeVideoDocumentCard = new Module.Class({
    Name: 'FakeVideoDocumentCard',
    CssName: 'EknFakeVideoDocumentCard',
    Extends: Gtk.Overlay,
    Implements: [ Card.Card, DocumentCard.DocumentCard ],

    Properties: {
        /**
         * Property: previous-card
         * Card linking to the previous document card.
         */
        'previous-card': GObject.ParamSpec.object('previous-card',
            'Previous Card', 'Previous Card',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, Gtk.Widget),
        /**
         * Property: next-card
         * Card linking to the next document card.
         */
        'next-card': GObject.ParamSpec.object('next-card',
            'Next Card', 'Next Card',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, Gtk.Widget),
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/fakeVideoDocumentCard.ui',
    InternalChildren: [ 'counter', 'fake-video-frame', 'next-card-container',
        'play-pause-button', 'progress-adjustment', 'static', 'title-label' ],

    _init: function (props={}) {
        this._playing = false;
        this._play_timer_id = 0;
        this.parent(props);

        this.set_title_label_from_model(this._title_label);
        this.set_thumbnail_frame_from_model(this._fake_video_frame);

        this._play_pause_button.connect('clicked',
            this._play_pause_pressed.bind(this));
        this._progress_adjustment.connect('value-changed',
            this._update_counter.bind(this));
        this._update_counter();

        this.content_view = this._fake_video_frame;

        if (this.next_card)
            this._next_card_container.add(this.next_card);

        this.show_all();
    },

    // Module override
    get_slot_names: function () {
        return ['sequence-card-type'];
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

    clear_content: function () {
    },

    _play_pause_pressed: function () {
        this._playing = !this._playing;
        if (this._playing) {
            this._play_pause_button.image.icon_name = 'media-playback-pause-symbolic';
            this._static.get_style_context().add_class('playing');
            this._play_timer_id = GLib.timeout_add_seconds(GLib.PRIORITY_HIGH_IDLE, 1,
                this._advance_progress.bind(this));
        } else {
            this._play_pause_button.image.icon_name = 'media-playback-start-symbolic';
            this._static.get_style_context().remove_class('playing');
            GLib.Source.remove(this._play_timer_id);
            this._play_timer_id = 0;
        }
    },

    _advance_progress: function () {
        this._progress_adjustment.value++;
        if (this._progress_adjustment.value >= 100) {
            this._play_pause_pressed();
            this._progress_adjustment.value = 0;
            if (this.next_card)
                this._next_card_container.show();
            return GLib.SOURCE_REMOVE;
        }
        return GLib.SOURCE_CONTINUE;
    },

    _update_counter: function () {
        let seconds = Math.floor(this._progress_adjustment.value % 60);
        let minutes = Math.floor(this._progress_adjustment.value / 60);
        this._counter.label = '%d:%02d'.format(minutes, seconds);
    },
});
