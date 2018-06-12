let tagMap;
let parentMap;
let childrenMap;

function init_map_with_models (models) {
    tagMap = new Map();
    parentMap = new Map();
    childrenMap = new Map();

    models.forEach((model) => {
        model.child_tags.filter((tag) => !tag.startsWith('Ekn')).forEach((tag) => {
            tagMap.set(tag, model);
        });
    });

    models.forEach((model) => {
        model.tags.filter((tag) => !tag.startsWith('Ekn')).forEach((tag) => {
            parentMap.set(model.id, tagMap.get(tag));
        });
    });

    models.forEach((model) => {
        model.tags.filter((tag) => !tag.startsWith('Ekn')).forEach((tag) => {
            let parent = tagMap.get(tag);
            let children = childrenMap.get(parent.id);
            if (!children) {
                children = new Set();
                childrenMap.set(parent.id, children);
            }
            children.add(model);
        });
    });
}

function get_set_for_tag (tag) {
    if (!tagMap)
        return undefined;
    return tagMap.get(tag);
}

function get_parent_set (subset) {
    if (!parentMap)
        return undefined;
    return parentMap.get(subset.id);
}

function get_children_sets (set) {
    if (!childrenMap)
        return undefined;
    if (!childrenMap.has(set.id))
        return [];
    return [...childrenMap.get(set.id)];
}
