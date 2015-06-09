// Copyright 2014 Endless Mobile, Inc.
const ByteArray = imports.byteArray;
const Gio = imports.gi.Gio;
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
         * Property: ekn-version
         *
         * The version of the on-disk data format for this bundle. This value
         * is incremented whenever we have a major change in this format, and
         * is used to support backwards compatible changes.
         *
         * Defaults to 1
         */
        'ekn-version': GObject.ParamSpec.int('ekn-version', 'EKN Version',
            'The version of the knowledge app.',
             GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
             0, GLib.MAXINT32, 1),
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
         * However, on an <ArticleObjectModel> with <source> equal to
         * "wikipedia", "wikihow", "wikisource", or "wikibooks", it will be
         * set to the value of <source-uri> if it is not present in the
         * database, for backwards compatibility reasons.
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
         * Also, on an <ArticleObjectModel> with <source> equal to "wikipedia",
         * "wikihow", "wikisource", or "wikibooks", it will be set to the
         * appropriate value even if it is not present in the database, for
         * backwards compatibility reasons.
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
         * (DEPRECATED) A string with the URI to the file content for this
         * object.
         *
         * No longer used in ekn bundles. Content is now stored in a shard file
         * which is indexed by ekn-id, and is accessed by get_content_stream()
         */
        'content-uri': GObject.ParamSpec.string('content-uri', 'Object Content URL',
            'URI of the source content file',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            ''),
        /**
         * Property: content-type
         * The source content's mimetype
         */
        'content-type': GObject.ParamSpec.string('content-type', 'Object Content Type',
            'Mimetype of the source content',
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
         * Property: redirects-to
         * The EKN ID of the ContentObject to which this model should redirect.
         */
        'redirects-to': GObject.ParamSpec.string('redirects-to', 'Redirects To',
            'EKN ID of the object to which this model should redirect',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, ''),
    },

    _init: function (params) {
        // FIXME: We can't have lists as GObject properties at the moment, so
        // handle them before chaining with this.parent().
        Object.defineProperties(this, {
            /**
             * Property: tags
             * A list of tags of the article being read.
             */
            'tags': {
                value: params.tags ? params.tags.slice(0) : [],
                writable: false,
            },
            /**
             * Property: resources
             * A list of resources associated with this content object.
             */
            'resources': {
                value: params.resources ? params.resources.slice(0) : [],
                writable: false,
            },
        });
        delete params.tags;
        delete params.resources;

        this.parent(params);
    },

    get title () {
        return this._title;
    },

    get_content_stream: function () {
        if (this.ekn_version >= 2) {
            // FIXME: We need to do this import here in the method to avoid a
            // circular dependency of imports
            let engine = imports.search.engine.Engine.get_default();
            let [stream, content_type] = engine.get_content_by_id(this.ekn_id);
            return stream;
        } else {
            if (this.content_type === 'text/html') {
                let bytes = ByteArray.fromString(this.html).toGBytes();
                let stream = Gio.MemoryInputStream.new_from_bytes(bytes);
                return stream;
            } else {
                let file = Gio.File.new_for_uri(this.content_uri);
                let stream = file.read(null);
                return stream;
            }
        }
    },

    set title (v) {
        // TODO: Remove this line once we have reliable content
        // For now we need to programmatically capitalize titles
        v = v.charAt(0).toUpperCase() + v.slice(1);
        this._title = v;
    },
});

/**
 * Constructor: new_from_json_ld
 * Creates an ContentObjectModel from a Knowledge Engine ContentObject
 * JSON-LD document
 */
ContentObjectModel.new_from_json_ld = function (json_ld_data, media_path, ekn_version) {
    let props = ContentObjectModel._props_from_json_ld(json_ld_data, media_path, ekn_version);
    let contentObjectModel = new ContentObjectModel(props);

    return contentObjectModel;
};

ContentObjectModel._props_from_json_ld = function (json_ld_data, media_path, ekn_version) {
    let props = {};

    if (typeof ekn_version === 'number')
        props.ekn_version = ekn_version;

    if(json_ld_data.hasOwnProperty('@id'))
        props.ekn_id = json_ld_data['@id'];

    if(json_ld_data.hasOwnProperty('title'))
        props.title = json_ld_data.title;

    if (json_ld_data.hasOwnProperty('contentType'))
        props.content_type = json_ld_data.contentType;

    if(json_ld_data.hasOwnProperty('originalTitle'))
        props.original_title = json_ld_data.originalTitle;

    if (json_ld_data.hasOwnProperty('originalURI'))
        props.original_uri = json_ld_data.originalURI;

    if(json_ld_data.hasOwnProperty('language'))
        props.language = json_ld_data.language;

    if(json_ld_data.hasOwnProperty('resources'))
        props.resources = json_ld_data.resources;

    if(json_ld_data.hasOwnProperty('tags'))
        props.tags = json_ld_data.tags;

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
