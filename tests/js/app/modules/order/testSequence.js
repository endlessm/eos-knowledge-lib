// Copyright 2018 Endless Mobile, Inc.

const Eknc = imports.gi.EosKnowledgeContent;
const Gtk = imports.gi.Gtk;
Gtk.init(null);

const Utils = imports.tests.utils;
Utils.register_gresource();

const MockFactory = imports.tests.mockFactory;
const Sequence = imports.app.modules.order.sequence;

describe('Order.Sequence', function () {
    let order, models;

    const SORTED_SEQ   = [0, 1, 2, 3, 4];
    const UNSORTED_SEQ = [2, 3, 4, 0, 1];

    beforeEach(function () {
        models = UNSORTED_SEQ.map(seq =>
            Eknc.ArticleObjectModel.new_from_props({ sequence_number: seq }));
    });

    describe('ascending', function () {
        beforeEach(function () {
            [order] = MockFactory.setup_tree({
                type: Sequence.Sequence,
            });
        });

        it('is the default', function () {
            expect(order.ascending).toBeTruthy();
        });

        it('sorts models by sequence number', function () {
            expect(models.sort(order.compare.bind(order))
                .map(model => model.sequence_number)).toEqual(SORTED_SEQ);
        });

        it('queries models by sequence number', function () {
            let query = order.modify_xapian_query(new Eknc.QueryObject());
            expect(query.order).toEqual(Eknc.QueryObjectOrder.ASCENDING);
            expect(query.sort).toEqual(Eknc.QueryObjectSort.SEQUENCE_NUMBER);
        });
    });

    describe('descending', function () {
        beforeEach(function () {
            [order] = MockFactory.setup_tree({
                type: Sequence.Sequence,
                properties: {
                    'ascending': false,
                },
            });
        });

        it('sorts models by sequence number', function () {
            expect(models.sort(order.compare.bind(order))
                .map(model => model.sequence_number)).toEqual(SORTED_SEQ.reverse());
        });

        it('queries models by sequence number', function () {
            let query = order.modify_xapian_query(new Eknc.QueryObject());
            expect(query.order).toEqual(Eknc.QueryObjectOrder.DESCENDING);
            expect(query.sort).toEqual(Eknc.QueryObjectSort.SEQUENCE_NUMBER);
        });
    });
});
