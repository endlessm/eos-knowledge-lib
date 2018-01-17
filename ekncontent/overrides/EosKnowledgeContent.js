const Json = imports.gi.Json;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;

function toUnderscore (string) {
    return string.replace(/-/g, '_');
}

function define_property (klass, name, descriptor) {
    Object.defineProperty(klass.prototype, name, descriptor);
    Object.defineProperty(klass.prototype, toUnderscore(name), descriptor);
}

function marshal_property (props, name, marshaller) {
    if (props[name])
        props[name] = marshaller(props[name]);
    let underscored = toUnderscore(name);
    if (name === underscored)
        return;
    if (props[underscored])
        props[underscored] = marshaller(props[underscored]);
}

function add_custom_model_constructors (model) {
    model.new_from_json = function (object) {
        let json_node = Json.from_string(JSON.stringify(object));
        return model.new_from_json_node(json_node);
    };
    // FIXME: would be way nicer to put this on the actual gobject init, or
    // better yet support introspection on list properties
    model.new_from_props = function (props={}) {
        marshal_property(props, 'discovery-feed-content', function (v) {
            return Json.from_string(JSON.stringify(v)).get_object();
        });
        marshal_property(props, 'table-of-contents', function (v) {
            // Mimic json_gvariant_deserialize
            let toc = [];
            for (let item of v) {
                let new_item = {};
                for (let prop in item) {
                    if (prop === 'hasIndex') {
                        new_item[prop] = new GLib.Variant('i', item[prop]);
                    }
                    else
                        new_item[prop] = new GLib.Variant('s', item[prop]);
                }
                toc.push(new_item);
            }
            return new GLib.Variant('aa{sv}', toc);
        });
        return new model(props);
    };
}

function _init() {
    let Eknc = this;

    define_property(Eknc.ContentObjectModel, 'discovery-feed-content', {
        get: function () {
            let node = new Json.Node();
            node.init_object(this.get_discovery_feed_content());
            return JSON.parse(Json.to_string(node, false));
        }
    });

    define_property(Eknc.ArticleObjectModel, 'table-of-contents', {
        get: function () {
            let toc = this.get_table_of_contents();
            if (!toc)
                return [];
            toc = toc.deep_unpack();
            toc.forEach(item => {
                for (let prop in item)
                    item[prop] = item[prop].deep_unpack();
            });
            return toc;
        },
    });

    add_custom_model_constructors(Eknc.AudioObjectModel);
    add_custom_model_constructors(Eknc.ContentObjectModel);
    add_custom_model_constructors(Eknc.DictionaryObjectModel);
    add_custom_model_constructors(Eknc.ArticleObjectModel);
    add_custom_model_constructors(Eknc.SetObjectModel);
    add_custom_model_constructors(Eknc.MediaObjectModel);
    add_custom_model_constructors(Eknc.ImageObjectModel);
    add_custom_model_constructors(Eknc.VideoObjectModel);

    Eknc.QueryObject.new_from_object = function (source, props={}) {
        for (let param_spec of GObject.Object.list_properties.call(Eknc.QueryObject)) {
            let name = param_spec.name;
            if (props.hasOwnProperty(name))
                continue;
            if (props.hasOwnProperty(toUnderscore(name)))
                continue;
            props[name] = source[name];
        }
        return new Eknc.QueryObject(props);
    };

    // FIXME: Can be removed when GJS supports pointer-valued properties.
    define_property(Eknc.QueryResults, 'models', {
        get: function () {
            return this.get_models();
        },
    });

    Eknc.QueryObject.prototype.toString = Eknc.QueryObject.prototype.to_string;
}
