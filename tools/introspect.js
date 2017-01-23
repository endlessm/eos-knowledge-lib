/* exported main */

const System = imports.system;

function lowerFirst(string) {
    return string[0].toLowerCase() + string.slice(1);
}

function main() {
    if (ARGV.length !== 1 || ARGV[0] == '--help' || ARGV[0] == '-h') {
        printerr('Supply a module name, such as Filter.Unread.');
        printerr('Pipe to `jq .` or `python -m json.tool` to pretty-print.');
        System.exit(1);
    }

    let module_name = ARGV[0];
    let module_path = module_name.split('.');
    let classname = module_path[module_path.length - 1];
    module_path = module_path.map(lowerFirst);
    let module = module_path.reduce((prev, curr) => prev[curr],
        imports.app.modules);
    print(JSON.stringify(module[classname].introspect()));
    System.exit(0);
}
