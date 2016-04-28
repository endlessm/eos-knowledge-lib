// Copyright (C) 2016 Endless Mobile, Inc.

const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const GObject = imports.gi.GObject;

const Knowledge = imports.app.knowledge;

const MockItemModel = new Knowledge.Class({
    Name: 'MockItemModel',
    Extends: GObject.Object,
    Implements: [ EosKnowledgePrivate.HistoryItemModel ],

    get title() {
        return this._title;
    },
    set title(value) {
        this._title = value;
    },
});

describe('History item model', function () {
    it('can be implemented in an object', function () {
        expect(function () {
            let model = new MockItemModel();
        }).not.toThrow();
    });

    it('remembers its title', function () {
        let model = new MockItemModel({
            title: 'Slartibartfast'
        });
        expect(model.title).toEqual('Slartibartfast');
    });
});
