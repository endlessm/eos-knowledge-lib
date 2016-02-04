// Copyright 2016 Endless Mobile, Inc.

const EosShard = imports.gi.EosShard;
const Format = imports.format;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Lang = imports.lang;

const ArticleObjectModel = imports.search.articleObjectModel;
const AsyncTask = imports.search.asyncTask;
const ContentObjectModel = imports.search.contentObjectModel;
const datadir = imports.search.datadir;
const MediaObjectModel = imports.search.mediaObjectModel;
const QueryObject = imports.search.queryObject;
const SetObjectModel = imports.search.setObjectModel;
const Utils = imports.search.utils;

const Domain = new Lang.Class({
    Name: 'Domain',
    Abstract: true,

    _init: function (domain, xapian_bridge) {
        this._domain = domain;
        this._xapian_bridge = xapian_bridge;

        this._content_path = null;
        this._shard_file = null;
    },

    _get_content_path: function () {
        if (this._content_path === null)
            this._content_path = datadir.get_data_dir_for_domain(this._domain).get_path();

        return this._content_path;
    },

    // Returns a marshaled ObjectModel based on json_ld's @type value, or throws
    // error if there is no corresponding model
    _get_model_from_json_ld: function (props, json_ld) {
        let ekn_model_by_ekv_type = {
            'ekn://_vocab/ContentObject':
                ContentObjectModel.ContentObjectModel,
            'ekn://_vocab/ArticleObject':
                ArticleObjectModel.ArticleObjectModel,
            'ekn://_vocab/ImageObject':
                MediaObjectModel.ImageObjectModel,
            'ekn://_vocab/VideoObject':
                MediaObjectModel.VideoObjectModel,
            'ekn://_vocab/SetObject':
                SetObjectModel.SetObjectModel,
        };

        let json_ld_type = json_ld['@type'];
        if (!ekn_model_by_ekv_type.hasOwnProperty(json_ld_type))
            throw new Error('No EKN model found for json_ld type ' + json_ld_type);

        let Model = ekn_model_by_ekv_type[json_ld_type];
        return new Model(props, json_ld);
    },

    /**
     * Function: load
     *
     * Private method, intended to be overridden by subclasses.
     *
     * Loads the domain from disk.
     */
    load: function (cancellable, callback) {
        throw new Error('Should be overridden in subclasses');
    },

    load_finish: function (task) {
        throw new Error('Should be overridden in subclasses');
    },

    /**
     * Function: get_domain_query_params
     *
     * Gets the parameters to pass to the Xapian Bridge for this domain.
     * The domain *must* be loaded before calling!
     */
    get_domain_query_params: function () {
        throw new Error('Should be overridden in subclasses');
    },

    /**
     * Function: get_fixed_query
     *
     * Asynchronously sends a request for to xapian-bridge to correct a given
     * query object. The corrections can be zero or more of the following:
     *      - the query with its stop words removed
     *      - the query which has had spelling correction applied to it.
     *
     * Note that the spelling correction will be performed on the original
     * query string, and not the string with stop words removed.
     *
     * Parameters:
     *   query_obj - A <QueryObject> describing the query.
     *   cancellable - A Gio.Cancellable to cancel the async request.
     *   callback - A function which will be called after the request finished.
     *              The function will be called with the engine and a task object,
     *              as parameters. The task object can be used with
     *              <get_fixed_query_finish> to retrieve the result.
     */
    get_fixed_query: function (query_obj, cancellable, callback) {
        let task = new AsyncTask.AsyncTask(this, cancellable, callback);
        this.load(cancellable, task.catch_callback_errors((source, load_task) => {
            this.load_finish(load_task);

            let domain_params = this.get_domain_query_params();
            this._xapian_bridge.get_fixed_query(query_obj, domain_params, cancellable, task.catch_callback_errors((bridge, bridge_task) => {
                let result = this._xapian_bridge.get_fixed_query_finish(bridge_task);
                task.return_value(result);
            }));
        }));
        return task;
    },

    /**
     * Function: get_fixed_query_finish
     *
     * Finishes a call to <get_fixed_query>. Returns a query object with the
     * corrections applied. Throws an error if one occurred.
     *
     * Parameters:
     *   task - The task returned by <get_fixed_query>
     */
    get_fixed_query_finish: function (task) {
        return task.finish();
    },

    /**
     * Function: resolve_xapian_result
     *
     * Private method, intended to be overridden by subclasses.
     *
     * Given data returned from Xapian bridge, return a Model constructed
     * for it. The data stored in Xapian is domain-version specific.
     *
     * Parameters:
     *   result: The body of a Xapian result returned from Xapian bridge
     */
    resolve_xapian_result: function (result, cancellable, callback) {
        throw new Error('Should be overridden in subclasses');
    },

    resolve_xapian_result_finish: function (task) {
        throw new Error('Should be overridden in subclasses');
    },

    get_objects_by_query: function (query_obj, cancellable, callback) {
        let task = new AsyncTask.AsyncTask(this, cancellable, callback);
        this.load(cancellable, task.catch_callback_errors((source, load_task) => {
            this.load_finish(load_task);

            let domain_params = this.get_domain_query_params();
            this._xapian_bridge.query(query_obj, domain_params, cancellable, task.catch_callback_errors((bridge, query_task) => {
                let json_ld = this._xapian_bridge.query_finish(query_task);

                if (json_ld.results.length === 0) {
                    task.return_value([]);
                    return;
                }

                AsyncTask.all(this, (add_task) => {
                    json_ld.results.forEach((result) => {
                        add_task((cancellable, callback) => this.resolve_xapian_result(result, cancellable, callback),
                                 (task) => this.resolve_xapian_result_finish(task));
                    });
                }, cancellable, task.catch_callback_errors((source, resolve_task) => {
                    let results = AsyncTask.all_finish(resolve_task);
                    task.return_value(results);
                }));
            }));
        }));
        return task;
    },

    get_objects_by_query_finish: function (task) {
        return task.finish();
    },
});

const DomainV1 = new Lang.Class({
    Name: 'DomainV1',
    Extends: Domain,

    _DB_DIR: 'db',
    _MEDIA_DIR: 'media',

    _get_v1_model_from_string: function (string) {
        let json_ld = JSON.parse(string);
        let props = {
            ekn_version: 1,
        };
        if (json_ld.hasOwnProperty('articleBody')) {
            // Legacy databases store their HTML within the xapian databases
            // themselves and don't store a contentType property
            props.content_type = 'text/html';
            props.get_content_stream = () => {
                return Utils.string_to_stream(json_ld.articleBody);
            };
        } else if (json_ld.hasOwnProperty('contentURL')) {
            let content_path = this._get_content_path();
            let model_path = GLib.build_filenamev([content_path, this._MEDIA_DIR, json_ld.contentURL]);
            // We don't care if the guess was certain or not, since the
            // content_type is a required parameter
            let [guessed_mimetype, __] = Gio.content_type_guess(model_path, null);
            props.content_type = guessed_mimetype;
            props.get_content_stream = () => {
                let file = Gio.File.new_for_path(model_path);
                return file.read(null);
            };
        }
        return this._get_model_from_json_ld(props, json_ld);
    },

    load: function (cancellable, callback) {
        let task = new AsyncTask.AsyncTask(this, cancellable, callback);
        // Nothing to do.
        task.return_value(true);
        return task;
    },

    load_finish: function (task) {
        return task.finish();
    },

    get_domain_query_params: function () {
        let params = {};
        params.path = GLib.build_filenamev([this._get_content_path(), this._DB_DIR]);
        return params;
    },

    _handle_redirect: function (task, model, cancellable) {
        // If the requested model should redirect to another, then fetch
        // that model instead.
        if (model.redirects_to.length > 0) {
            this.get_object_by_id(model.redirects_to, cancellable, task.catch_callback_errors((engine, redirect_task) => {
                task.return_value(this.get_object_by_id_finish(redirect_task));
            }));
        } else {
            task.return_value(model);
        }
    },

    get_object_by_id: function (id, cancellable, callback) {
        let task = new AsyncTask.AsyncTask(this, cancellable, callback);
        this.load(cancellable, task.catch_callback_errors((source, load_task) => {
            this.load_finish(load_task);

            let query_obj = new QueryObject.QueryObject({
                limit: 1,
                ids: [id],
                domain: this._domain,
            });
            let domain_params = this.get_domain_query_params();
            this._xapian_bridge.query(query_obj, domain_params, cancellable, task.catch_callback_errors((bridge, query_task) => {
                let results = this._xapian_bridge.query_finish(query_task).results;
                let model = this._get_v1_model_from_string(results[0]);
                this._handle_redirect(task, model, cancellable);
            }));
        }));
        return task;
    },

    get_object_by_id_finish: function (task) {
        return task.finish();
    },

    resolve_xapian_result: function (result, cancellable, callback) {
        let task = new AsyncTask.AsyncTask(this, cancellable, callback);

        // Old bundles contain all the jsonld in xapian, and
        // serve it in the results. If its a redirect we need to
        // resolve it, otherwise we can resolve immediately.
        let model = this._get_v1_model_from_string(result);
        if (model.redirects_to.length > 0) {
            let id = model.redirects_to;
            this.get_object_by_id(id, cancellable, task.catch_callback_errors(() => {
                task.return_value(this.get_object_by_id_finish());
            }));
        } else {
            task.return_value(model);
        }

        return task;
    },

    resolve_xapian_result_finish: function (task) {
        return task.finish();
    },
});

const DomainV2 = new Lang.Class({
    Name: 'DomainV2',
    Extends: Domain,

    _DB_DIR: 'db',
    _MEDIA_SHARD: 'media.shard',

    _get_shard_path: function () {
        let path_components = [this._get_content_path(), this._MEDIA_SHARD];
        let filename = GLib.build_filenamev(path_components);
        return filename;
    },

    _get_shard_file: function () {
        if (this._shard_file === null)
            this._shard_file = new EosShard.ShardFile({
                path: this._get_shard_path(),
            });

        return this._shard_file;
    },

    load: function (cancellable, callback) {
        let task = new AsyncTask.AsyncTask(this, cancellable, callback);
        let shard_file = this._get_shard_file();
        shard_file.init_async(0, cancellable, task.catch_callback_errors((shard_file, result) => {
            shard_file.init_finish(result);
            task.return_value(true);
        }));
        return task;
    },

    load_finish: function (task) {
        return task.finish();
    },

    get_domain_query_params: function () {
        let params = {};
        params.path = GLib.build_filenamev([this._get_content_path(), this._DB_DIR]);
        return params;
    },

    _handle_redirect: function (task, model, cancellable) {
        // If the requested model should redirect to another, then fetch
        // that model instead.
        if (model.redirects_to.length > 0) {
            this.get_object_by_id(model.redirects_to, cancellable, task.catch_callback_errors((engine, redirect_task) => {
                task.return_value(this.get_object_by_id_finish(redirect_task));
            }));
        } else {
            task.return_value(model);
        }
    },

    get_object_by_id: function (id, cancellable, callback) {
        let task = new AsyncTask.AsyncTask(this, cancellable, callback);
        this.load(cancellable, task.catch_callback_errors((source, load_task) => {
            this.load_finish(load_task);

            let shard_file = this._get_shard_file();
            let [domain, hash] = Utils.components_from_ekn_id(id);
            let record = shard_file.find_record_by_hex_name(hash);
            if (!record)
                throw new Error('Could not find epak record for ' + id);

            let metadata_stream = record.metadata.get_stream();
            Utils.read_stream(metadata_stream, cancellable, task.catch_callback_errors((stream, stream_task) => {
                let data = Utils.read_stream_finish(stream_task);
                let json_ld = JSON.parse(data);
                let props = {
                    ekn_version: 2,
                    get_content_stream: () => record.data.get_stream(),
                };
                let model = this._get_model_from_json_ld(props, json_ld);
                this._handle_redirect(task, model, cancellable);
            }));
        }));
        return task;
    },

    get_object_by_id_finish: function (task) {
        return task.finish();
    },

    resolve_xapian_result: function (result, cancellable, callback) {
        let id = result;
        return this.get_object_by_id(id, cancellable, callback);
    },

    resolve_xapian_result_finish: function (task) {
        return task.finish();
    },
});

function get_domain_impl (domain, xapian_bridge) {
    let ekn_version = Utils.get_ekn_version_for_domain(domain);
    let impls = {
        '1': DomainV1,
        '2': DomainV2,
    };

    let impl = impls[ekn_version];
    if (!impl)
        throw new Error(Format.vprintf('Invalid ekn version for domain %s: %s', [domain, ekn_version]));

    return new impl(domain, xapian_bridge);
}
