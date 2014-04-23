// Copyright 2014 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;


// Objects as properties. This won't be necessary in gjs 3.12 and will
// actually break as the ParamSpec._new_internal signature will change.
GObject.ParamSpec.object = function (name, nick, blurb, flags, klass) {
    let gtype = klass? klass.$gtype : GObject.TYPE_OBJECT;
    return GObject.ParamSpec._new_internal(name, gtype, nick, blurb, flags);
};

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

const CONTENT_OBJECT_TYPE = "ekv:ContentObject";

const ContentObjectModel = new Lang.Class({
    Name: "ContentObjectModel",
    GTypeName: 'EknContentObjectModel',
    Extends: GObject.Object,
    Properties: {
        "title": GObject.ParamSpec.string("title", "Title", "Object's Title",
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, ""),
        "thumbnail": GObject.ParamSpec.string("thumbnail", "Thumbnail URL", "URL of the Object's Thumbnail",
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, ""),
        "language": GObject.ParamSpec.string("language", "Language", "Object's Language",
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, ""),
        "copyright_holder": GObject.ParamSpec.string("copyright_holder", "Copyright Holder", "Object's Copyright Holder",
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, ""),
        "source_url": GObject.ParamSpec.string("source_url", "Source URL", "URL of the Object's Source Page",
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, ""),
        "synopsis": GObject.ParamSpec.string("synopsis", "Synopsis", "Object's Synopsis",
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, ""),
        "resources": GObject.ParamSpec.object("resources", "Resources", "Object's Resources", 
            GObject.ParamFlags.READWRITE, GObject.Object),
        "last_modified_date": GObject.ParamSpec.string("last_modified_date", "Last Modified Date", "Object's Last Modified Date",
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, ""),
        "tags": GObject.ParamSpec.object("tags", "Tags", "Object's Tags", 
            GObject.ParamFlags.READWRITE, GObject.Object),
        "license": GObject.ParamSpec.string("license", "License", "Object's License",
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, "")
    },

    _init: function (json_ld_object, params) {
        this.parent(params);

        if (typeof json_ld_object["@id"] === "undefined") {
            throw new Error("Content object ID is missing.");
        }
        if (typeof json_ld_object["@type"] === "undefined") {
            throw new Error("Content object type is missing.");
        }

        this._new_from_json_ld(json_ld_object);
    },

    _new_from_json_ld: function (json_ld_data) {
        this._id = json_ld_data["@id"];
        this._title = json_ld_data["title"];
        this._thumbnail = json_ld_data["thumbnail"];
        this._language = json_ld_data["language"];
        this._copyright_holder = json_ld_data["copyrightHolder"];
        this._source_url = json_ld_data["sourceURL"];
        this._synopsis = json_ld_data["synopsis"];
        this._last_modified_date = new Date(json_ld_data["lastModifiedDate"]);
        this._tags = json_ld_data["tags"];
        this._license = json_ld_data["license"];

        this._resources = [];
        for (let resource in json_ld_data["resources"]) {
            this._resources.push(resource);
        }
    },
 
    get title () {
        return this._title;
    },

    get thumbnail () {
        return this._thumbnail;
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

    get resources () {
        return this._resources;
    },

    get last_modified_date () {
        return this._last_modified_date;
    },

    get tags () {
        return this._tags;
    },

    get license () {
        return this._license;
    },

    set title (v) {
        this._title = v;
    },

    set thumbnail (v) {
        this._thumbnail = v;
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

    set resources (v) {
        this._resources = v;
    },

    set last_modified_date (v) {
        this._last_modified_date = v;
    },

    set tags (v) {
        this._tags = v;
    },

    set license (v) {
        this._license = v;
    }
});
