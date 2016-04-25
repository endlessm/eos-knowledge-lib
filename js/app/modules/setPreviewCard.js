// Copyright 2016 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Actions = imports.app.actions;
const Card = imports.app.interfaces.card;
const CardContainer = imports.app.modules.cardContainer;
const Dispatcher = imports.app.dispatcher;
const Engine = imports.search.engine;
const Module = imports.app.interfaces.module;
const QueryObject = imports.search.queryObject;

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
 *
 * Slots:
 *   header-card-type - type of card to create for title label
 */
const SetPreviewCard = new Module.Class({
    Name: 'SetPreviewCard',
    GTypeName: 'EknSetPreviewCard',
    CssName: 'EknSetPreviewCard',
    Extends: CardContainer.CardContainer,
    Implements: [Card.Card],

    Slots: {
        'header-card-type': {},
    },

    _init: function (props={}) {
        this.parent(props);

        // Replace CardContainer's title button with a real card (usually a
        // TextCard)
        this.title_button.hide();
        let header_card = this.create_submodule('header-card-type', {
            model: this.model,
            halign: Gtk.Align.START,
        });
        this.attach(header_card, 0, 0, 1, 1);
        header_card.connect('clicked', () => {
            Dispatcher.get_default().dispatch({
                action_type: Actions.SET_CLICKED,
                model: this.model,
                context_label: this.model.title,
            });
        });
        this.title = this.model.title;  // triggers update

        if (this.show_trigger) {
            this.trigger.connect('clicked', () => {
                Dispatcher.get_default().dispatch({
                    action_type: Actions.SET_CLICKED,
                    model: this.model,
                    context_label: this.model.title,
                });
            });
        }

        Dispatcher.get_default().register(payload => {
            switch (payload.action_type) {
                case Actions.CLEAR_ITEMS:
                    this.arrangement.clear();
                    break;
                case Actions.FILTER_ITEMS:
                    this._filter_items(payload.ids);
                    break;
            }
        });
    },

    load_content: function (done) {
        this.arrangement.visible = true;
        let query = new QueryObject.QueryObject({
            limit: this.arrangement.get_max_cards(),
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
            models.forEach(model => this.arrangement.add_model(model));
            if (done)
                done();
        });
    },

    // CardContainer override
    card_clicked: function (arrangement, model) {
        Dispatcher.get_default().dispatch({
            action_type: Actions.ITEM_CLICKED,
            model: model,
            context: this.arrangement.get_models(),
            context_label: this.model.title,
        });
    },

    _filter_items: function (items) {
        this.arrangement.get_models()
            .filter(model => items.indexOf(model.ekn_id) !== -1)
            .forEach(this.arrangement.remove_model, this.arrangement);
    },
});

