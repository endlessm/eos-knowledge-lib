const GObject = imports.gi.GObject;
const Lang = imports.lang;

const MockEngine = new Lang.Class({
    Name: 'MockEngine',
    Extends: GObject.Object,

    _init: function () {
        this.parent();
        this.host = 'localhost';
        this.port = 3003;
        this.language = '';

        // get_object_by_id() and get_objects_by_query() are spies to begin
        // with, since that is how they will usually be used.
        // Use like so, for example:
        // engine.get_object_by_id_finish.and.returnValue(my_object);
        // engine.get_objects_by_query_finish.and.returnValue([[object1,
        //    object2], null])
        spyOn(this, 'get_object_by_id').and.callThrough();
        spyOn(this, 'get_object_by_id_finish');
        spyOn(this, 'get_objects_by_query').and.callThrough();
        spyOn(this, 'get_objects_by_query_finish');
    },

    get_ekn_id: function () {},

    // FIXME: we launch into the callbacks synchronously because all the tests
    // in testReaderPresenter expect it currently. Would be good to rewrite
    // those tests to tolerate a mock object that was actually async.

    get_object_by_id: function (query, cancellable, callback) {
        callback(this);
    },

    get_object_by_id_finish: function () {},

    get_objects_by_query: function (query, cancellable, callback) {
        callback(this);
    },

    get_objects_by_query_finish: function () {},
});
