// Copyright (C) 2016 Endless Mobile, Inc.

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
    return tagMap.get(tag);
}

function get_parent_set (subset) {
    return parentMap.get(subset.ekn_id);
}
