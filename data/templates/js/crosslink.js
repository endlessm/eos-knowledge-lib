// For each link, look it up in our cross-link table.

[].forEach.call(document.querySelectorAll('a, area'), function (link) {
    if (link.dataset.eknLinkTableIdx === undefined)
        return;

    var link_table_idx = parseInt(link.dataset.eknLinkTableIdx);

    // A link is given a type during the app build process, and describes how
    // links to nonexistent content should be handled. If links are tagged with
    // "Internal", then they should only be active if our app contains the
    // content being linked to. "External" links should always remain active,
    // and will open in a browser if the app doesn't contain that content.
    var link_type = link.dataset.eknLinkType;

    var ekn_id = window.LINKS[link_table_idx];
    if (ekn_id) {
        link.setAttribute('href', ekn_id);
    } else {
        // For internal links, we disable them entirely when we can't
        // find them.
        if (link_type === 'Internal')
            link.classList.add('eos-no-link');
    }
});
