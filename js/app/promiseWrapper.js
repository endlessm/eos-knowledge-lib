const Eknc = imports.gi.EosKnowledgeContent;

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
    Eknc.Engine.prototype.get_object_promise = function (id, cancellable=null) {
        return wrapPromise(this, cancellable, 'get_object', id);
    };

    Eknc.Engine.prototype.get_object_for_app_promise = function (id, app_id, cancellable=null) {
        return wrapPromise(this, cancellable, 'get_object_for_app', id, app_id);
    };

    Eknc.Engine.prototype.query_promise = function (query, cancellable=null) {
        return wrapPromise(this, cancellable, 'query', query);
    };
}
