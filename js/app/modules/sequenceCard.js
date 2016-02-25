// Copyright 2015 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Card = imports.app.interfaces.card;
const Module = imports.app.interfaces.module;
const SearchUtils = imports.search.utils;
const Utils = imports.app.utils;

/**
 * Enum: Sequence
 *
 * PREVIOUS - Previous article in the sequence.
 * NEXT     - Next article in the sequence.
 */
const Sequence = SearchUtils.define_enum(['PREVIOUS', 'NEXT']);

/**
 * Class: SequenceCard
 * Card with a previous or next message.
 *
 * This widget displays a clickable topic to the user. Connect to the <clicked>
 * signal to perform an action when the user clicks on the card.
 *
 * Style classes:
 *   card, sequence-card - on the widget itself
 *   previous-label - on the previous label
 *   next-label - on the next label
 *   title - on the title label
 */
const SequenceCard = new Lang.Class({
    Name: 'SequenceCard',
    GTypeName: 'EknSequenceCard',
    Extends: Gtk.Button,
    Implements: [ Module.Module, Card.Card ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'model': GObject.ParamSpec.override('model', Card.Card),
        'title-capitalization': GObject.ParamSpec.override('title-capitalization', Card.Card),
        'context-capitalization': GObject.ParamSpec.override('context-capitalization',
            Card.Card),
        'highlight-string': GObject.ParamSpec.override('highlight-string', Card.Card),
        'text-halign': GObject.ParamSpec.override('text-halign', Card.Card),
        /**
         * Property: sequence
         * A <Sequence> value for the card. Previous or next.
         */
        'sequence': GObject.ParamSpec.uint('sequence', 'Sequence', 'Sequence',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            0, Object.keys(Sequence).length, Sequence.Previous),
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/sequenceCard.ui',
    InternalChildren: [ 'title-label', 'next-label', 'previous-label' ],

    _init: function (params={}) {
        this.parent(params);

        Utils.set_hand_cursor_on_widget(this);
        this.set_title_label_from_model(this._title_label);
        this._title_label_text = this._title_label.label;

        this._previous_label.visible = (this.sequence === Sequence.PREVIOUS);
        this._next_label.visible = (this.sequence === Sequence.NEXT);
    },
});
