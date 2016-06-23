// Copyright 2016 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const ContentGroup = imports.app.modules.contentGroup.contentGroup;
const Module = imports.app.interfaces.module;

/**
 * Class: DynamicTitle
 */
const DynamicTitle = new Module.Class({
    Name: 'DynamicTitle',
    CssName: 'EknDynamicTitle',
    Extends: Gtk.Label,

    Properties: {
        /**
         * Property: format-string
         * The format string for this title. Defaults to an empty string.
         */
        'format-string': GObject.ParamSpec.string('format-string', 'Format string',
            'The format string for this title',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, '%s'),
    },

    make_ready: function (cb = function () {}) {
        let content_group = this.get_ancestor(ContentGroup.ContentGroup.$gtype);
        if (content_group === null)
            throw new Error('DynamicTitles must be a descendant of ContentGroup');

        // FIXME: Remove this when we come up with a better way to handle dynamic titles
        // in https://phabricator.endlessm.com/T11907
        this.label = this.format_string.format(content_group.get_selection().model.title);

        content_group.get_selection().connect('notify::model', () => {
            this.label = this.format_string.format(content_group.get_selection().model.title);
        });
        cb();
    },
});
