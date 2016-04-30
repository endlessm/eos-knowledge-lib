// For each link, look it up in our cross-link table.

[].forEach.call(document.querySelectorAll('a, area'), function (link) {
    var link_table_idx = parseInt(link.dataset.somaLinkTableIdx);
    if (link_table_idx === undefined)
        return;

    var ekn_id = window.LINKS[link_table_idx];
    if (ekn_id) {
        link.setAttribute('href', ekn_id);
    } else {
        // For internal links, we disable them entirely when we can't
        // find them...
        if (link_type === "Internal")
            link.classList.add('eos-no-link');
    }
});
