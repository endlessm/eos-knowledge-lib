// Copyright 2016 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Actions = imports.app.actions;
const Card = imports.app.interfaces.card;
const CardContainer = imports.app.modules.contentGroup.cardContainer;
const Dispatcher = imports.app.dispatcher;
const Engine = imports.search.engine;
const Module = imports.app.interfaces.module;
const QueryObject = imports.search.queryObject;

// Big enough to still provide enough material for sorting and filtering:
const _BATCH_SIZE = 50;

/**
 * Class: SetPreview
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
 *   header-card - type of card to create for title label
 */
const SetPreview = new Module.Class({
    Name: 'Card.SetPreview',
    Extends: CardContainer.CardContainer,
    Implements: [Card.Card],

    Slots: {
        'header-card': {
            multi: true,
        },
    },

    _init: function (props={}) {
        this.parent(props);

        // Replace CardContainer's title button with a real card (usually a
        // TitleCard)
        this.title_button.hide();
        let header_card = this.create_submodule('header-card', {
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
            limit: _BATCH_SIZE,
            tags: this.model.child_tags,
            sort: QueryObject.QueryObjectSort.SEQUENCE_NUMBER,
        });
        Engine.get_default().get_objects_by_query(query, null, (engine, res) => {
            let models, get_more;
            try {
                [models, get_more] = engine.get_objects_by_query_finish(res);
            } catch (e) {
                logError(e, 'Failed to load articles from database');
                return;
            }
            this.arrangement.set_models(models);
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

