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

        // get_object() and query() are spies to begin
        // with, since that is how they will usually be used.
        // Use like so, for example:
        // engine.get_object.and.returnValue(Promise.resolve(my_object));
        // engine.query.and.returnValue(Promise.resolve([[object1,
        //    object2], {}]))
        spyOn(this, 'get_object').and.callThrough();
        spyOn(this, 'query').and.callThrough();
    },

    get_id: function () {},

    get_object() {
        return Promise.resolve();
    },

    query() {
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
