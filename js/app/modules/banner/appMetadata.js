// Copyright 2017 Endless Mobile, Inc.

const AppStream = imports.gi.AppStream;
const GObject = imports.gi.GObject;

const FormattableLabel = imports.app.widgets.formattableLabel;
const Module = imports.app.interfaces.module;
const Utils = imports.app.utils;

/**
 * Class: AppMetadata
 *
 * A module to display the application metadata.
 *
 * This module can display the contents of the application
 * appdata XML file, e.g. name, summary, or description.
 */
const AppMetadata = new Module.Class({
    Name: 'AppMetadata',
    Extends: FormattableLabel.FormattableLabel,

    Properties: {
         /**
         * Property: field
         *
         * The specific field to display, e.g. name, summary, or description.
         */
        'field': GObject.ParamSpec.string('field', 'field', 'field',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            'description'),
    },

    _init: function (props={}) {
        this.parent(props);

        let appdata = Utils.get_appdata();
        if (appdata && appdata[this.field])
            this.label = AppStream.markup_convert_simple(appdata[this.field]);
    },
});
