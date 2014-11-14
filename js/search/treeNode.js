// Copyright 2014 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const TABLE_OF_CONTENTS_SCHEMA = 'tableOfContents';
const ID_SCHEMA = '@id';
const NODE_PARENT_SCHEMA = 'hasParent';
const NODE_INDEX_SCHEMA = 'hasIndex';
const NODE_INDEX_LABEL_SCHEMA = 'hasIndexLabel';
const NODE_LABEL_SCHEMA = 'hasLabel';
const NODE_CONTENT_SCHEMA = 'hasContent';

let TreeNodeColumn = {
    LABEL: 0,
    INDEX_LABEL: 1,
    CONTENT: 2,
};
TreeNodeColumn.NUM_COLUMNS = Object.keys(TreeNodeColumn).length;

/**
 * Section: TreeNode
 * RDF specification for a tree structure
 *
 * One of the limitations of RDF is that it doesn't have native support for
 * ordered lists or trees.
 * This makes it difficult to describe certain types of structured metadata,
 * like tables of contents.
 * To combat this, we use the TreeNode object which allows describing arbitrary
 * trees.
 * Each TreeNode can have any of five properties, prefixed by
 * *ekn:_vocab/TreeNode#*:
 *
 *   hasParent (<TreeNode>) - The <TreeNode> which is this node's parent, or
 *                            *null* if it has none
 *   hasIndex (Integer) - An integer describing the ordering of this node
 *                        amongst its siblings (0-based indexing)
 *   hasIndexLabel (String) - A displayable string representing this node's
 *                            index (order notwithstanding)
 *   hasLabel (String) - A displayable string describing the node's content
 *   hasContent (<ContentObject>) - The <ContentObject> that this node refers to
 *
 * These properties are represented by the shorthands *hasParent*, *hasIndex*,
 * *hasIndexLabel*, *hasLabel*, and *hasContent* respectively.
 *
 * For an example, see the <live document at http://goo.gl/t0CF7g>.
 */

/**
 * Function: tree_model_from_tree_node
 * Converts an RDF <TreeNode> JSON-LD object into a GTK tree model.
 *
 * Parameters:
 *
 *   json_obj - a JSON-LD document representing a <TreeNode>, which has been
 *              parsed into a Javascript *Object* using e.g. JSON.parse().
 *
 * Returns:
 *
 *   a *Gtk.TreeModel* with three string columns; see
 *     *TreeNodeColumn*.
 */
function tree_model_from_tree_node(json_obj) {
    let retval = new Gtk.TreeStore();
    retval.set_column_types([
        GObject.TYPE_STRING,
        GObject.TYPE_STRING,
        GObject.TYPE_STRING
    ]);

    // The usual way to build a tree out of a flat structure where parents are
    // indicated by an object ID, is to first make a mapping of IDs to objects.
    // See e.g. http://stackoverflow.com/questions/444296/

    let objects_by_id = {};
    // The passed-in json_obj should not be modified, so copy it
    let toc_copy = json_obj[TABLE_OF_CONTENTS_SCHEMA].slice(0);
    toc_copy.forEach(function (item) {
        objects_by_id[item[ID_SCHEMA]] = item;
    });

    // However, we must do some more fiddling, since we have the additional
    // constraints that
    // 1) the passed in json_obj should not be modified and neither should the
    //    items it contains
    // 2) the rows must be added to the GtkTreeStore in order, you cannot append
    //    a row number 2 if there is no row number 1.

    // FIXME
    // Alternative: when creating the objects_by_id mapping, create the 'proxy
    // nodes' at that point, and loop through the list again to set their
    // parents and children. Also create a list of toplevel objects in order.
    // Other alternative: require that the objects are specified in the JSON-LD
    // in order.

    let flat_list = [];
    toc_copy.forEach(function (item) {
        let new_item;
        let this_index = item[NODE_INDEX_SCHEMA];
        // Create a 'proxy node' in our tree structure so as not to modify the
        // original node. Proxy nodes can be blank if a child refers to a parent
        // that hasn't been processed yet, but at the end there should be no
        // blank nodes left.
        if (item[NODE_PARENT_SCHEMA] === undefined) {
            // If a parentless node, create it right on the toplevel
            if (flat_list[this_index] === undefined)
                flat_list[this_index] = { children: [] };
            new_item = flat_list[this_index];
        } else {
            // Otherwise, create a list of parent indices from the toplevel to
            // the current node, so that all parents of this node exist.
            let indices = [this_index];
            let parent_id = item[NODE_PARENT_SCHEMA];
            while (parent_id !== undefined) {
                let parent = objects_by_id[parent_id];
                indices.unshift(parent[NODE_INDEX_SCHEMA]);
                parent_id = parent[NODE_PARENT_SCHEMA];
            }
            let list_level = flat_list;
            indices.forEach(function (index) {
                // If that node has not been processed yet, create a blank one
                // that will be filled in later
                if (list_level[index] === undefined)
                    list_level[index] = { children: [] };
                new_item = list_level[index];
                list_level = new_item.children;
            });
        }
        new_item.index_label = item[NODE_INDEX_LABEL_SCHEMA];
        new_item.label = item[NODE_LABEL_SCHEMA];
        new_item.content = item[NODE_CONTENT_SCHEMA];
    });

    _add_items_to_tree_model_recursive(retval, null, flat_list);

    return retval;
}

function _add_items_to_tree_model_recursive(model, parent_iter, list) {
    list.forEach(function (item) {
        let iter = model.append(parent_iter);
        model.set_value(iter, TreeNodeColumn.LABEL, item.label);
        model.set_value(iter, TreeNodeColumn.INDEX_LABEL, item.index_label);
        model.set_value(iter, TreeNodeColumn.CONTENT, item.content);
        _add_items_to_tree_model_recursive(model, iter, item.children);
    });
}
