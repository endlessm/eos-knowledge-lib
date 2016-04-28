// Copyright (C) 2015-2016 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;
Gtk.init(null);

const Actions = imports.app.actions;
const ArticleObjectModel = imports.search.articleObjectModel;
const ContextBanner = imports.app.modules.contextBanner;
const MockDispatcher = imports.tests.mockDispatcher;
const SetObjectModel = imports.search.setObjectModel;

describe('Context banner', function () {
    let module, dispatcher;

    beforeEach(function () {
        dispatcher = MockDispatcher.mock_default();
        module = new ContextBanner.ContextBanner();
        module.label = 'clobber me';
    });

    it('constructs', function () {
        expect(module).toEqual(jasmine.anything());
    });

    it('changes the context label when going to the home page', function () {
        dispatcher.dispatch({
            action_type: Actions.SHOW_HOME_PAGE,
        });
        expect(module.label).not.toEqual('clobber me');
    });

    it('displays the set name when showing a set', function () {
        dispatcher.dispatch({
            action_type: Actions.SHOW_SET,
            model: new SetObjectModel.SetObjectModel({
                title: 'Set title',
            }),
        });
        expect(module.label).toEqual('Set title');
    });

    it('displays the context label when showing an article', function () {
        dispatcher.dispatch({
            action_type: Actions.SHOW_ARTICLE_PAGE,
            context_label: 'Some context',
        });
        expect(module.label).toEqual('Some context');
    });


    describe('when showing search', function () {
        beforeEach(function () {
            dispatcher.dispatch({
                action_type: Actions.APPEND_SEARCH,
                models: [0, 1, 2, 3].map(() =>
                    new ArticleObjectModel.ArticleObjectModel()),
            });
            dispatcher.dispatch({
                action_type: Actions.SEARCH_READY,
                query: 'some user text',
            });
        });

        it('displays the user query when showing search', function () {
            expect(module.label).toMatch(/some user text/);
        });
    });
});
