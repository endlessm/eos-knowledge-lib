const {DModel, Gio} = imports.gi;

function _promisify(proto, asyncFunc, finishFunc) {
    proto[`_original_${asyncFunc}`] = proto[asyncFunc];
    proto[asyncFunc] = function(...args) {
        if (!args.every(arg => typeof arg !== 'function'))
            return this[`_original_${asyncFunc}`](...args);
        return new Promise((resolve, reject) => {
            const callStack = new Error().stack.split('\n')
                .filter(line => !line.match(/promisify/))
                .join('\n');
            this[`_original_${asyncFunc}`](...args, function(source, res) {
                try {
                    const result = source[finishFunc](res);
                    if (Array.isArray(result) && result.length > 1 && result[0] === true)
                        result.shift();
                    resolve(result);
                } catch (error) {
                    if (error.stack)
                        error.stack += `### Promise created here: ###\n${callStack}`;
                    else
                        error.stack = callStack;
                    reject(error);
                }
            });
        });
    };
}

// The following Gio APIs will be built into GJS in GNOME 3.30 and can be
// removed then
Gio._promisify = _promisify;
Gio._LocalFilePrototype = Gio.File.new_for_path('').constructor.prototype;

Gio._promisify(DModel.Engine.prototype, 'get_object', 'get_object_finish');
Gio._promisify(DModel.Engine.prototype, 'query', 'query_finish');
Gio._promisify(Gio.OutputStream.prototype, 'splice_async', 'splice_finish');
Gio._promisify(Gio._LocalFilePrototype, 'enumerate_children_async',
    'enumerate_children_finish');
Gio._promisify(Gio._LocalFilePrototype, 'delete_async', 'delete_finish');
Gio._promisify(Gio.FileEnumerator.prototype, 'next_files_async',
    'next_files_finish');
