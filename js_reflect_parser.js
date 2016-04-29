#!/usr/bin/gjs

const Gio = imports.gi.Gio;
const System = imports.system;

let file = Gio.File.new_for_path(ARGV[0]);
let [success, contents] = file.load_contents(null);
if (!success)
    System.exit(1);
contents = String(contents);

try {
    let loc = true;
    let tree = Reflect.parse(contents, {
        loc: loc,
    });
    print(JSON.stringify(tree, null, '    '));
} catch(err) {
    printerr(err);
    printerr(err.stack);
}

