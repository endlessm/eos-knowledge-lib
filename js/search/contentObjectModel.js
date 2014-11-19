// Copyright 2014 Endless Mobile, Inc.
const EosKnowledgeSearch = imports.EosKnowledgeSearch;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

/**
 * Class: ContentObjectModel
 * This is the base class for all content objects in the knowledge app.
 *
 * This object can be configured with a <title>, <thumbnail>, <language>,
 * <copyright-holder>, <source-uri>, <content-uri>, <synopsis>, <resources>, <last-modified-date>,
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
         * Property: original-title
         * A string with the original title of the content object. Defaults to an empty string.
         */
        'original-title': GObject.ParamSpec.string('original-title', 'Original Title', 'The original title (wikipedia title) of a document or media object',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, ''),
        /**
         * Property: thumbnail
         * A ImageObjectModel representing the thumbnail image. Must be set to type GObject, since
         * ImageObjectModel subclasses this class and so we cannot reference it here.
         */
        'thumbnail': GObject.ParamSpec.object('thumbnail', 'Thumbnail', 'Image object of the thumbnail image',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, GObject.Object),
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
         * Property: content-uri
         * A string with the URI to the file content for this object.
         */
        'content-uri': GObject.ParamSpec.string('content-uri', 'Object Content URL',
            'URI of the source content file',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            ''),
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
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, ''),
        /**
         * Property: num-resources
         * The number of resources belonging to this content object.
         */
        'num-resources': GObject.ParamSpec.int('num-resources', 'Number of resources',
            'Number of resources belonging to this object',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
             0, GLib.MAXINT32, 0),
        /**
         * Property: resources-ready
         * Whether or not the resources belonging to this content object have
         * been retrieved/marshalled
         */
        'resources-ready': GObject.ParamSpec.boolean('resources-ready', 'Resources ready',
            'Whether the resources have been fetched/marshalled',
             GObject.ParamFlags.READABLE,
             false),
    },

    _init: function (params) {
        this._resources_ready = false;
        this._num_resources = 0;
        this._resources = [];
        this.request_queue = [];
        this.parent(params);
    },

    /**
     * Function: fetch_all
     * Attempts to fetch all pending requests for this object. The callback
     * associated with the request should handle emitting signals to indicate
     * if the request was successful
     *
     * Parameters:
     *   engine - The Knowledge Engine used to handle the pending requests
     */
    fetch_all: function (engine) {
        this.request_queue.forEach(function (request) {
            engine.get_object_by_id(request.domain, request.id, request.callback);
        });
        this.request_queue = [];
    },

    /**
     * Function: queue_deferred_property
     * Queues an engine fetch until later (when fetch_all is called)
     *
     * Properties:
     *   uri - the EKN URI of the property to be fetched
     *   callback - the callback that'll be called by the engine once the property
     *              is fetched. Should handle error case
     */
    queue_deferred_property: function (uri, callback) {
        [domain, id] = uri.split('/').slice(-2);
        this.request_queue.push({
            domain: domain,
            id: id,
            callback: callback
        });
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

    get content_uri () {
        return this._content_uri;
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

    get num_resources () {
        return this._num_resources;
    },

    get resources_ready () {
        return this._resources_ready;
    },

    set ekn_id (v) {
        this._ekn_id = v;
    },

    set title (v) {
        // TODO: Remove this line once we have reliable content
        // For now we need to programmatically capitalize titles
        v = v.charAt(0).toUpperCase() + v.slice(1);
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

    set content_uri (v) {
        this._content_uri = v;
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

    set num_resources (v) {
        this._num_resources = v;
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

/**
 * Constructor: new_from_json_ld
 * Creates an ContentObjectModel from a Knowledge Engine ContentObject
 * JSON-LD document
 */
ContentObjectModel.new_from_json_ld = function (json_ld_data) {
    let props = ContentObjectModel._props_from_json_ld(json_ld_data);
    let contentObjectModel = new ContentObjectModel(props);
    ContentObjectModel._setup_from_json_ld(contentObjectModel, json_ld_data);

    return contentObjectModel;
};

ContentObjectModel._setup_from_json_ld = function (model, json_ld_data) {
    // setup thumbnail, if it exists
    if(json_ld_data.hasOwnProperty('thumbnail')) {
        if (typeof json_ld_data.thumbnail === 'object') {
            // if the thumbnail is a JSON-LD object, marshall it now
            model.thumbnail = EosKnowledgeSearch.ImageObjectModel.new_from_json_ld(json_ld_data.thumbnail);
        } else {
            // else, defer requesting the thumbnail until fetch_all is called
            model.queue_deferred_property(json_ld_data.thumbnail,
                function (err, thumbnail) {
                    if (err) {
                        printerr(err);
                    } else {
                        model.thumbnail = thumbnail;
                    }
                }
            );
        }
    }

    // setup resources, if we have any
    if (model.num_resources > 0) {
        if (typeof json_ld_data.resources[0] === 'object') {
            // if the resources are already in JSON-LD form, just instantiate
            // them and alert that they're ready
            let mediaObjectModels =json_ld_data.resources.map(function (resource_json_ld) {
                return EosKnowledgeSearch.MediaObjectModel.new_from_json_ld(resource_json_ld);
            });

            model.set_resources(mediaObjectModels);
            model._resources_ready = true;
            model.notify('resources-ready');
        } else {
            // if the resources list is still a list of URIs, fetch them async
            // and when we have them all, alert that they're ready
            model.set_resources([]);
            json_ld_data.resources.forEach(function (uri) {
                model.queue_deferred_property(uri,
                    function (err, res) {
                        if (err) {
                            printerr(err);
                        } else {
                            let resources = model.get_resources();
                            let resource_ekn_ids = resources.map(function (model) {
                                return model.ekn_id;
                            });
                            // Never add duplicate resources.
                            if (resource_ekn_ids.indexOf(res.ekn_id) === -1) {
                                resources.push(res);
                                model.set_resources(resources);
                            } else {
                                model.num_resources--;
                            }
                            if (resources.length === model.num_resources) {
                                model._resources_ready = true;
                                model.notify('resources-ready');
                            }
                        }
                    }
                );
            });
        }
    }
};

ContentObjectModel._props_from_json_ld = function (json_ld_data) {
    let props = {};
    if(json_ld_data.hasOwnProperty('@id'))
        props.ekn_id = json_ld_data['@id'];

    if(json_ld_data.hasOwnProperty('title'))
        props.title = json_ld_data.title;

    if(json_ld_data.hasOwnProperty('originalTitle'))
        props.original_title = json_ld_data.originalTitle;

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

    if (json_ld_data.hasOwnProperty('contentURL'))
        props.content_uri = json_ld_data.contentURL;

    if(json_ld_data.hasOwnProperty('synopsis'))
        props.synopsis = json_ld_data.synopsis;

    if(json_ld_data.hasOwnProperty('lastModifiedDate'))
        props.last_modified_date = json_ld_data.lastModifiedDate;

    if(json_ld_data.hasOwnProperty('license'))
        props.license = json_ld_data.license;

    return props;
};
