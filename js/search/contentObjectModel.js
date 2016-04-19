// Copyright 2014 Endless Mobile, Inc.
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

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
         * Unique ID of the model
         *
         * This is an internal ID assigned by EKN.
         * If none is provided, the model will generate its own id with domain
         * "none".
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
         * However, on an <ArticleObjectModel> with <source> equal to
         * "wikipedia", "wikihow", "wikisource", or "wikibooks", it will be
         * set to the value of <source-uri> if it is not present in the
         * database, for backwards compatibility reasons.
         */
        'original-uri': GObject.ParamSpec.string('original-uri', 'Original URI',
            'URI where the original version of this content can be downloaded',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            ''),
        /**
         * Property: thumbnail-uri
         * URI of the the thumbnail image
         *
         * Usually the EKN ID of an <ImageObjectModel>.
         */
        'thumbnail-uri': GObject.ParamSpec.string('thumbnail-uri',
            'Thumbnail URI', 'URI of the thumbnail image',
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
        /**
         * Property: featured
         * Whether this content should be given priority in the UI
         */
        'featured': GObject.ParamSpec.boolean('featured', 'Featured',
            'Whether this content should be given priority in the UI',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            false),
    },

    _init: function (props={}, json_ld=null) {
        if (json_ld)
            this._content_props_from_json_ld(props, json_ld);

        // FIXME: We can't have lists or functions as GObject properties at the
        // moment. Handle them before chaining with this.parent().
        Object.defineProperties(this, {
            /**
             * Property: tags
             * A list of tags of the article being read.
             */
            'tags': {
                value: props.tags ? props.tags.slice(0) : [],
                writable: false,
            },
            /**
             * Property: resources
             * A list of resources associated with this content object.
             */
            'resources': {
                value: props.resources ? props.resources.slice(0) : [],
                writable: false,
            },
            /**
             * Property: get_content_stream
             * A function returning a GInputStream of the objects content.
             */
            'get_content_stream': {
                value: props.get_content_stream ? props.get_content_stream : () => {
                    throw new Error('No content stream set on this model');
                },
                writable: false,
            },
        });
        delete props.tags;
        delete props.resources;
        delete props.get_content_stream;

        // Note: This is only for ensuring the invariant of "each model has an
        // EKN ID" in tests. It is illegal to create a model in production code
        // with no EKN ID.
        if (['ekn-id', 'ekn_id', 'eknId'].every(prop => !(prop in props))) {
            props.ekn_id = 'ekn://none/' +
                GLib.compute_checksum_for_string(GLib.ChecksumType.SHA1, this.toString(), -1);
        }

        this.parent(props);

        this._content_legacy_fixups(json_ld);
    },

    _content_props_from_json_ld: function (props, json_ld) {
        if (json_ld.hasOwnProperty('@id'))
            props.ekn_id = json_ld['@id'];

        if (json_ld.hasOwnProperty('contentType'))
            props.content_type = json_ld.contentType;

        if (json_ld.hasOwnProperty('title'))
            props.title = json_ld.title;

        if (json_ld.hasOwnProperty('originalTitle'))
            props.original_title = json_ld.originalTitle;

        if (json_ld.hasOwnProperty('originalURI'))
            props.original_uri = json_ld.originalURI;

        if (json_ld.hasOwnProperty('language'))
            props.language = json_ld.language;

        if (json_ld.hasOwnProperty('resources'))
            props.resources = json_ld.resources;

        if (json_ld.hasOwnProperty('tags'))
            props.tags = json_ld.tags;

        if (json_ld.hasOwnProperty('copyrightHolder'))
            props.copyright_holder = json_ld.copyrightHolder;

        if (json_ld.hasOwnProperty('sourceURI'))
            props.source_uri = json_ld.sourceURI;

        if (json_ld.hasOwnProperty('synopsis'))
            props.synopsis = json_ld.synopsis;

        if (json_ld.hasOwnProperty('lastModifiedDate'))
            props.last_modified_date = json_ld.lastModifiedDate;

        if (json_ld.hasOwnProperty('license'))
            props.license = json_ld.license;

        if (json_ld.hasOwnProperty('thumbnail'))
            props.thumbnail_uri = json_ld.thumbnail;

        if (json_ld.hasOwnProperty('redirectsTo'))
            props.redirects_to = json_ld.redirectsTo;

        if (json_ld.hasOwnProperty('featured'))
            props.featured = json_ld.featured;
    },

    _content_legacy_fixups: function (json_ld) {
        if (this.ekn_version === 1) {
            // Old name for source_uri parameter
            if (!this.source_uri && json_ld && json_ld.sourceURL)
                this.source_uri = json_ld.sourceURL;

            // Some of our old content had inconsistent capitalization
            if (this.title)
                this.title = this.title.charAt(0).toUpperCase() + this.title.slice(1);
        }
    },
});
