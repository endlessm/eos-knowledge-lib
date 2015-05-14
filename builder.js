const Gtk = imports.gi.Gtk;

function _init_template() {
    if ('_composite_children' in this) {
        throw new Error("init_template() can only be called once");
    }

    let proto = Object.getPrototypeOf(this);

    let template = proto.Template;
    if (!template) {
        throw new Error("Template is not defined on this instance");
    }

    let builder = new Gtk.Builder();

    if (template.startsWith('resource://')) {
        try {
            builder.add_from_resource(template.slice('resource://'.length));
        } catch (e) {
            logError(e, 'Error while loading UI resource ' + template);
        }
    } else {
        try {
            builder.add_from_string(template, -1);
        } catch (e) {
            logError(e, 'Error while loading inline UI resource');
        }
    }

    this._composite_children = [];

    if ('Children' in proto) {
        proto.Children.forEach((name) => {
            this._composite_children[name] = builder.get_object(name);
            let sanitized_name = name.replace(/-/g, '_');
            this[sanitized_name] = this._composite_children[name];
        }, this);
    }

    if ('InternalChildren' in proto) {
        proto.InternalChildren.forEach((name) => {
            this._composite_children[name] = builder.get_object(name);
            let sanitized_name = name.replace(/-/g, '_');
            this['_' + sanitized_name] = this._composite_children[name];
        }, this);
    }

    builder.connect_signals_full((builder, object, signal, handler) => {
        if (typeof(this[handler]) === 'function') {
            object.connect(signal, this[handler].bind(this));
        }
    });
}

/*
 * Use as follows:
 *
 * const Builder = imports.builder;
 * const MyCompositeWidget = new Lang.Class({
 *     Name: 'MyCompositeWidget',
 *     Extends: Gtk.Something,
 *     Template: 'resource:///com/endlessm/my-app/my-composite-widget.ui.xml',
 *     Children: [
 *         'main-frame',
 *         'do-something-button',
 *     ],
 *     InternalChildren: [
 *         'my-private-widget',
 *     ],
 *     _init: function (props) {
 *         this.parent(props);
 *         this.init_template();
 *         this.add(this.main_frame);
 *     },
 *     etc.
 * });
 * Builder.bind_template(MyCompositeWidget.prototype);
 *
 * This will allow you to refer to this.do_something_button, this.main_frame,
 * and this._my_private_widget (note the leading underscore) from within
 * MyCompositeWidget.
 *
 * When we upgrade GJS, you will be able to use the same API but without this
 * file and without bind_template(). It will still need some porting, however;
 * this code can only create child widgets for the class you are building, but
 * the real thing can actually create "this" from a template definition.
 *
 * The XML definition for GtkBuilder XML is also slightly different from that
 * for widget templates, so that will need some porting as well.
 */
function bind_template(proto) {
    if (!proto.Template || typeof(proto.Template) !== 'string')
        throw new Error("The prototype must contain a 'Template' string element to bind");

    proto.init_template = _init_template;
}
