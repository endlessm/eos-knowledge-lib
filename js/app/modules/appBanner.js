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
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),

        /**
         * Property: image-uri
         * A URI to the title image. Defaults to an empty string.
         */
        'image-uri': GObject.ParamSpec.string('image-uri', 'Page Title Image URI',
            'URI to the title image',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, ''),
    },

    Template: 'resource:///com/endlessm/knowledge/widgets/appBanner.ui',

    _init: function (props={}) {
        this.parent(props);

        if (this.image_uri) {
            let stream = Gio.File.new_for_uri(this.image_uri).read(null);
            this.set_content(stream);
        }
    },
});
