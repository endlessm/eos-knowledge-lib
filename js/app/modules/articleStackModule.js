// Copyright 2015 Endless Mobile, Inc.

const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const Module = imports.app.interfaces.module;
const SequenceCard = imports.app.modules.sequenceCard;

/**
 * Class: ArticleStackModule
 *
 * Listens for the show-article action to be dispatched, creates a document
 * card, starts an asynchronous load of the document content and transitions
 * in the content when its ready.
 */
const ArticleStackModule = new Lang.Class({
    Name: 'ArticleStackModule',
    GTypeName: 'EknArticleStackModule',
    Extends: Gtk.Stack,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        /**
         * Property: engine
         * Handle to EOS knowledge engine. For testing only.
         */
        'engine': GObject.ParamSpec.object('engine', 'Engine',
            'Handle to EOS knowledge engine',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            GObject.Object.$gtype),
    },

    CONTENT_TRANSITION_DURATION: 500,

    _init: function (props={}) {
        props.expand = true;
        props.visible = true;
        props.transition_duration = this.CONTENT_TRANSITION_DURATION;
        this.parent(props);

        Dispatcher.get_default().register((payload) => {
            switch(payload.action_type) {
                case Actions.SHOW_ARTICLE:
                    this._show_article(payload);
                    break;
            }
        });

        // Clear old views from the stack when its not animating.
        this.connect('notify::transition-running', () => {
            if (!this.transition_running) {
                for (let child of this.get_children()) {
                    if (child !== this.visible_child)
                        this.remove(child);
                }
            }
        });
    },

    _show_article: function (payload) {
        let document_card_props = {
            model: payload.model,
        };
        if (payload.previous_model) {
            let card = new SequenceCard.SequenceCard({
                model: payload.previous_model,
                sequence: SequenceCard.Sequence.PREVIOUS,
            });
            document_card_props.previous_card = card;
            card.connect('clicked', () => {
                Dispatcher.get_default().dispatch({
                    action_type: Actions.PREVIOUS_DOCUMENT_CLICKED,
                    model: card.model,
                });
            });
        }
        if (payload.next_model) {
            let card = new SequenceCard.SequenceCard({
                model: payload.next_model,
                sequence: SequenceCard.Sequence.NEXT,
            });
            document_card_props.next_card = card;
            card.connect('clicked', () => {
                Dispatcher.get_default().dispatch({
                    action_type: Actions.NEXT_DOCUMENT_CLICKED,
                    model: card.model,
                });
            });
        }
        let document_card = this.create_submodule('card-type', document_card_props);

        document_card.connect('ekn-link-clicked', (card, ekn_id) => {
            Dispatcher.get_default().dispatch({
                action_type: Actions.ARTICLE_LINK_CLICKED,
                ekn_id: ekn_id,
            });
        });

        if (payload.animation_type === EosKnowledgePrivate.LoadingAnimation.FORWARDS_NAVIGATION) {
            this.transition_type = Gtk.StackTransitionType.SLIDE_LEFT;
        } else if (payload.animation_type === EosKnowledgePrivate.LoadingAnimation.BACKWARDS_NAVIGATION) {
            this.transition_type = Gtk.StackTransitionType.SLIDE_RIGHT;
        } else {
            this.transition_type = Gtk.StackTransitionType.NONE;
        }

        document_card.load_content(null, (card, task) => {
            try {
                document_card.load_content_finish(task);
                if (document_card.get_parent() !== null) {
                    document_card.reparent(this);
                } else {
                    this.add(document_card);
                }
                document_card.show_all();
                this.visible_child = document_card;
                document_card.grab_focus();
            } catch (error) {
                logError(error);
            }
        });
    },

    get_slot_names: function () {
        return ['card-type'];
    },
});
