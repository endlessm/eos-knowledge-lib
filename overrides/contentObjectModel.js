// Copyright 2014 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

/**
 * Class: ContentObjectModel
 * This is the base class for all content objects in the knowledge app.
 *
 * This object can be configured with a <title>, <thumbnail-uri>, <language>,
 * <copyright-holder>, <source-uri>, <synopsis>, <resources>, <last-modified-date>, 
 * <tags>, and <license> properties.
 */
const ContentObjectModel = new Lang.Class({
    Name: 'ContentObjectModel',
    GTypeName: 'EknContentObjectModel',
    Extends: GObject.Object,
    Properties: {
        /**
         * Property: ekn-id
         * A string with the ID of the content object. This is an internal ID assigned by EKN.
         */
        'ekn-id': GObject.ParamSpec.string('ekn-id', 'Object\'s ID', 'The ID of a document or media object',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, ''),
        /**
         * Property: title
         * A string with the title of the content object. Defaults to an empty string.
         */
        'title': GObject.ParamSpec.string('title', 'Title', 'The title of a document or media object',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, ''),
        /**
         * Property: thumbnail-uri
         * A string with the URI of the thumbnail image. An empty string means
         * no thumbnail should be visible. Defaults to an empty string.
         */
        'thumbnail-uri': GObject.ParamSpec.string('thumbnail-uri', 'Thumbnail URI', 'URI of the thumbnail image',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, ''),
        /**
         * Property: language
         * The language for this content object. Defaults to an empty string.
         */
        'language': GObject.ParamSpec.string('language', 'Language', 'Language of the document or media object',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, ''),
        /**
         * Property: copyright-holder
         * The copyright holder for this content object. Defaults to an empty string.
         */
        'copyright-holder': GObject.ParamSpec.string('copyright-holder', 'Copyright Holder', 'The copyright holder of the object',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, ''),
        /**
         * Property: source-uri
         * A string with the URI to the source for this content object.
         * TODO Should we check to always have a value for <source-uri>?
         */
        'source-uri': GObject.ParamSpec.string('source-uri', 'Source URL', 'URI of the source page',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, ''),
        /**
         * Property: synopsis
         * The synopsis for this content object. Defaults to an empty string.
         */
        'synopsis': GObject.ParamSpec.string('synopsis', 'Synopsis', 'Synopsis of the document or media object',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, ''),
        /**
         * Property: last-modified-date
         * The date of last modification for this content object. It treats dates
         * according to the ISO8601 standard.
         */
        'last-modified-date': GObject.ParamSpec.string('last_modified_date', 'Last Modified Date', 'Last Modified Date of the document or media object',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, ''),
        /**
         * Property: license
         * The license for this content object. Defaults to an empty string.
         */
        'license': GObject.ParamSpec.string('license', 'License', 'License of the document or media object',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, '')
    },

    _init: function (params) {
        this.parent(params);
    },

    get ekn_id () {
        return this._ekn_id;
    },

    get title () {
        return this._title;
    },

    get thumbnail_uri () {
        return this._thumbnail_uri;
    },

    get language () {
        return this._language;
    },

    get copyright_holder () {
        return this._copyright_holder;
    },

    get source_url () {
        return this._source_url;
    },

    get synopsis () {
        return this._synopsis;
    },

    get last_modified_date () {
        return new Date(this._last_modified_date);
    },

    get license () {
        return this._license;
    },

    get_resources: function () {
        return this._resources;
    },

    get_tags: function () {
        return this._tags;
    },

    set ekn_id (v) {
        this._ekn_id = v;
    },

    set title (v) {
        this._title = v;
    },

    set thumbnail_uri (v) {
        this._thumbnail_uri = v;
    },

    set language (v) {
        this._language = v;
    },

    set copyright_holder (v) {
        this._copyright_holder = v;
    },

    set source_url (v) {
        this._source_url = v;
    },

    set synopsis (v) {
        this._synopsis = v;
    },

    set last_modified_date (v) {
        this._last_modified_date = v;
    },

    set license (v) {
        this._license = v;
    },

    set_resources: function (v) {
        if (this._resources === undefined) {
            this._resources = [];
        }
        this._resources = v;
    },

    set_tags: function (v) {
        if (this._tags === undefined) {
            this._tags = [];
        }
        this._tags = v;
    }
});

ContentObjectModel.new_from_json_ld = function (json_ld_data) {
    let props = ContentObjectModel._props_from_json_ld(json_ld_data);
    return new EosKnowledge.ContentObjectModel(props);
};

ContentObjectModel._props_from_json_ld = function (json_ld_data) {
    return {
        ekn_id: json_ld_data["@id"],
        title: json_ld_data.title,
        thumbnail_uri : json_ld_data.thumbnail,
        language : json_ld_data.language,
        copyright_holder : json_ld_data.copyrightHolder,
        source_uri : json_ld_data.sourceURL,
        synopsis : json_ld_data.synopsis,
        last_modified_date : json_ld_data.lastModifiedDate,
        license : json_ld_data.license
    };
};
