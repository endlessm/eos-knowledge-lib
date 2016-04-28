// Copyright (C) 2016 Endless Mobile, Inc.

// Ensures that all tags with class .eos-no-link are <span>
// elements, so that they do not appear clickable, but still
// retain any attributes they originally had.
// Borrowed from: http://stackoverflow.com/questions/7093417/using-jquery-to-replace-one-tag-with-another/20493562#20493562
$('.eos-no-link').replaceWith(function () {
    var replacement = $('<span>').html(this.innerHTML);
    for (var i = 0; i < this.attributes.length; i++) {
        var attr_name = this.attributes[i].name;
        var attr_value = this.attributes[i].value;
        if (attr_name !== 'title') {
            replacement.attr(attr_name, attr_value);
        }
    }
    return replacement;
});
