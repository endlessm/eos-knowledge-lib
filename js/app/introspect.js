/* exported introspect_module */

const GObject = imports.gi.GObject;

function _introspect_gtype(gtype) {
    let typename = gtype.name;

    /* Exceptional cases */
    switch (typename) {
    case 'gint':
    case 'guint':
    case 'gdouble':
        return 'Number';
    case 'gchararray':
        return 'String';
    case 'gboolean':
        return 'Boolean';
    }

    return typename;
}

function _introspect_param_spec(pspec) {
    let flags = pspec.flags;
    return {
        name: pspec.get_name(),
        short_desc: pspec.get_nick(),
        long_desc: pspec.get_blurb(),
        default: pspec.get_default_value(),
        readable: !!(flags & GObject.ParamFlags.READABLE),
        writable: !!(flags & GObject.ParamFlags.WRITABLE),
        construct: !!(flags & GObject.ParamFlags.CONSTRUCT),
        construct_only: !!(flags & GObject.ParamFlags.CONSTRUCT_ONLY),
        type: _introspect_gtype(pspec.value_type),
        origin: _introspect_gtype(pspec.owner_type),
    };
}

function _introspect_slots(slots_obj) {
    return Object.keys(slots_obj).map(slot_name => {
        let slot = slots_obj[slot_name];
        return {
            name: slot_name,
            array: !!slot.array,
            multi: !!slot.multi,
        };
    });
}

function _introspect_references(references_obj) {
    return Object.keys(references_obj).map(reference_name => {
        return {
            name: reference_name,
        };
    });
}

function introspect_module(module) {
    return {
        name: module.prototype.__name__,
        gtype: _introspect_gtype(module.$gtype),
        parent: _introspect_gtype(module.__super__.$gtype),
        interfaces: module.prototype.__interfaces__
            .map(iface => _introspect_gtype(iface.$gtype)),
        properties: GObject.Object.list_properties.call(module)
            .map(_introspect_param_spec),
        slots: _introspect_slots(module.__slots__),
        references: _introspect_references(module.__references__),
    };
}
