#!/usr/bin/env python3

import json
import os
import sys


## This module expects as argument the path of a JSON file which contains the
## representation of a javascript abstract syntax tree
def main(argv):
    f_module_refl = argv[0]
    _parse_module(f_module_refl)


def _parse_module(f_src):
    module_name = os.path.splitext(f_src)[0].replace('/', '.')

    with open(f_src, 'r+') as f:
        src = f.read()
    source = json.loads(src)

    defs = _get_definitions(source)

    for definition in defs:
        if 'declarations' in definition['node']:
            child_node = definition['node']['declarations'][0]
            if definition['type'] == 'ClassDeclaration':
                _parse_class(child_node, module_name)
            elif definition['type'] == 'FunctionDeclaration':
                _parse_method(child_node, module_name)


def _get_definitions(src):
    # TODO: Expand to all possible types of definitions
    definitions = []
    for _def in src['body']:
        if _def['type'] == 'VariableDeclaration':
            for d in _def['declarations']:
                if _is_gobject_class(d):
                    # GObject Class Declaration
                    type = 'ClassDeclaration'
                elif _is_gobject_interface(d):
                    # GObject Interface Declaration
                    type = 'InterfaceDeclaration'
                else:
                    # Might be a constant
                    type = 'ConstantDeclaration'
                definitions.append({
                    'type': type,
                    'name': d['id']['name'],
                    'documented': False,
                    'node': _def
                })
        elif _def['type'] == 'ExpressionStatement':
            definitions.append({
                'type': 'ExpressionStatement',
                'documented': False,
                'node': _def
            })
    return definitions


def _parse_class(node, parent_name):
    print(node['id']['name'])
    if node['type'] == 'VariableDeclarator':
        if 'arguments' in node['init']:
            for argument in node['init']['arguments']:
                if 'properties' in argument:
                    class_properties = []
                    for property in argument['properties']:
                        if property['key']['name'] in ['Name', 'GTypeName', 'Extends', 'Implements']:
                            ## Class details
                            ## TODO Extract into method
                            if 'value' in property and property['value']['type'] == 'Literal':
                                print('    ' + property['key']['name'] + ': ' + property['value']['value'])
                            elif property['value']['type'] == 'MemberExpression':
                                print('    ' + property['key']['name'] + ': ' + property['value']['object']['name'] + '.' + property['value']['property']['name'])
                        elif property['key']['name'] == 'Properties':
                            ## Class Properties
                            ## TODO Extract into method
                            properties = property['value']['properties']
                            for prop in properties:
                                class_properties.append(prop['key']['value'])
                                prop_info = '        prop: ' + prop['key']['value']
                                ## TODO Extract ParamSpec
                                print(prop_info)
                        else:
                            ## Discard getters / setters
                            prop = property['key']['name']
                            _prop = prop.replace('_', '-')
                            if prop not in class_properties and _prop not in class_properties:
                                if property['value']['type'] == 'Literal':
                                    ## Class Constant
                                    print('        constant: ' + property['key']['name'])
                                elif property['value']['type'] == 'FunctionExpression':
                                    ## Class Methods
                                    print('        method: ' + property['key']['name'])


def _parse_method(node, module_name):
    print(node, module_name)


def _is_gobject_class(node):
    return (node['type'] == 'VariableDeclarator' and
        'callee' in node['init'] and
        'object' in node['init']['callee'] and
        'name' in node['init']['callee']['object'] and
        node['init']['callee']['object']['name'] == 'Lang' and
        node['init']['callee']['property']['name'] == 'Class')


def _is_gobject_interface(node):
    return (node['type'] == 'VariableDeclarator' and
        'callee' in node['init'] and
        'object' in node['init']['callee'] and
        'name' in node['init']['callee']['object'] and
        node['init']['callee']['object']['name'] == 'Lang' and
        node['init']['callee']['property']['name'] == 'Interface')


if __name__ == '__main__':
    main(sys.argv[1:])
