
function chunk_init (global_chunk_data) {
    var CHUNK_TYPES = {
        "ParentFeaturedSets": function (chunk_elem, sets) {
            var link_elems = sets.map(function (set_object) {
                var link_elem = document.createElement('a');
                link_elem.href = set_object.ekn_id;
                link_elem.textContent = set_object.title;
                return link_elem;
            });

            var p = document.createElement('p');
            links.forEach(function (link_elem) {
                p.appendChild(link_elem);
            });

            chunk_elem.appendChild(p);
        },
    };

    [].forEach.call(document.querySelectorAll('[data-ekn-chunk-type]'), function (chunk_elem) {
        var chunk_type = chunk_elem.dataset.eknChunkType;

        var chunk_func = CHUNK_TYPES[chunk_type];
        var chunk_data = global_chunk_data[chunk_type];
        if (chunk_func === undefined)
            throw new Error("Cannot make chunk type " + chunk_type);
        if (chunk_data === undefined)
            throw new Error("Cannot find chunk data " + chunk_type);
        chunk_func(chunk_elem, chunk_data);
    });
}
