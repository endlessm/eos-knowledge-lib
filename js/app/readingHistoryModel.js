// Copyright 2016 Endless Mobile, Inc.

/* exported ReadingHistoryModel */

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;

const Knowledge = imports.app.knowledge;
const Utils = imports.app.utils;

/**
 * Class: ReadingHistoryModel
 *
 * The ReadingHistoryModel keeps track of the articles that the user has
 * read for a specific application.
 *
 * This set of article ID's is persisted in a JSON file in the user's home directory
 * and updated every time a new article is read.
 */
const ReadingHistoryModel= new Knowledge.Class({
    Name: 'ReadingHistoryModel',
    Extends: GObject.Object,

    Properties: {
        /**
         * Property: history-file
         * Contains the reading history on disk
         *
         * Necessary for injecting a mock object in unit tests.
         *
         * Flags:
         *   Construct only
         */
        'history-file': GObject.ParamSpec.object('history-file',
            'Reading History File', 'File to store and retrieve the user\'s reading history',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            GObject.Object.$gtype),
    },

    Signals: {
        /**
         * Event: changed
         *
         * Emitted when the history item changes.
         */
        'changed': {},
    },

    _init: function (props={}) {
        this.parent(props);

        this._pending_operation = null;
        // We store the list of read articles as a set and use set operations to
        // maintain the list.
        this._read_articles = new Set();
        this._reading_history_file = this.history_file ||
            Gio.File.new_for_path(Gio.Application.get_default().config_dir.get_path() + '/reading_history.json');
        this._load_reading_history_file();
    },

    _load_reading_history_file: function () {
        let json_contents;

        try {
            let [success, data] = this._reading_history_file.load_contents(null);
            json_contents = data;
        } catch (error) {
            if (!error.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.NOT_FOUND)) {
                logError(error, 'Could not read reading history file');
            }
            return;
        }

        try {
            this._read_articles = new Set(JSON.parse(json_contents));
            if (this._read_articles)
                this.emit('changed');
        } catch (error) {
            logError(error, 'Unexpected contents in reading history file');
        }
    },

    _save_reading_history_file: function () {
        if (this._pending_operation)
            return;

        this._pending_operation = GLib.timeout_add_seconds(GLib.PRIORITY_LOW, 1, () => {
            Utils.save_object_to_file([...this._read_articles], this._reading_history_file);
            this._pending_operation = null;
        });
    },

    mark_article_read: function (article_id) {
        this._read_articles.add(article_id);
        this._save_reading_history_file();
        this.emit('changed');
    },

    is_read_article: function (article_id) {
        // Check set containment for the specified article ID
        return this._read_articles.has(article_id);
    },

    get_read_articles: function () {
        return this._read_articles;
    },
});

let get_default = (function () {
    let default_history_model;
    return function () {
        if (!default_history_model)
            default_history_model = new ReadingHistoryModel();
        return default_history_model;
    };
})();
