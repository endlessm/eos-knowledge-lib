// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Card = imports.app.interfaces.card;
const Module = imports.app.interfaces.module;
const NavigationCard = imports.app.interfaces.navigationCard;
const Utils = imports.app.utils;

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
const SequenceCard = new Module.Class({
    Name: 'SequenceCard',
    CssName: 'EknSequenceCard',
    Extends: Gtk.Button,
    Implements: [Card.Card, NavigationCard.NavigationCard],

    Template: 'resource:///com/endlessm/knowledge/data/widgets/sequenceCard.ui',
    InternalChildren: [ 'title-label', 'next-label', 'previous-label' ],

    _init: function (params={}) {
        this.parent(params);

        Utils.set_hand_cursor_on_widget(this);
        this.set_title_label_from_model(this._title_label);
        this._title_label_text = this._title_label.label;

        this._previous_label.visible = (this.sequence === Card.Sequence.PREVIOUS);
        this._next_label.visible = (this.sequence === Card.Sequence.NEXT);
    },
});
