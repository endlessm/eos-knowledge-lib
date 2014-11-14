// Copyright 2014 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

const ContentObjectModel = imports.contentObjectModel;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

/**
 * Class: MediaObjectModel
 * The model class for media objects. A media obejct has the same
 * properties as a <ContentObjectModel>, plus <caption>, <encoding-format>, <height>
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
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            ''),

        /**
         * Property: encoding-format
         * The format in which the content is encoded. Defaults to empty string
         */
        'encoding-format': GObject.ParamSpec.string('encoding-format',
            'Encoding Format', 'The format in which the content is encoded',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            ''),

        /**
         * Property: height
         * The height of the media in pixels. Defaults to 0
         */
        'height': GObject.ParamSpec.uint('height',
            'Height', 'The height of the media in pixels',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            0, GLib.MAXUINT32, 0),

        /**
         * Property: width
         * The width of the media in pixels. Defaults to 0
         */
        'width': GObject.ParamSpec.uint('width',
            'Width', 'The width of the media in pixels',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            0, GLib.MAXUINT32, 0)
    },

    _init: function (params) {
        this.parent(params);
    },

    get caption () {
        return this._caption;
    },

    get encoding_format () {
        return this._encoding_format;
    },

    get width () {
        return this._width;
    },

    get height () {
        return this._height;
    },

    set caption (v) {
        this._caption = v;
    },

    set encoding_format (v) {
        this._encoding_format = v;
    },

    set width (v) {
        this._width = v;
    },

    set height (v) {
        this._height = v;
    },
});

/**
 * Constructor: new_from_json_ld
 * Creates an MediaObjectModel from a Knowledge Engine MediaObject
 * JSON-LD document
 */
MediaObjectModel.new_from_json_ld = function (json_ld_data) {
    let props = MediaObjectModel._props_from_json_ld(json_ld_data);
    let media_object_model = new MediaObjectModel(props);

    MediaObjectModel._setup_from_json_ld(media_object_model, json_ld_data);
    return media_object_model;
};

MediaObjectModel._setup_from_json_ld = function (model, json_ld_data) {
    // Inherit setup from parent class
    let ParentClass = MediaObjectModel.__super__;
    ParentClass._setup_from_json_ld(model, json_ld_data);
};

MediaObjectModel._props_from_json_ld = function (json_ld_data) {
    // Inherit properties marshalled from parent class
    let ParentClass = MediaObjectModel.__super__;
    let props = ParentClass._props_from_json_ld(json_ld_data);

    // Marshal properties specific to MediaObjectModel
    if (json_ld_data.hasOwnProperty('caption')) {
        props.caption = json_ld_data.caption;
    }

    if (json_ld_data.hasOwnProperty('encodingFormat')) {
        props.encoding_format = json_ld_data.encodingFormat;
    }

    if (json_ld_data.hasOwnProperty('height')) {
        props.height = parseInt(json_ld_data.height);
    }

    if (json_ld_data.hasOwnProperty('width')) {
        props.width = parseInt(json_ld_data.width);
    }

    return props;
};

/**
 * Class: ImageObjectModel
 * The model class for media objects. A media obejct has the same properties as
 * a <MediaObjectModel>
 */
const ImageObjectModel = Lang.Class({
    Name: 'ImageObjectModel',
    GTypeName: 'EknImageObjectModel',
    Extends: MediaObjectModel,

    _init: function (props) {
        this.parent(props);
    }
});

/**
 * Constructor: new_from_json_ld
 * Creates an ImageObjectModel from a Knowledge Engine ImageObject
 * JSON-LD document
 */
ImageObjectModel.new_from_json_ld = function (json_ld_data) {
    let props = ImageObjectModel._props_from_json_ld(json_ld_data);
    return new ImageObjectModel(props);
};

ImageObjectModel._props_from_json_ld = function (json_ld_data) {
    // ImageObject inherits all its properties from its parent
    let ParentClass = ImageObjectModel.__super__;
    return ParentClass._props_from_json_ld(json_ld_data);
};

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
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            ''),

        /**
         * Property: transcript
         * Transcript of the video, in the same language as the video. Defaults
         * to empty string
         */
        'transcript': GObject.ParamSpec.string('transcript',
            'Transcript', 'Transcript of the video',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            ''),
    },

    _init: function (props) {
        this.parent(props);
    },

    get transcript () {
        return this._transcript;
    },

    get duration () {
        return this._duration;
    },

    set transcript (v) {
        this._transcript = v;
    },

    set duration (v) {
        this._duration = v;
    },

});

VideoObjectModel.new_from_json_ld = function (json_ld_data) {
    let props = VideoObjectModel._props_from_json_ld(json_ld_data);
    return new VideoObjectModel(props);
};

/**
 * Constructor: new_from_json_ld
 * Creates an VideoObjectModel from a Knowledge Engine VideoObject
 * JSON-LD document
 */
VideoObjectModel._props_from_json_ld = function (json_ld_data) {
    let ParentClass = VideoObjectModel.__super__;
    let props = ParentClass._props_from_json_ld(json_ld_data);

    if (json_ld_data.hasOwnProperty('duration')) {
        props.duration = json_ld_data.duration;
    }

    if (json_ld_data.hasOwnProperty('transcript')) {
        props.transcript = json_ld_data.transcript;
    }

    return props;
};
