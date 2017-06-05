/* exported Class, Module */

const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Introspect = imports.app.introspect;
const Knowledge = imports.app.knowledge;

/**
 * Class: Class
 * Counterpart to Lang.Class for modules
 *
 * To create a new module, use this metaclass as you would use Lang.Class to
 * create a regular class:
 *
 * > const MyModule = new Module.Class({
 * >     Name: 'MyModule',
 * >     Extends: GObject.Object,
 * > });
 *
 * The <Module.Module> interface is implemented automatically even if you don't
 * specify it, since all modules must implement this interface.
 */
const Class = new Lang.Class({
    Name: 'Class',
    Extends: Knowledge.Class,

    _construct: function (props={}) {
        // Make sure Module is implemented before chaining
        props.Implements = props.Implements || [];
        if (props.Implements.indexOf(Module) === -1)
            props.Implements.unshift(Module);

        let slots = _construct_slot_type(props, 'Slots', '__slots__');
        let references = _construct_slot_type(props, 'References', '__references__');

        let module = this.parent(props);

        _construct_slot_props(module, '__slots__', slots);
        _construct_slot_props(module, '__references__', references);

        /**
         * Method: get_slot_names
         * Class method for listing names of slots
         *
         * Returns an array containing the names of slots offered by this module.
         */
        module.get_slot_names = function () {
            return Object.keys(this.__slots__);
        };

        /**
         * Method: introspect
         * Class method for getting information about the module
         *
         * Returns a JSON object.
         */
        module.introspect = function () {
            return Introspect.introspect_module(this);
        };

        return module;
    },
});

function _construct_slot_type(props, slot_type, __slot_type__) {
    let slots = {};
    // Looking for the slot type properties on the interface's prototype
    // allows us to get away with not defining a separate meta-interface
    // for module interfaces. If we need something more fancy, such as
    // freezing the interface's slots object, we can switch later.
    props.Implements.forEach(iface => {
        if (iface.prototype[slot_type])
            Lang.copyProperties(iface.prototype[slot_type], slots);
    });
    if (props.Extends[__slot_type__])
        Lang.copyProperties(props.Extends[__slot_type__], slots);
    if (props[slot_type])
        Lang.copyProperties(props[slot_type], slots);
    delete props[slot_type];

    if (Object.keys(slots).some(name => name.indexOf('.') !== -1))
        throw new Error(slot_type + ' names should never contain a "."');

    return slots;
}

function _construct_slot_props(module, __slot_type__, slots) {
    Object.defineProperty(module, __slot_type__, {
        writable: false,
        configurable: false,
        enumerable: false,
        value: _freeze_recurse(slots),
    });
}

function _freeze_recurse(o) {
    if (typeof o !== 'object')
        return o;
    Object.getOwnPropertyNames(o).forEach(prop => _freeze_recurse(o[prop]));
    return Object.freeze(o);
}

/**
 * Interface: Module
 */
const Module = new Lang.Interface({
    Name: 'Module',
    Requires: [ GObject.Object ],

    Properties: {
        /**
         * Property: factory
         *
         * The <ModuleFactory> widget that is used to construct and return
         * the module to its parent application. The type of this property
         * is flexible to allow for factory mocking in tests.
         */
        'factory': GObject.ParamSpec.object('factory', 'Factory', 'Factory',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            GObject.Object.$gtype),

        /**
         * Property: factory_path
         * Path indicating where a module comes from in the app.json
         *
         * The factory path is used to identify this module within the app.json.
         * It is a string, like "root.submodule.multislot.345.content", though
         * you should not count on its contents being stable between releases.
         * This string is unique for each instance created and is used
         * internally.
         */
        'factory-path': GObject.ParamSpec.string('factory-path', 'Factory path',
            'Path indicating where a module comes from in the app.json',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            ''),

        /**
         * Property: factory_id
         *
         * The factory_id is used to identify this specific module instance. The
         * factory uses the id to pass this instance to other modules.
         */
        'factory-id': GObject.ParamSpec.string('factory-id', 'Module ID', 'Module ID',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            ''),
    },

    /*
     * Note we can't use a getter and setter here because Module automatically
     * calls all getters during init (why?) so the private property would
     * get initialized for the Gjs_Interface object. This subsequently means
     * that any object implementing the module interface would reference this
     * shared array, as opposed to creating their own new one. However, we need
     * each module to have its own submodules array.
     *
     * For now this function is only used internally to Module.
     */
    get_submodules: function () {
        if (!this._submodules_array)
            this._submodules_array = [];
        return this._submodules_array;
    },

    /**
     * Method: drop_submodule
     * Drops the given submodule (if it exists) from the list of submodules.
     *
     * This should be called when you are finished using a submodule and want
     * it to be garbage collected.
     *
     */
    drop_submodule: function (submodule) {
        let index = this.get_submodules().indexOf(submodule);
        if (index > -1) {
            this.get_submodules().splice(index, 1);
            submodule.dropped();
        }
    },

    /**
     * Method: dropped
     * Invoked when this submodule was dropped by its parent
     *
     */
    dropped: function () {
    },

    /**
     * Method: create_submodule
     * Create a new instance of a submodule
     *
     * Creates an instance of a submodule through the factory, optionally adding
     * some construct properties.
     * This doesn't pack the submodule anywhere, just returns it.
     *
     * Properties:
     *   slot - the slot for which to create the module (string)
     *   extra_props - dictionary of construct properties
     */
    create_submodule: function (slot, extra_props={}) {
        let submodule = this.factory.create_module_for_slot(this, slot,
            extra_props);

        if (submodule) {
            if (Array.isArray(submodule)) {
                this._submodules_array = this.get_submodules().concat(submodule);
            } else {
                this.get_submodules().push(submodule);
            }
        }
        return submodule;
    },

    /**
     * Method: reference_module
     * Pass an existing module instance defined elsewhere
     *
     * Passes an existing module instance defined elsewhere in the app. The
     * instance is passed through the callback as soon as the module instance
     * is available.
     *
     * Parameters:
     *   reference_slot - reference slot to the module (string)
     *   callback - function to be called whenever the module is available
     */
    reference_module: function (reference_slot, callback) {
        this.factory.request_module_reference(this, reference_slot, callback);
    },

    /**
     * Method: make_ready
     * Prepare the module to show contents on screen
     *
     * Parameters:
     *   callback - function to be called whenever the module is ready.
     */
    make_ready: function (cb = function () {}) {
        let count = 0;
        if (this.get_submodules().length === 0)
            cb();

        this.get_submodules().forEach((submodule) => {
            submodule.make_ready(() => {
                count++;
                if (count == this.get_submodules().length)
                    cb();
            });
        });
    },
});
