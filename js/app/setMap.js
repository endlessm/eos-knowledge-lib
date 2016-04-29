let tagMap;
let parentMap;

function init_map_with_models (models) {
    tagMap = new Map();
    parentMap = new Map();
    models.forEach((model) => {
        model.child_tags.filter((tag) => !tag.startsWith('Ekn')).forEach((tag) => {
            tagMap.set(tag, model);
        });
    });

    models.forEach((model) => {
        model.tags.filter((tag) => !tag.startsWith('Ekn')).forEach((tag) => {
            parentMap.set(model.ekn_id, tagMap.get(tag));
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
    return parentMap.get(subset.ekn_id);
}
