// Copyright 2016 Endless Mobile, Inc.

/* exported FormattableLabel */

const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Pango = imports.gi.Pango;

const Knowledge = imports.app.knowledge;
const Utils = imports.app.utils;

const TEXT_TRANSFORM_OPTIONS = {
    'uppercase': EosKnowledgePrivate.TextTransform.UPPERCASE,
    'lowercase': EosKnowledgePrivate.TextTransform.LOWERCASE,
    'none': EosKnowledgePrivate.TextTransform.NONE,
};

/**
 * Class: FormattableLabel
 *
 * The FormattableLabel extends Gtk.Label and adds a `text-transform` style
 * property. With this one, we can transform the label's text through CSS,
 * using the custom property `-EknFormattableLabel-text-transform`.
 *
 * Possible values are:
 *  * 'none' - No transformation is performed. Default.
 *  * 'uppercase' - The text is transformed to uppercase.
 *  * 'lowercase' - The text is transformed to lowercase.
 *
 * Notice that these values need to be specified as strings in the SCSS side of
 * things for these to be properly interpreted.
 *
 * Also, must notice that in order to separate the formatting from the actual value
 * of the label, we are encapsulating the value of the actual lable, i.e.
 * `label.get_label() !== label.label`
 */
// FIXME: This whole class should go away once we are able to support text-transform
// natively through Gtk CSS.
const FormattableLabel = new Knowledge.Class({
    Name: 'FormattableLabel',
    Extends: Gtk.Label,
    Properties: {
        /*
         * We have custom getter/setter for label
         */
        'label': GObject.ParamSpec.override('label', Gtk.Label),
    },

    StyleProperties: {
        /**
         * Property: text-transform
         * Manner in which the label is formatted
         *
         * Since we currently cannot achieve this via the CSS *text-transform* property,
         * we create this temporary stand-in for it.
         */
        'text-transform': GObject.ParamSpec.string('text-transform',
            'Label text transformation', 'Manner in which the label is formatted',
            GObject.ParamFlags.READWRITE, 'none'),
    },

    _init: function (props={}) {
        props.label = props.label || '';
        this._text_transform = 'none';
        this.parent(props);

        this.connect('style-set', this._update_custom_style.bind(this));
        this.connect('style-updated', this._update_custom_style.bind(this));
    },

    _update_custom_style: function () {
        this._text_transform = EosKnowledgePrivate.style_context_get_custom_string(
            this.get_style_context(), 'text-transform');
        if (TEXT_TRANSFORM_OPTIONS[this._text_transform] === undefined) {
            let error = new Error('Unrecognized option style property value for -EknFormattableLabel-text-transform ' +
                this._text_transform);
            logError(error);
            return;
        }
        this._format_label(this.get_label(), this._text_transform);
    },

    set label (v) {
        this._format_label(v, this._text_transform);
    },

    get label () {
        return this.get_label();
    },

    _format_label: function (text, transform) {
        if (!text)
            text = '';
        if (this.use_markup) {
            Pango.parse_markup(text, text.length, '0', null, text);
        }

        let transform_enum = TEXT_TRANSFORM_OPTIONS[transform];
        let formatted_label = Utils.format_capitals(text, transform_enum);
        this.set_label(formatted_label);
    },
});
