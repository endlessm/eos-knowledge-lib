/* exported main */

const Gio = imports.gi.Gio;
const System = imports.system;

function upperFirst(string) {
    return string[0].toUpperCase() + string.slice(1);
}

function lowerFirst(string) {
    return string[0].toLowerCase() + string.slice(1);
}

function main() {
    if (ARGV.length < 1 || ARGV.length > 2 ||
        ARGV[0] == '--help' || ARGV[0] == '-h' ||
        (ARGV.length === 2 && ARGV[0] !== '--file')) {
        printerr('Supply a module name, such as Filter.Unread.');
        printerr('Or supply a JS file name with --file.');
        printerr('Pipe to `jq .` or `python -m json.tool` to pretty-print.');
        System.exit(1);
    }

    let classname, module_path, importer;
    if (ARGV[0] === '--file') {
        let module_name = Gio.File.new_for_commandline_arg(ARGV[1]).get_path();
        if (module_name.endsWith('.js'))
            module_name = module_name.slice(0, -3);
        module_path = module_name.split('/');
        classname = upperFirst(module_path[module_path.length - 1]);
        importer = imports['.'];
        importer.searchPath = ['/'];
    } else {
        let module_name = ARGV[0];
        module_path = module_name.split('.');
        classname = module_path[module_path.length - 1];
        module_path = module_path.map(lowerFirst);
        importer = imports.app.modules;
    }

    let module = module_path.reduce((prev, curr) => prev[curr], importer);
    print(JSON.stringify(module[classname].introspect()));
    System.exit(0);
}
