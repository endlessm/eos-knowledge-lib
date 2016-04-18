// Ensures that all tags with class .eos-no-link are <span>
// elements, so that they do not appear clickable, but still
// retain any attributes they originally had.
// Borrowed from: http://stackoverflow.com/questions/7093417/using-jquery-to-replace-one-tag-with-another/20493562#20493562
Array.prototype.forEach.call(document.getElementsByTagName('a'), function (link) {
    if (link['href']) {
        var ekn_id = window.LINKS[link['href']];
        if (ekn_id) {
            link.className = '';
            link.setAttribute('href', ekn_id);
        }
    }
});
