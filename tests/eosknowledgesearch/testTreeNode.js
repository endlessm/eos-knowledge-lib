// Copyright 2014 Endless Mobile, Inc.

const EosKnowledgeSearch = imports.EosKnowledgeSearch;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const TEST_OBJ = {
    tableOfContents: [
        {
            '@id': '_:1',
            hasIndex: 0,
            hasIndexLabel: '1',
            hasLabel: 'Foo',
            hasContent: 'http://skynet.com/content#Foo'
        },
        {
            '@id': '_:1.a',
            hasIndex: 0,
            hasIndexLabel: '1.a',
            hasLabel: 'Lorum',
            hasParent: '_:1',
            hasContent: 'http://skynet.com/content#Lorum'
        },
        {
            '@id': '_:1.b',
            hasIndex: 1,
            hasIndexLabel: '1.b',
            hasLabel: 'Ipsum',
            hasParent: '_:1',
            hasContent: 'http://skynet.com/content#Ipsum'
        },
        {
            '@id': '_:1.b.i',
            hasIndex: 0,
            hasIndexLabel: '1.b.i',
            hasLabel: 'Blah',
            hasParent: '_:1.b',
            hasContent: 'http://skynet.com/content#Blah'
        },
        {
            '@id': '_:2',
            hasIndex: 1,
            hasIndexLabel: '2',
            hasLabel: 'Bar',
            hasContent: 'http://skynet.com/content#Bar'
        },
        {
            '@id': '_:3',
            hasIndex: 2,
            hasIndexLabel: '3',
            hasLabel: 'Baz',
            hasContent: 'http://skynet.com/content#Baz'
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
        model = EosKnowledgeSearch.tree_model_from_tree_node(TEST_OBJ);
    });

    it('creates a tree model with the appropriate columns', function () {
        expect(model.get_n_columns()).toEqual(EosKnowledgeSearch.TreeNodeColumn.NUM_COLUMNS);
        expect([
            EosKnowledgeSearch.TreeNodeColumn.LABEL,
            EosKnowledgeSearch.TreeNodeColumn.INDEX_LABEL,
            EosKnowledgeSearch.TreeNodeColumn.CONTENT
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
        model = EosKnowledgeSearch.tree_model_from_tree_node(EMPTY_OBJ);
        let [has_elements, iter] = model.get_iter_first();
        expect(has_elements).toBe(false);
    });

    it('puts rows in the model', function () {
        let [has_elements, iter] = model.get_iter_first();
        expect(has_elements).toBe(true);
    });

    it('populates the correct fields of the model', function () {
        let [has_elements, iter] = model.get_iter_first();

        let label = model.get_value(iter, EosKnowledgeSearch.TreeNodeColumn.LABEL);
        expect(label).toEqual('Foo');

        let index_label = model.get_value(iter, EosKnowledgeSearch.TreeNodeColumn.INDEX_LABEL);
        expect(index_label).toEqual('1');

        let content = model.get_value(iter, EosKnowledgeSearch.TreeNodeColumn.CONTENT);
        expect(content).toEqual('http://skynet.com/content#Foo');
    });

    it('yields the correct tree when the input is in order', function () {
        Object.getOwnPropertyNames(EXPECTED_TREE).forEach(function (path_string) {
            let [success, iter] = model.get_iter_from_string(path_string);
            expect(success).toBe(true);
            let label = model.get_value(iter, EosKnowledgeSearch.TreeNodeColumn.LABEL);
            expect(label).toEqual(EXPECTED_TREE[path_string]);
        });
    });

    it('yields the correct tree when the input is not in order', function () {
        // Reverse the order of the nodes so that all children come before the
        // parents they reference
        let reversed_test_obj = {
            tableOfContents: TEST_OBJ.tableOfContents.slice(0).reverse()
        };
        model = EosKnowledgeSearch.tree_model_from_tree_node(reversed_test_obj);

        Object.getOwnPropertyNames(EXPECTED_TREE).forEach(function (path_string) {
            let [success, iter] = model.get_iter_from_string(path_string);
            expect(success).toBe(true);
            let label = model.get_value(iter, EosKnowledgeSearch.TreeNodeColumn.LABEL);
            expect(label).toEqual(EXPECTED_TREE[path_string]);
        });
    });
});
