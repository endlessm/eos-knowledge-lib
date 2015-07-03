// Copyright 2014 Endless Mobile, Inc.

const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Module = imports.app.interfaces.module;
const ImagePreviewer = imports.app.imagePreviewer;

/**
 * Class: AppBanner
 *
 * A module for the application's logo.
 * It will have the 'app-banner' CSS class applied to it.
 */
const AppBanner = new Lang.Class({
    Name: 'AppBanner',
    GTypeName: 'EknAppBanner',
    Extends: ImagePreviewer.ImagePreviewer,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),

        /**
         * Property: image-uri
         * A URI to the title image. Defaults to an empty string.
         */
        'image-uri': GObject.ParamSpec.string('image-uri', 'Page Title Image URI',
            'URI to the title image',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, ''),
    },

    Template: 'resource:///com/endlessm/knowledge/widgets/appBanner.ui',

    _init: function (props={}) {
        this.parent(props);
    },

    set image_uri (v) {
        if (this._image_uri === v)
            return;

        if (v) {
            let stream = Gio.File.new_for_uri(v).read(null);
            this.set_content(stream);
        }

        // only actually set the image URI if we successfully set the image
        this._image_uri = v;
        this.notify('image-uri');
    },

    get image_uri () {
        return this._image_uri;
    },
});
