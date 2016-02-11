// Copyright 2016 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Actions = imports.app.actions;
const Card = imports.app.interfaces.card;
const Dispatcher = imports.app.dispatcher;
const Engine = imports.search.engine;
const Module = imports.app.interfaces.module;
const QueryObject = imports.search.queryObject;
const TextCard = imports.app.modules.textCard;

const NUM_ARTICLES_TO_SHOW = 3;

/**
 * Class: SetPreviewCard
 *
 * Class to show cards backed by a <SetObjectModel> in the knowledge lib UI
 *
 * This card will represent a set from our knowledge app database. It will show
 * the set title, followed by a small number of articles from that set, as a
 * preview. Clicking on the set title will then presumably take you to a page
 * showing a more complete version of the set's contents.
 *
 * Style classes:
 *   card - on the widget itself
 *   title - on the title label
 *
 * Slots:
 *   arrangement - arrangement in which to display this sets article cards.
 *   card-type - type of cards to create for articles
 */
const SetPreviewCard = new Lang.Class({
    Name: 'SetPreviewCard',
    GTypeName: 'EknSetPreviewCard',
    Extends: Gtk.Grid,
    Implements: [ Module.Module, Card.Card ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'model': GObject.ParamSpec.override('model', Card.Card),
        'title-capitalization': GObject.ParamSpec.override('title-capitalization',
            Card.Card),
        'highlight-string': GObject.ParamSpec.override('highlight-string', Card.Card),
        'text-halign': GObject.ParamSpec.override('text-halign', Card.Card),
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/setPreviewCard.ui',
    InternalChildren: [ 'see-more-label' ],

    _init: function (params={}) {
        this.parent(params);

        let card = new TextCard.TextCard({
            factory: this.factory,
            factory_name: this.factory_name,
            model: this.model,
            visible: true,
            halign: Gtk.Align.START,
        });

        card.connect('clicked', () => {
            Dispatcher.get_default().dispatch({
                action_type: Actions.SET_CLICKED,
                model: this.model,
            });
        });

        this.attach(card, 0, 0, 1, 1);
        this._arrangement = this.create_submodule('arrangement');
        this.attach(this._arrangement, 0, 1, 2, 1);
    },

    load_content: function () {
        this._arrangement.visible = true;
        let query = new QueryObject.QueryObject({
            limit: NUM_ARTICLES_TO_SHOW,
            tags: this.model.child_tags,
        });
        Engine.get_default().get_objects_by_query(query, null, (engine, res) => {
            let models, get_more;
            try {
                [models, get_more] = engine.get_objects_by_query_finish(res);
            } catch (e) {
                logError(e, 'Failed to load articles from database');
                return;
            }
            models.forEach(model => this._add_article_card(model));
        });
    },

    _add_article_card: function (model) {
        let card = this.create_submodule('card-type', {
            model: model,
        });
        card.connect('clicked', () => {
            Dispatcher.get_default().dispatch({
                action_type: Actions.ITEM_CLICKED,
                model: model,
                context: this._arrangement.get_cards().map((card) => card.model),
                context_label: this.model.title,
            });
        });
        this._arrangement.add_card(card);
    },

    // Module override
    get_slot_names: function () {
        return ['arrangement', 'card-type'];
    },
});

