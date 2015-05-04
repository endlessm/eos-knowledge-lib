// Copyright 2014 Endless Mobile, Inc.

function _getHeader() {
    return document.getElementById('headline');
}

function _getSearchResultsList() {
    return document.getElementsByClassName('search-results')[0];
}

function setSearchInProgress(query) {
    _getHeader().innerHTML =
        /* TRANSLATORS: This message is displayed while the encyclopedia app is
        searching for results. The {search} will be replaced with the term that
        the user searched for. Note, in English, it is surrounded by Unicode
        left and right double quotes (U+201C and U+201D). Make sure to use
        whatever quote marks are appropriate for your language. */
        _("Searching for “{search}”").replace('{search}',
            '<span class="search-query">' + query + '</span>');
}

function setSearchDone(query) {
    _getHeader().innerHTML =
        /* TRANSLATORS: This message is displayed when the encyclopedia app is
        done searching for results. The {search} will be replaced with the term
        that the user searched for. Note, in English, it is surrounded by
        Unicode left and right double quotes (U+201C and U+201D). Make sure to
        use whatever quote marks are appropriate for your language. */
        _("Search results for “{search}”").replace('{search}',
            '<span class="search-query">' + query + '</span>');
}

function hideSpinner() {
    var spinner = document.getElementsByClassName('spinner')[0];
    spinner.setAttribute('style', 'display: none;');
}

function clearSearchResults() {
    var searchResultsList = _getSearchResultsList();
    while (searchResultsList.firstChild)
        searchResultsList.removeChild(searchResultsList.firstChild);
}

function appendSearchResults(results) {
    var searchResultsList = _getSearchResultsList();
    results.forEach(function (item) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.textContent = item.title;
        a.setAttribute('href', item.uri);
        li.appendChild(a);
        searchResultsList.appendChild(li);
    });
}
