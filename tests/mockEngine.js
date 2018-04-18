const {DModel, GObject} = imports.gi;
const Lang = imports.lang;

var MockEngine = new Lang.Class({
    Name: 'MockEngine',
    Extends: GObject.Object,

    _init: function () {
        this.parent();
        this.host = 'localhost';
        this.port = 3003;
        this.language = '';

        // get_object_promise() and query_promise() are spies to begin
        // with, since that is how they will usually be used.
        // Use like so, for example:
        // engine.get_object_promise.and.returnValue(Promise.resolve(my_object));
        // engine.query_promise.and.returnValue(Promise.resolve([[object1,
        //    object2], {}]))
        spyOn(this, 'get_object_promise').and.callThrough();
        spyOn(this, 'query_promise').and.callThrough();
    },

    get_id: function () {},

    // FIXME: we launch into the callbacks synchronously because all the tests
    // in testAisleController expect it currently. Would be good to rewrite
    // those tests to tolerate a mock object that was actually async.

    get_object_promise: function () {
        return Promise.resolve();
    },

    query_promise: function () {
        return Promise.resolve({ models: [], upper_bound: 0 });
    },
});

// Creates a new MockEngine and sets it up as the engine singleton. Use
// in a beforeEach to have a new engine each test iteration.
var mock_default = () => {
    let engine = new MockEngine();
    spyOn(DModel.Engine, 'get_default').and.returnValue(engine);
    return engine;
};
