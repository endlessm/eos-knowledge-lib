const {DModel, Gio} = imports.gi;

function promisifyGio () {
    Gio._promisify(
        DModel.Engine.prototype,
        'get_object',
        'get_object_finish'
    );

    Gio._promisify(
        DModel.Engine.prototype,
        'query',
        'query_finish'
    );

    Gio._promisify(
        Gio.OutputStream.prototype,
        'splice_async',
        'splice_finish'
    );

    Gio._promisify(
        Gio._LocalFilePrototype,
        'enumerate_children_async',
        'enumerate_children_finish'
    );

    Gio._promisify(
        Gio._LocalFilePrototype,
        'delete_async',
        'delete_finish'
    );

    Gio._promisify(
        Gio._LocalFilePrototype,
        'replace_async',
        'replace_finish'
    );

    Gio._promisify(
        Gio.FileEnumerator.prototype,
        'next_files_async',
        'next_files_finish'
    );
}
