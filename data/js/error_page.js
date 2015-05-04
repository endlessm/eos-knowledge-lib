// Copyright 2014 Endless Mobile, Inc.

document.onreadystatechange = function () {
    document.getElementById('headline').textContent = _("OOPS!");
    document.getElementById('message1').textContent =
        _("There was an error during your search.");
    document.getElementById('message2').textContent =
        _("Try searching again, and if that doesn't work restart your computer.");
};
