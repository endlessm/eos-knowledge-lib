// Copyright 2016 Endless Mobile, Inc.

const Gio = imports.gi.Gio;

const NDNDownloader = imports.search.downloader.ndn;
const SoupDownloader = imports.search.downloader.soup;

let the_downloader = null;
let get_default = function () {
    if (the_downloader === null) {
        let app = Gio.Application.get_default();
        try {
            the_downloader = new NDNDownloader(app);
        } catch {
            the_downloader = new SoupDownloader(app);
        }

    }
    return the_downloader;
};
