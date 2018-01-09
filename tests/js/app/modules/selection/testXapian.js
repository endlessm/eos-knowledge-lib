// Copyright 2017 Endless Mobile, Inc.

const Eknc = imports.gi.EosKnowledgeContent;
const Minimal = imports.tests.minimal;
const Module = imports.app.interfaces.module;
const MockEngine = imports.tests.mockEngine;
const MockFactory = imports.tests.mockFactory;
const Xapian = imports.app.modules.selection.xapian;

var SampleXapianSelection = new Module.Class({
    Name: 'SampleXapianSelection',
    Extends: Xapian.Xapian,

    _init: function (props={}) {
        this.parent(props);
        this._set_needs_refresh(true);
    },

    construct_query_object: function (limit, query_index) {
        if (query_index == 0) {
            return new Eknc.QueryObject({
                limit: limit,
                tags_match_all: ['foobar'],
            });
        } else if (query_index == 1) {
            return new Eknc.QueryObject({
                limit: limit,
                tags_match_all: ['baz'],
            });
        }
        return null;
    },
});

describe('Selection.Xapian superclass', function () {
    let engine, factory, selection;

    beforeEach(function () {
        engine = MockEngine.mock_default();
        [selection, factory] = MockFactory.setup_tree({
            type: SampleXapianSelection,
            slots: {
                'order': { type: Minimal.MinimalXapianOrder },
                'filter': { type: Minimal.MinimalXapianFilter },
            },
        });
    });

    it('modifies the Xapian query when retrieving subsequent query indices', function (done) {
        let returnedEmpty = false;
        engine.query_promise.and.callFake(query => {
            if (!returnedEmpty) {
                returnedEmpty = true;
                return Promise.resolve({
                    models: [],
                    upper_bound: 0,
                });
            }
            return Promise.resolve({
                models: [new Eknc.ContentObjectModel()],
                upper_bound: 1,
            });
        });

        selection.queue_load_more(1);
        let connectionId = selection.connect('models-changed', () => {
            let query1 = engine.query_promise.calls.argsFor(0)[0];
            let query2 = engine.query_promise.calls.argsFor(1)[0];
            expect(query1.search_terms).toEqual('null title');
            expect(query1.tags_match_all).toEqual(['foobar', 'EknIncludeMe']);
            expect(query2.search_terms).toEqual('null title');
            expect(query2.tags_match_all).toEqual(['baz', 'EknIncludeMe']);
            selection.disconnect(connectionId);
            done();
        })
    });
});
