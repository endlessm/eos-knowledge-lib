// Copyright 2016 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const ContentGroup = imports.app.modules.contentGroup.contentGroup;
const FormattableLabel = imports.app.widgets.formattableLabel;
const Module = imports.app.interfaces.module;

/**
 * Class: DynamicTitle
 */
var DynamicTitle = new Module.Class({
    Name: 'ContentGroup.DynamicTitle',
    Extends: FormattableLabel.FormattableLabel,

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

        let selection = content_group.get_selection();
        let update_label = () => {
            if (selection.model)
                this.label = this.format_string.format(selection.model.title);
        };

        // FIXME: Remove this when we come up with a better way to handle dynamic titles
        // in https://phabricator.endlessm.com/T11907
        update_label();

        selection.connect('notify::model', update_label);
        cb();
    },
});
