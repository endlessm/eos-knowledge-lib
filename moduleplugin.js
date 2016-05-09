var Astnode = require('jsdoc/src/astnode');
var Logger = require('jsdoc/util/logger');

var currentModuleScope = undefined;

// Trick for evaluating flags
var GObject = {
    ParamFlags: {
        READABLE: 1,
        WRITABLE: 2,
        READWRITE: 3,
        CONSTRUCT: 4,
        CONSTRUCT_ONLY: 8,
    },
};

exports.defineTags = function (dictionary) {
    dictionary.defineTag('cssname', {
        mustHaveValue: true,
        onTagged: function (doclet, scope) {
            Logger.warn(doclet, scope);
            doclet.classdesc += [
                '',
                '## CSS name ##',
                scope.value,
            ].join('\n');
        },
    });
};

exports.handlers = {
    symbolFound: function (e) {
        if (nodeMatchesModuleClass(e.astnode))
            processModuleClass(e);
    },
};

exports.astNodeVisitor = {
    visitNode: function (node, e, parser, currentSourceName) {
        if (nodeMatchesModuleClass(node)) {
            currentModuleScope = node.id.name;
            return;
        }

        if (nodeMatchesGObjectProperty(node)) {
            var info = processGObjectProperty(node);

            // Only include writable properties in the modular framework
            // documentation - ones that can be set from app.json
            if (!(info.flags & GObject.ParamFlags.WRITABLE))
                return;
            // Likewise, object-valued properties can't be set from app.json
            if (info.type === 'object')
                return;

            e.comment = [
                unwrapComment(getLeadingComment(node)),
                '@name ' + info.name,
                '@memberof ' + currentModuleScope,
                '@instance',
                '@summary ' + info.blurb,
                '@type ' + info.type,
            ].join('\n');
            e.filename = currentSourceName;
            e.lineno = node.loc.start.line;
            e.event = 'jsdocCommentFound';
            return;
        }
    },
};

function processModuleClass(e) {
    var className = e.astnode.id.name;

    if (e.comment === '@undocumented') {
        Logger.warn('Module ' + className + ' has no documentation');
        e.comment = '@class';
    }

    e.comment = unwrapComment(e.comment);
    e.comment += '@class\n';

    e.code = {
        name: className,
        type: 'ClassExpression',
        node: e.astnode,
    };

    var info = getClassInfo(e.astnode);
    if (info.name !== className)
        Logger.error('Class ' + className + "'s Name parameter doesn't match: " + info.name);
    e.comment += '@extends {' + info.extends + '}\n';
    if (info.css)
        e.comment += '@cssname ' + info.css + '\n';
    if (info.implements) {
        info.implements.forEach(function (iface) {
            e.comment += '@extends {' + iface + '}\n';
        });
    }
}

function processGObjectProperty (node) {
    var pspecArgs = node.value.arguments;
    var name = node.key.value;
    var type = node.value.callee.property.name;
    var flags = processPropertyFlags(pspecArgs[3]);
    // FIXME do something with default, min, max args

    if (pspecArgs[0].value !== name)
        Logger.warn('Param spec does not match property name ' + name);

    return {
        name: name,
        nick: pspecArgs[1].value,
        blurb: pspecArgs[2].value,
        type: type,
        flags: flags,
    };
}

function processPropertyFlags(node) {
    if (node.type === 'BinaryExpression' && node.operator === '|')
        return processPropertyFlags(node.left) | processPropertyFlags(node.right);
    return eval(Astnode.nodeToValue(node));
}

function nodeMatchesModuleClass (node) {
    return (node.type === 'VariableDeclarator' &&
        node.init && node.init.callee &&
        node.init.callee.type === 'MemberExpression' &&
        node.init.callee.object.name === 'Module' &&
        node.init.callee.property.name === 'Class');
}

function nodeMatchesGObjectProperty (node) {
    return (node.type === 'Property' &&
        node.value.type === 'CallExpression' &&
        node.value.callee.type === 'MemberExpression' &&
        node.value.callee.object.type === 'MemberExpression' &&
        node.value.callee.object.object.name === 'GObject' &&
        node.value.callee.object.property.name === 'ParamSpec');
}

function getClassInfo (node) {
    var classKeys = node.init.arguments[0].properties;
    var info = {};
    classKeys.forEach(function (k) {
        if (k.type !== 'Property')
            return;
        if (k.key.name === 'Name')
            info.name = k.value.value;
        if (k.key.name === 'CssName')
            info.css = k.value.value;
        if (k.key.name === 'Extends')
            info.extends = Astnode.nodeToValue(k.value);
        if (k.key.name === 'Implements')
            info.implements = k.value.elements.map(Astnode.nodeToValue);
    });
    return info;
}

// From jsdoc/src/visitor.js
function getLeadingComment (node) {
    var leadingComments = node.leadingComments;
    if (Array.isArray(leadingComments) && leadingComments.length && leadingComments[0].raw)
        return leadingComments[0].raw;
    return '@undocumented';
}

// From jsdoc/doclet.js
function unwrapComment (comment) {
    if (!comment)
        return '';

    // note: keep trailing whitespace for @examples
    // extra opening/closing stars are ignored
    // left margin is considered a star and a space
    // use the /m flag on regex to avoid having to guess what this platform's newline is
    return comment.replace(/^\/\*\*+/, '') // remove opening slash+stars
        .replace(/\**\*\/$/, '\\Z')       // replace closing star slash with end-marker
        .replace(/^\s*(\* ?|\\Z)/gm, '')  // remove left margin like: spaces+star or spaces+end-marker
        .replace(/\s*\\Z$/g, '');         // remove end-marker
}
