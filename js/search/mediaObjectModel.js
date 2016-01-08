// Copyright 2014 Endless Mobile, Inc.

const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

const ContentObjectModel = imports.search.contentObjectModel;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

/**
 * Class: MediaObjectModel
 * The model class for media objects. A media object has the same
 * properties as a <ContentObjectModel>, plus <caption>, <height>
 * and <width> properties
 */
const MediaObjectModel = new Lang.Class({
    Name: 'MediaObjectModel',
    GTypeName: 'EknMediaObjectModel',
    Extends: ContentObjectModel.ContentObjectModel,
    Properties: {
        /**
         * Property: caption
         * A displayable string which describes the media object in the same
         * language as the MediaObject. Defaults to empty string
         */
        'caption': GObject.ParamSpec.string('caption',
            'Caption', 'Displayable caption for the media',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            ''),

        /**
         * Property: height
         * The height of the media in pixels. Defaults to 0
         */
        'height': GObject.ParamSpec.uint('height',
            'Height', 'The height of the media in pixels',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            0, GLib.MAXUINT32, 0),

        /**
         * Property: width
         * The width of the media in pixels. Defaults to 0
         */
        'width': GObject.ParamSpec.uint('width',
            'Width', 'The width of the media in pixels',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            0, GLib.MAXUINT32, 0)
    },

    _init: function (props={}, json_ld=null) {
        if (json_ld)
            this._media_props_from_json_ld(props, json_ld);

        this.parent(props, json_ld);
    },

    _media_props_from_json_ld: function (props, json_ld) {
        // Marshal properties specific to MediaObjectModel
        if (json_ld.hasOwnProperty('caption'))
            props.caption = json_ld.caption;

        if (json_ld.hasOwnProperty('height'))
            props.height = parseInt(json_ld.height);

        if (json_ld.hasOwnProperty('width'))
            props.width = parseInt(json_ld.width);
    }
});

/**
 * Class: ImageObjectModel
 * The model class for media objects. A media obejct has the same properties as
 * a <MediaObjectModel>
 */
const ImageObjectModel = Lang.Class({
    Name: 'ImageObjectModel',
    GTypeName: 'EknImageObjectModel',
    Extends: MediaObjectModel,

    _init: function (props={}, json_ld=null) {
        this.parent(props, json_ld);
    },
});

/**
 * Class: VideoObjectModel
 * The model class for media objects. A media obejct has the same 
 * properties as a <MediaObjectModel>, plus <duration> and <transcript>
 * properties
 */
const VideoObjectModel = Lang.Class({
    Name: 'VideoObjectModel',
    GTypeName: 'EknVideoObjectModel',
    Extends: MediaObjectModel,
    Properties: {
        /**
         * Property: duration
         * The duration of the video in ISO 8601 format. Defaults to empty
         * string
         */
        'duration': GObject.ParamSpec.string('duration',
            'Duration', 'The duration of the video in ISO 8601 format',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            ''),

        /**
         * Property: transcript
         * Transcript of the video, in the same language as the video. Defaults
         * to empty string
         */
        'transcript': GObject.ParamSpec.string('transcript',
            'Transcript', 'Transcript of the video',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            ''),
    },

    _init: function (props={}, json_ld=null) {
        if (json_ld)
            this._video_props_from_json_ld(props, json_ld);

        this.parent(props, json_ld);
    },

    _video_props_from_json_ld: function (props, json_ld) {
        if (json_ld.hasOwnProperty('duration'))
            props.duration = json_ld.duration;

        if (json_ld.hasOwnProperty('transcript'))
            props.transcript = json_ld.transcript;
    },
});
