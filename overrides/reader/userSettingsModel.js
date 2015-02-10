// Copyright 2014 Endless Mobile, Inc.

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Utils = imports.utils;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

/**
 * Class: Reader.UserSettingsModel
 *
 * This model is an abstraction of all the user settings for the Reader Apps.
 */
const UserSettingsModel = new Lang.Class({
    Name: 'UserSettingsModel',
    GTypeName: 'EknUserSettingsModel',
    Extends: GObject.Object,
    Properties: {
        /**
         * Property: bookmark-page
         * Bookmark Article
         *
         * The article most recently read by the user.
         * The number is zero-based, that is, 0 means the first article.
         * Note this number is absolute with respect to all articles
         * in the database, even though only ~30 are shown to user at a time
         *
         * Default value:
         *  0
         */
        'bookmark-page': GObject.ParamSpec.uint('bookmark-page', 'Last Article Read',
            'Last article that the user read',
            GObject.ParamFlags.READWRITE,
            0, GLib.MAXINT64, 0),

        /**
         * Property: highest-bookmark
         * Highest Bookmark
         *
         * The high watermark of user's reading history.
         * The number is zero-based, that is, 0 means the first article.
         *
         * Default value:
         *  0
         */
        'highest-bookmark': GObject.ParamSpec.uint('highest-bookmark', 'Newest article read',
            'The high watermark of user\'s reading history',
            GObject.ParamFlags.READABLE,
            0, GLib.MAXINT64, 0),

        /**
         * Property: settings-file
         * User Settings File
         *
         * The file in which to store the user settings. Usually a file in the
         * app's config directory.
         *
         * Flags:
         *   Construct only
         */
        'settings-file': GObject.ParamSpec.object('settings-file', 'Settings File',
            'File in which to store user settings',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            GObject.Object.$gtype),

        /**
         * Property: start-article
         * Start Article
         *
         * The first article in the current set that is being read by the user.
         *
         * Default value:
         *  0
         */
        'start-article': GObject.ParamSpec.uint('start-article', 'Start article',
            'The first article in the set being read in the current week',
            GObject.ParamFlags.READWRITE,
            0, GLib.MAXINT64, 0),

        /**
         * Property: update-timestamp
         * Update Timestamp
         *
         * The last time that the readable content was updated, in milliseconds.
         *
         * Default value:
         *  0
         */
        'update-timestamp': GObject.ParamSpec.uint('update-timestamp', 'Last Update Time',
            'Last time content was updated',
            GObject.ParamFlags.READWRITE,
            0, GLib.MAXINT64, 0),
    },

    _init: function (props) {
        props = props || {};
        this._user_settings_file = props.settings_file || Gio.File.new_for_path(Gio.Application.get_default().config_dir.get_path() + '/user_settings.json');
        this._bookmark_page = 0;
        this._highest_bookmark = 0;
        this._start_article = 0;
        this._update_timestamp = 0;
        this._pending_operation = null;

        this._load_user_settings_from_file();
        this.parent(props);
    },

    _load_user_settings_from_file: function () {
        let json_contents;
        try {
            let [success, contents, etag] = this._user_settings_file.load_contents(null);
            // File can be empty, which JSON.parse doesn't like
            if (contents.length === 0)
                return;

            json_contents = contents;
        } catch (e) {
            // User's settings file doesn't exist
            return;
        }

        try {
            let settings = JSON.parse(json_contents);
            this._bookmark_page = settings.bookmark_page;
            this._highest_bookmark = settings.highest_bookmark;
            this._start_article = settings.start_article;
            this._update_timestamp = settings.update_timestamp;
        } catch (e) {
            // Parse error ... get out!
            return;
        }
    },

    _save_user_settings_to_file: function () {
        // If there is already an async request pending
        // then we can just return since it will always
        // write the latest settings parameters
        if (this._pending_operation)
            return;

        this._pending_operation = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT_IDLE, 1, function () {
            let obj = {
                bookmark_page: this._bookmark_page,
                highest_bookmark: this._highest_bookmark,
                start_article: this._start_article,
                update_timestamp: this._update_timestamp,
            };
            Utils.save_object_to_file(obj, this._user_settings_file);
            this._pending_operation = null;
        }.bind(this));
    },

    get bookmark_page() {
        if (this._bookmark_page)
            return this._bookmark_page;
        return 0;
    },

    set bookmark_page(v) {
        if (this._bookmark_page === v)
            return;
        this._bookmark_page = v;
        this._highest_bookmark = Math.max(this._highest_bookmark, this._bookmark_page);
        this._save_user_settings_to_file();
        this.notify('bookmark-page');
    },

    get highest_bookmark() {
        if (this._highest_bookmark)
            return this._highest_bookmark;
        return 0;
    },

    get update_timestamp() {
        if (this._update_timestamp)
            return this._update_timestamp;
        return 0;
    },

    set update_timestamp(v) {
        if (this._update_timestamp === v)
            return;
        this._update_timestamp = v;
        this._save_user_settings_to_file();
        this.notify('update-timestamp');
    },

    get start_article() {
        if (this._start_article)
            return this._start_article;
        return 0;
    },

    set start_article(v) {
        if (this._start_article === v)
            return;
        this._start_article = v;
        this._save_user_settings_to_file();
        this.notify('start-article');
    },
});
