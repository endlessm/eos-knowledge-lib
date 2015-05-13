// Copyright 2014 Endless Mobile, Inc.

document.onreadystatechange = function () {
    document.getElementById('headline').textContent = _("OOPS!");
    document.getElementById('message2').textContent =
        _("Try repeating your search with other words.");
};

function setQueryString(query) {
    document.getElementById('message1').textContent =
        /* TRANSLATORS: This message is displayed when the encyclopedia app did
        not find any results for a search. The {query} will be replaced with the
        term that the user searched for. Note, in English, it is surrounded by
        Unicode left and right double quotes (U+201C and U+201D). Make sure to
        use whatever quote marks are appropriate for your language. */
        _("We did not find any results for “{query}”.").replace('{query}', query);
}
