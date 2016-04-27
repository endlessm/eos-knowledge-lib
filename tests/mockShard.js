// Copyright (C) 2016 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Lang = imports.lang;

const MockShardFile = new Lang.Class({
    Name: 'MockShard',
    Extends: GObject.Object,

    _init: function (props={}) {
        this.parent(props);

        spyOn(this, 'find_record_by_hex_name');
        spyOn(this, 'init_async').and.callThrough();
    },

    init_async: function (priority, cancellable, callback) {
        callback(this);
    },
    init_finish: function () {},

    find_record_by_hex_name: function () {},
});

const MockShardRecord = new Lang.Class({
    Name: 'MockShardRecord',
    Extends: GObject.Object,

    _init: function (props={}) {
        this.parent(props);
    },
});

const MockShardBlob = new Lang.Class({
    Name: 'MockShardBlob',
    Extends: GObject.Object,

    _init: function (props={}) {
        this.parent(props);

        spyOn(this, 'get_stream');
    },

    get_stream: function () {},
});
