const Lang = imports.lang;
const GObject = imports.gi.GObject;
const GLib = imports.gi.GLib;

/**
 * Class: Cache
 *
 * This is a very simple LRU-based cache which is intended to store marshalled
 * ContentObjects based on their EKN ids.
 *
 * Although there isn't a lot of memory or IO overhead for these, we have to
 * perform an HTTP request/object marshal operation for every image in every
 * loaded article; for articles with thousands of images, this can prevent
 * potentially a lot of load.
 */
const Cache = Lang.Class({
    Name: 'Cache',
    GTypeName: 'EknCache',
    Extends: GObject.Object,

    Properties: {
        /**
         * Property: size
         *
         * The main Engine's cache instance is instantiated with a
         * non-configurable size, so this property essentially exists just for
         * unit testing.
         *
         * Defaults to 100
         */
        'size': GObject.ParamSpec.int('size', 'Cache Size',
            'The size of the cache',
             GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
             1, GLib.MAXINT32, 100),
    },

    _init: function (params) {
        this.parent(params);
        this._storage = {};

        // queue of the least recently used keys, ordered LRU to MRU
        this._lru_keys = [];
    },

    // called when a cache entry was requested. Adds the entry's key to the end
    // of the LRU queue, ensuring there are no duplicates
    _update_lru: function (key) {
        if (this._lru_keys.indexOf(key) >= 0) {
            this._lru_keys.splice(this._lru_keys.indexOf(key), 1);
        }

        this._lru_keys.push(key);
    },

    // ensures that the cache obeys its size limit by removing cache entries in
    // LRU order
    _validate_cache: function () {
        while (this._lru_keys.length > this.size) {
            let lru_key = this._lru_keys.shift();
            delete this._storage[lru_key];
        }
    },

    /**
     * Function: get
     *
     * Attempt to retrieve an entry from the cache based on its *key*. Returns
     * either the value stored at that key, or null.
     *
     * Parameters:
     *
     *   key - The string at which the key is stored.
     */
    get: function (key) {
        if (this._storage.hasOwnProperty(key)) {
            this._update_lru(key);
            return this._storage[key];
        }

        return null;
    },

    /**
     * Function: set
     *
     * Sets the *value* of the cache entry at *key* for later retrieval. This
     * will cause the cache to be "validated", such that if the cache has more
     * entries than its size parameter permits, the least recently used entries
     * will be culled from the cache.
     *
     * Parameters:
     *
     *   key - The string at which the key should be stored.
     *   value - A value to be stored in the cache. Can be any JS object.
     */
    set: function (key, value) {
        this._storage[key] = value;
        this._update_lru(key);
        this._validate_cache();
    },
});
