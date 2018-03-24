const {DModel, Gio, Soup} = imports.gi;

function wrapPromise (obj, cancellable, async_name) {
    let in_args = Array.prototype.slice.call(arguments, 3);
    let finish_name = async_name.replace('_async', '').concat('_finish');
    return new Promise((resolve, reject) => {
        obj[async_name](...in_args, cancellable, (obj, res) => {
            try {
                let results = obj[finish_name](res);
                resolve(results);
            } catch (e) {
                reject(e);
            }
        });
    });
}

function wrapPromises () {
    DModel.Engine.prototype.get_object_promise = function (id, cancellable=null) {
        return wrapPromise(this, cancellable, 'get_object', id);
    };

    DModel.Engine.prototype.get_object_for_app_promise = function (id, app_id, cancellable=null) {
        return wrapPromise(this, cancellable, 'get_object_for_app', id, app_id);
    };

    DModel.Engine.prototype.query_promise = function (query, cancellable=null) {
        return wrapPromise(this, cancellable, 'query', query);
    };

    Gio.InputStream.prototype.read_bytes_promise = function (count, priority, cancellable=null) {
        return wrapPromise(this, cancellable, 'read_bytes_async', count, priority);
    };

    Gio.OutputStream.prototype.splice_promise = function (source, flags, priority, cancellable=null) {
        return wrapPromise(this, cancellable, 'splice_async', source, flags, priority);
    };

    Soup.Request.prototype.send_promise = function (cancellable=null) {
        return wrapPromise(this, cancellable, 'send_async');
    };
}
