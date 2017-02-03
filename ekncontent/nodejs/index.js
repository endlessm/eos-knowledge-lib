const gi = require('./build/Release/ekn-bindings.node');

// The bootstrap from C here contains functions and methods for each object,
// namespaced with underscores. See gi.cc for more information.
const GIRepository = gi.Bootstrap();

// The GIRepository API is fairly poor, and contains methods on classes,
// methods on objects, and what should be methods interpreted as functions,
// because the scanner does not interpret methods on typedefs correctly.

// We extend this bootstrap'd repo to define all flags / enums, which
// are all we need to start declaring objects.
(function() {
    let repo = GIRepository.Repository_get_default();
    let ns = "GIRepository";

    // First, grab InfoType so we can find enums / flags.
    let InfoType = makeEnum(GIRepository.Repository_find_by_name.call(repo, ns, "InfoType"));

    // Now, define all enums / flags.
    let nInfos = GIRepository.Repository_get_n_infos.call(repo, ns);
    for (let i = 0; i < nInfos; i++) {
        let info = GIRepository.Repository_get_info.call(repo, ns, i);
        let name = GIRepository.BaseInfo_get_name.call(info);
        let type = GIRepository.BaseInfo_get_type.call(info);
        if (type === InfoType.ENUM || type === InfoType.FLAGS)
            GIRepository[name] = makeEnum(info);
    }
})();

function declareFunction(obj, info) {
    let name = GIRepository.BaseInfo_get_name.call(info);
    let flags = GIRepository.function_info_get_flags(info);
    let func = gi.MakeFunction(info);
    let target = flags & GIRepository.FunctionInfoFlags.IS_METHOD ? obj.prototype : obj;
    Object.defineProperty(target, name, {
        configurable: true,
        writable: true,
        value: func
    });
}

function makeEnum(info) {
    let obj = {};
    let nValues = GIRepository.enum_info_get_n_values(info);

    for (let i = 0; i < nValues; i++) {
        let valueInfo = GIRepository.enum_info_get_value(info, i);
        let valueName = GIRepository.BaseInfo_get_name.call(valueInfo);
        let valueValue = GIRepository.value_info_get_value(valueInfo);
        obj[valueName.toUpperCase()] = valueValue;
    }

    let nMethods = GIRepository.enum_info_get_n_methods(info);
    for (let i = 0; i < nMethods; i++) {
        let methodInfo = GIRepository.enum_info_get_method(info, i);
        declareFunction(constructor, methodInfo);
    }

    return obj;
}

function makeConstant(info) {
    return gi.GetConstantValue(info);
}

function makeFunction(info) {
    return gi.MakeFunction(info);
}

function makeStruct(info) {
    function fieldGetter(fieldInfo) {
        return function() {
            return gi.BoxedFieldGetter(this, fieldInfo);
        };
    }
    function fieldSetter(fieldInfo) {
        return function(value) {
            return gi.BoxedFieldSetter(this, fieldInfo, value);
        };
    }

    let constructor = gi.MakeBoxed(info);

    let nMethods = GIRepository.struct_info_get_n_methods(info);
    for (let i = 0; i < nMethods; i++) {
        let methodInfo = GIRepository.struct_info_get_method(info, i);
        declareFunction(constructor, methodInfo);
    }

    let nProperties = GIRepository.struct_info_get_n_fields(info);
    for (let i = 0; i < nProperties; i++) {
        let fieldInfo = GIRepository.struct_info_get_field(info, i);
        let fieldFlags = GIRepository.field_info_get_flags(fieldInfo);

        let fieldName = GIRepository.BaseInfo_get_name.call(fieldInfo);
        let jsFieldName = fieldName.replace(/-/g, '_');

        let desc = {};

        if (fieldFlags & GIRepository.FieldInfoFlags.READABLE)
            desc.get = fieldGetter(fieldInfo);

        if (fieldFlags & GIRepository.FieldInfoFlags.WRITABLE) {
            desc.set = fieldSetter(fieldInfo);
            desc.configurable = true;
        }

        Object.defineProperty(constructor.prototype, jsFieldName, desc);
    }

    return constructor;
}

function makeObject(info) {
    function propertyGetter(propertyName) {
        return function() {
            return gi.ObjectPropertyGetter(this, propertyName);
        };
    }
    function propertySetter(propertyName) {
        return function(value) {
            return gi.ObjectPropertySetter(this, propertyName, value);
        };
    }

    let constructor = gi.MakeClass(info);

    let nMethods = GIRepository.object_info_get_n_methods(info);
    for (let i = 0; i < nMethods; i++) {
        let methodInfo = GIRepository.object_info_get_method(info, i);
        declareFunction(constructor, methodInfo);
    }

    let nProperties = GIRepository.object_info_get_n_properties(info);
    for (let i = 0; i < nProperties; i++) {
        let propertyInfo = GIRepository.object_info_get_property(info, i);

        let propertyName = GIRepository.BaseInfo_get_name.call(propertyInfo);
        let jsPropertyName = propertyName.replace(/-/g, '_');

        Object.defineProperty(constructor.prototype, jsPropertyName, {
            configurable: true,
            get: propertyGetter(propertyName),
            set: propertySetter(propertyName),
        });
    }

    return constructor;
}

function makeInfo(info) {
    let type = GIRepository.BaseInfo_get_type.call(info);

    if (type === GIRepository.InfoType.ENUM)
        return makeEnum(info);
    if (type === GIRepository.InfoType.CONSTANT)
        return makeConstant(info);
    if (type === GIRepository.InfoType.FUNCTION)
        return makeFunction(info);
    if (type === GIRepository.InfoType.OBJECT)
        return makeObject(info);
    if (type === GIRepository.InfoType.STRUCT)
        return makeStruct(info);
}

function importNS(ns) {
    let module = {};

    let repo = GIRepository.Repository_get_default();
    GIRepository.Repository_require.call(repo, ns, null, 0);

    let nInfos = GIRepository.Repository_get_n_infos.call(repo, ns);
    for (let i = 0; i < nInfos; i++) {
        let info = GIRepository.Repository_get_info.call(repo, ns, i);
        let name = GIRepository.BaseInfo_get_name.call(info);
        module[name] = makeInfo(info);
    }

    return module;
}

module.exports = importNS('EosKnowledgeContent');
