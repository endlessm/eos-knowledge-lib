// Copyright 2014 Endless Mobile, Inc.
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

/**
 * Class: ContentObjectModel
 * This is the base class for all content objects in the knowledge app.
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
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, ''),
        /**
         * Property: title
         * A string with the title of the content object. Defaults to an empty string.
         */
        'title': GObject.ParamSpec.string('title', 'Title', 'The title of a document or media object',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, ''),
        /**
         * Property: original-title
         * A string with the original title of the content object. Defaults to an empty string.
         */
        'original-title': GObject.ParamSpec.string('original-title', 'Original Title', 'The original title (wikipedia title) of a document or media object',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, ''),

        /**
         * Property: original-uri
         * URI where the original version of this content can be downloaded
         *
         * This property is distinct from <source-uri>, which represents the URI
         * where the article was downloaded from during database build.
         *
         * Note that this property may not be present in client databases, since
         * it was added in 0.2.
         *
         * Since:
         *   0.2
         */
        'original-uri': GObject.ParamSpec.string('original-uri', 'Original URI',
            'URI where the original version of this content can be downloaded',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            ''),

        /**
         * Property: thumbnail-id
         * The ekn id of a ImageObjectModel representing the thumbnail image. Must be set to type GObject, since
         * ImageObjectModel subclasses this class and so we cannot reference it here.
         */
        'thumbnail-id': GObject.ParamSpec.string('thumbnail-id', 'Thumbnail ID', 'EKN ID of the thumbnail image',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, ''),
        /**
         * Property: language
         * The language for this content object. Defaults to an empty string.
         */
        'language': GObject.ParamSpec.string('language', 'Language', 'Language of the document or media object',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, ''),
        /**
         * Property: copyright-holder
         * The copyright holder for this content object. Defaults to an empty string.
         */
        'copyright-holder': GObject.ParamSpec.string('copyright-holder', 'Copyright Holder', 'The copyright holder of the object',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, ''),
        /**
         * Property: source-uri
         * URI where this content was downloaded from during database build
         *
         * TODO Should we check to always have a value for <source-uri>?
         * Don't use this property for user-visible things.
         * It is only used internally.
         */
        'source-uri': GObject.ParamSpec.string('source-uri', 'Source URL',
            'URI where this content was downloaded from during database build',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, ''),

        /**
         * Property: source-name
         * Human-readable name of the source of this article
         *
         * A string containing the name of this article's source.
         * For example, "Wikipedia" or "Huffington Post" or "Cosimo's Blog".
         *
         * Note that this property may not be present in client databases, since
         * it was added in 0.2.
         * However, it will be present in all Reader app databases.
         *
         * Since:
         *   0.2
         */
        'source-name': GObject.ParamSpec.string('source-name', 'Source name',
            'Human-readable name of the source of this article',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            ''),

        /**
         * Property: content-uri
         * A string with the URI to the file content for this object.
         */
        'content-uri': GObject.ParamSpec.string('content-uri', 'Object Content URL',
            'URI of the source content file',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            ''),
        /**
         * Property: synopsis
         * The synopsis for this content object. Defaults to an empty string.
         */
        'synopsis': GObject.ParamSpec.string('synopsis', 'Synopsis', 'Synopsis of the document or media object',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, ''),
        /**
         * Property: last-modified-date
         * The date of last modification for this content object. It treats dates
         * according to the ISO8601 standard.
         */
        'last-modified-date': GObject.ParamSpec.string('last-modified-date', 'Last Modified Date', 'Last Modified Date of the document or media object',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, ''),
        /**
         * Property: license
         * The license for this content object. Defaults to an empty string.
         */
        'license': GObject.ParamSpec.string('license', 'License', 'License of the document or media object',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, ''),
        /**
         * Property: num-resources
         * The number of resources belonging to this content object.
         */
        'num-resources': GObject.ParamSpec.int('num-resources', 'Number of resources',
            'Number of resources belonging to this object',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
             0, GLib.MAXINT32, 0),
        /**
         * Property: redirects-to
         * The EKN ID of the ContentObject to which this model should redirect.
         */
        'redirects-to': GObject.ParamSpec.string('redirects-to', 'Redirects To',
            'EKN ID of the object to which this model should redirect',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, ''),
    },

    _init: function (params) {
        this._resources = [];
        this.parent(params);
    },

    get title () {
        return this._title;
    },

    get_resources: function () {
        return this._resources;
    },

    get_tags: function () {
        return this._tags;
    },

    set title (v) {
        // TODO: Remove this line once we have reliable content
        // For now we need to programmatically capitalize titles
        v = v.charAt(0).toUpperCase() + v.slice(1);
        this._title = v;
    },

    set_resources: function (v) {
        this._resources = v;
    },

    set_tags: function (v) {
        this._tags = v;
    }
});

/**
 * Constructor: new_from_json_ld
 * Creates an ContentObjectModel from a Knowledge Engine ContentObject
 * JSON-LD document
 */
ContentObjectModel.new_from_json_ld = function (json_ld_data, media_path) {
    let props = ContentObjectModel._props_from_json_ld(json_ld_data, media_path);
    let contentObjectModel = new ContentObjectModel(props);
    ContentObjectModel._setup_from_json_ld(contentObjectModel, json_ld_data, media_path);

    return contentObjectModel;
};

ContentObjectModel._setup_from_json_ld = function (model, json_ld_data, media_path) {
    if (json_ld_data.hasOwnProperty('resources')) {
        model.set_resources(json_ld_data.resources);
    }
};

ContentObjectModel._props_from_json_ld = function (json_ld_data, media_path) {
    let props = {};
    if(json_ld_data.hasOwnProperty('@id'))
        props.ekn_id = json_ld_data['@id'];

    if(json_ld_data.hasOwnProperty('title'))
        props.title = json_ld_data.title;

    if(json_ld_data.hasOwnProperty('originalTitle'))
        props.original_title = json_ld_data.originalTitle;

    if (json_ld_data.hasOwnProperty('originalURI'))
        props.original_uri = json_ld_data.originalURI;

    if(json_ld_data.hasOwnProperty('language'))
        props.language = json_ld_data.language;

    if(json_ld_data.hasOwnProperty('resources'))
        props.num_resources = json_ld_data.resources.length;

    if(json_ld_data.hasOwnProperty('copyrightHolder'))
        props.copyright_holder = json_ld_data.copyrightHolder;

    // This code remains as a patch to ensure that
    // old databases remain compatible with the new
    // core packages which have standardized to use sourceURI
    if(json_ld_data.hasOwnProperty('sourceURL'))
        props.source_uri = json_ld_data.sourceURL;

    if(json_ld_data.hasOwnProperty('sourceURI'))
        props.source_uri = json_ld_data.sourceURI;

    if (json_ld_data.hasOwnProperty('sourceName'))
        props.source_name = json_ld_data.sourceName;

    if (json_ld_data.hasOwnProperty('contentURL'))
        props.content_uri = 'file://' + media_path + '/' + json_ld_data.contentURL;

    if(json_ld_data.hasOwnProperty('synopsis'))
        props.synopsis = json_ld_data.synopsis;

    if(json_ld_data.hasOwnProperty('lastModifiedDate'))
        props.last_modified_date = json_ld_data.lastModifiedDate;

    if(json_ld_data.hasOwnProperty('license'))
        props.license = json_ld_data.license;

    if(json_ld_data.hasOwnProperty('thumbnail'))
        props.thumbnail_id = json_ld_data.thumbnail;

    if(json_ld_data.hasOwnProperty('redirectsTo'))
        props.redirects_to = json_ld_data.redirectsTo;

    return props;
};
