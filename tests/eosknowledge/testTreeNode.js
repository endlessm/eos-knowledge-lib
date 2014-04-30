// Copyright 2014 Endless Mobile, Inc.

const EosKnowledge = imports.gi.EosKnowledge;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

Gtk.init(null);

const TEST_OBJ = {
    tableOfContents: [
        {
            '@id': '_:1',
            nodeIndex: 0,
            nodeIndexLabel: '1',
            nodeLabel: 'Foo',
            nodeContent: 'http://skynet.com/content#Foo'
        },
        {
            '@id': '_:1.a',
            nodeIndex: 0,
            nodeIndexLabel: '1.a',
            nodeLabel: 'Lorum',
            nodeParent: '_:1',
            nodeContent: 'http://skynet.com/content#Lorum'
        },
        {
            '@id': '_:1.b',
            nodeIndex: 1,
            nodeIndexLabel: '1.b',
            nodeLabel: 'Ipsum',
            nodeParent: '_:1',
            nodeContent: 'http://skynet.com/content#Ipsum'
        },
        {
            '@id': '_:1.b.i',
            nodeIndex: 0,
            nodeIndexLabel: '1.b.i',
            nodeLabel: 'Blah',
            nodeParent: '_:1.b',
            nodeContent: 'http://skynet.com/content#Blah'
        },
        {
            '@id': '_:2',
            nodeIndex: 1,
            nodeIndexLabel: '2',
            nodeLabel: 'Bar',
            nodeContent: 'http://skynet.com/content#Bar'
        },
        {
            '@id': '_:3',
            nodeIndex: 2,
            nodeIndexLabel: '3',
            nodeLabel: 'Baz',
            nodeContent: 'http://skynet.com/content#Baz'
        }
    ]
};

let EXPECTED_TREE = {
    '0': 'Foo',
    '0:0': 'Lorum',
    '0:1': 'Ipsum',
    '0:1:0': 'Blah',
    '1': 'Bar',
    '2': 'Baz'
};

describe('TreeNode to GtkTreeModel converter', function () {
    let model;
    beforeEach(function () {
        model = EosKnowledge.tree_model_from_tree_node(TEST_OBJ);
    });

    it('creates a tree model with the appropriate columns', function () {
        expect(model.get_n_columns()).toEqual(EosKnowledge.TreeNodeColumn.NUM_COLUMNS);
        expect([
            EosKnowledge.TreeNodeColumn.LABEL,
            EosKnowledge.TreeNodeColumn.INDEX_LABEL,
            EosKnowledge.TreeNodeColumn.CONTENT
        ].map(function (undef, index) {
            return model.get_column_type(index);
        })).toEqual([
            GObject.TYPE_STRING,
            GObject.TYPE_STRING,
            GObject.TYPE_STRING
        ]);
    });

    it('converts an empty TreeNode', function () {
        const EMPTY_OBJ = { tableOfContents: [] };
        model = EosKnowledge.tree_model_from_tree_node(EMPTY_OBJ);
        let [has_elements, iter] = model.get_iter_first();
        expect(has_elements).toBe(false);
    });

    it('puts rows in the model', function () {
        let [has_elements, iter] = model.get_iter_first();
        expect(has_elements).toBe(true);
    });

    it('populates the correct fields of the model', function () {
        let [has_elements, iter] = model.get_iter_first();

        let label = model.get_value(iter, EosKnowledge.TreeNodeColumn.LABEL);
        expect(label).toEqual('Foo');

        let index_label = model.get_value(iter, EosKnowledge.TreeNodeColumn.INDEX_LABEL);
        expect(index_label).toEqual('1');

        let content = model.get_value(iter, EosKnowledge.TreeNodeColumn.CONTENT);
        expect(content).toEqual('http://skynet.com/content#Foo');
    });

    it('yields the correct tree when the input is in order', function () {
        Object.getOwnPropertyNames(EXPECTED_TREE).forEach(function (path_string) {
            let [success, iter] = model.get_iter_from_string(path_string);
            expect(success).toBe(true);
            let label = model.get_value(iter, EosKnowledge.TreeNodeColumn.LABEL);
            expect(label).toEqual(EXPECTED_TREE[path_string]);
        });
    });

    it('yields the correct tree when the input is not in order', function () {
        // Reverse the order of the nodes so that all children come before the
        // parents they reference
        let reversed_test_obj = {
            tableOfContents: TEST_OBJ.tableOfContents.slice(0).reverse()
        };
        model = EosKnowledge.tree_model_from_tree_node(reversed_test_obj);

        Object.getOwnPropertyNames(EXPECTED_TREE).forEach(function (path_string) {
            let [success, iter] = model.get_iter_from_string(path_string);
            expect(success).toBe(true);
            let label = model.get_value(iter, EosKnowledge.TreeNodeColumn.LABEL);
            expect(label).toEqual(EXPECTED_TREE[path_string]);
        });
    });
});
