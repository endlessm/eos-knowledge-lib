var logger = require('jsdoc/util/logger');
var Astnode = require('jsdoc/src/astnode');

exports.handlers = {
    symbolFound: function (e) {
        if (nodeMatchesGObjectClass(e.astnode)) {
            // New Lang.Class declaration found!
            var message = 'Lang.Class declaration found!\n';
            message += 'CLASS NAME: ' + e.astnode.id.name.replace('"', '') + '\n';

            var args = getClassArgs(e.astnode);
            message += 'INFO:\n' + args;
            message += '  Filename: ' + e.filename + '\n' +
                '  Lineno: ' + e.lineno + '\n';
            if (e.comment === '@undocumented') {
                message += '!! NOTICE !! This class has no documentation block !!';
                e.comment = '@class';
            } else {
                message += e.comment + '\n';
            }

            var params = getConstructorArgs(e.astnode);
            e.comment = e.comment.replace('/**', '');
            e.comment = e.comment.replace('*/', '');

            e.code = {
                name: e.astnode.id.name.replace('"', ''),
                type: 'ClassDeclaration',
                node: e.astnode,
                paramnames: params,
            };

            params.forEach(function (param) {
                e.comment += '\n@param ' + param;
            });

            var props = getClassProps(e.astnode);
            if (props !== '') {
                message += 'PROPERTIES:\n' + props;
            }
            message += '\n';

            logger.warn(message);
        }
    }
};

function nodeMatchesGObjectClass (node) {
    return (node.type === 'VariableDeclarator' &&
        node.init &&
        node.init.hasOwnProperty('callee') &&
        node.init.callee.hasOwnProperty('object') &&
        node.init.callee.object.hasOwnProperty('name') &&
        node.init.callee.object.name === 'Lang' &&
        node.init.callee.property.name === 'Class');
}

function getConstructorArgs (node) {
    var constructor = node.init.arguments[0].properties.filter(function (p) {
        return p.type === 'Property' &&
            p.key.name === '_init' &&
            p.value.type === 'FunctionExpression';
    })[0];
    if (!constructor)
        return [];
    return Astnode.getParamNames(constructor.value);
}

function getClassArgs (node) {
    var props = node.init.arguments[0].properties;
    var data = '';
    props.forEach(function(prop) {
        if (prop.type === 'Property' && prop.value.value) {
            if (['Name', 'GTypeName'].indexOf(prop.key.name) > -1) {
                data += '  ' + prop.key.name + ': ' + prop.value.value + '\n';
            }
        }
    });
    return data;
}

function getClassProps (node) {
    var _props = node.init.arguments[0].properties;
    var data = '';
    _props.forEach(function(p) {
        if (p.type === 'Property' &&
            p.key.name === 'Properties' &&
            p.value.type === 'ObjectExpression') {
            var props = p.value.properties;
            props.forEach(function (q) {
                data += '  Name: ' + q.key.value + '\n' +
                        '  Type: ' + q.value.callee.property.name + '\n';
                if (q.leadingComments && q.leadingComments.length > 0)
                    data += '  Comment:\n' +
                        '        ' + q.leadingComments[0].raw + '\n';
            });
        }
    });
    return data;
}
