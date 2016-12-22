const Json = imports.gi.Json;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;

function toUnderscore (string) {
    return string.replace('-', '_', 'g');
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
        marshal_property(props, 'tags', function (v) {
            return new GLib.Variant('as', v);
        });
        marshal_property(props, 'resources', function (v) {
            return new GLib.Variant('as', v);
        });
        marshal_property(props, 'authors', function (v) {
            return new GLib.Variant('as', v);
        });
        marshal_property(props, 'outgoing-links', function (v) {
            return new GLib.Variant('as', v);
        });
        marshal_property(props, 'child-tags', function (v) {
            return new GLib.Variant('as', v);
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

    define_property(Eknc.ContentObjectModel, 'tags', {
        get: function () {
            let tags = this.get_tags();
            return tags ? tags.deep_unpack() : [];
        },
    });
    define_property(Eknc.ContentObjectModel, 'resources', {
        get: function () {
            let resources = this.get_resources();
            return resources ? resources.deep_unpack() : [];
        },
    });

    define_property(Eknc.ArticleObjectModel, 'authors', {
        get: function () {
            let authors = this.get_authors();
            return authors ? authors.deep_unpack() : [];
        },
    });
    define_property(Eknc.ArticleObjectModel, 'outgoing-links', {
        get: function () {
            let outgoing_links = this.get_outgoing_links();
            return outgoing_links ? outgoing_links.deep_unpack() : [];
        },
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

    define_property(Eknc.SetObjectModel, 'child-tags', {
        get: function () {
            let child_tags = this.get_child_tags();
            return child_tags ? child_tags.deep_unpack() : [];
        },
    });

    add_custom_model_constructors(Eknc.ContentObjectModel);
    add_custom_model_constructors(Eknc.ArticleObjectModel);
    add_custom_model_constructors(Eknc.SetObjectModel);
    add_custom_model_constructors(Eknc.MediaObjectModel);
    add_custom_model_constructors(Eknc.ImageObjectModel);
    add_custom_model_constructors(Eknc.VideoObjectModel);

    define_property(Eknc.QueryObject, 'tags-match-any', {
        get: function () {
            let tags = this.get_tags_match_any();
            return tags ? tags.deep_unpack() : [];
        },
    });
    define_property(Eknc.QueryObject, 'tags-match-all', {
        get: function () {
            let tags = this.get_tags_match_all();
            return tags ? tags.deep_unpack() : [];
        },
    });
    define_property(Eknc.QueryObject, 'ids', {
        get: function () {
            let ids = this.get_ids();
            return ids ? ids.deep_unpack() : [];
        },
    });
    define_property(Eknc.QueryObject, 'excluded-ids', {
        get: function () {
            let ids = this.get_excluded_ids();
            return ids ? ids.deep_unpack() : [];
        },
    });
    define_property(Eknc.QueryObject, 'excluded-tags', {
        get: function () {
            let tags = this.get_excluded_tags();
            return tags ? tags.deep_unpack() : [];
        },
    });

    Eknc.QueryObject.new_from_props = function (props={}) {
        marshal_property(props, 'tags-match-any', function (v) {
            return new GLib.Variant('as', v);
        });
        marshal_property(props, 'tags-match-all', function (v) {
            return new GLib.Variant('as', v);
        });
        marshal_property(props, 'ids', function (v) {
            return new GLib.Variant('as', v);
        });
        marshal_property(props, 'excluded-ids', function (v) {
            return new GLib.Variant('as', v);
        });
        marshal_property(props, 'excluded-tags', function (v) {
            return new GLib.Variant('as', v);
        });
        return new Eknc.QueryObject(props);
    };

    Eknc.QueryObject.new_from_object = function (source, props={}) {
        for (let param_spec of GObject.Object.list_properties.call(Eknc.QueryObject)) {
            let name = param_spec.name;
            if (props.hasOwnProperty(name))
                continue;
            if (props.hasOwnProperty(toUnderscore(name)))
                continue;
            props[name] = source[name];
        }
        return Eknc.QueryObject.new_from_props(props);
    };

    // FIXME: Can be removed when GJS supports pointer-valued properties.
    define_property(Eknc.QueryResults, 'models', {
        get: function () {
            return this.get_models();
        },
    });
}
