const GObject = imports.gi.GObject;
const Lang = imports.lang;

const MockShardFile = new Lang.Class({
    Name: 'MockShardFile',
    Extends: GObject.Object,

    _init: function (props={}) {
        this.parent(props);

        spyOn(this, 'find_record_by_hex_name');
        spyOn(this, 'init');
    },

    init: function () {},
    find_record_by_hex_name: function () {},
});

const MockDictionary = new Lang.Class({
    Name: 'MockDictionary',
    Extends: GObject.Object,

    _init: function (dict) {
        this._dict = dict;
    },

    lookup_key: function (key) {
        if (this._dict.hasOwnProperty(key)) return this._dict[key];
        return null;
    },
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
    load_as_dictionary: function () {},
});
