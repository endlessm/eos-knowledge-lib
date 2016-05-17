// Copyright 2016 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

Gtk.init(null);

const Actions = imports.app.actions;
const ContentObjectModel = imports.search.contentObjectModel;
const Minimal = imports.tests.minimal;
const MockDispatcher = imports.tests.mockDispatcher;
const MockFactory = imports.tests.mockFactory;
const Standalone = imports.app.modules.page.standalone;
const Utils = imports.tests.utils;

describe('Standalone page', function () {
    let page, factory, dispatcher;

    beforeEach(function () {
        dispatcher = MockDispatcher.mock_default();
        factory = new MockFactory.MockFactory();
        factory.add_named_mock('card', Minimal.MinimalDocumentCard);
        factory.add_named_mock('page', Standalone.Standalone, {
            'card-type': 'card',
        });
        page = factory.create_named_module('page');
    });

    it('loads a document when show article is dispatched with an archived article', function () {
        let model = new ContentObjectModel.ContentObjectModel();
        dispatcher.dispatch({
            action_type: Actions.SHOW_ARTICLE,
            model: model,
            archived: true,
        });
        Utils.update_gui();
        let card = factory.get_last_created_named_mock('card');
        expect(card.model).toBe(model);
    });
});
