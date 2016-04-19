const GObject = imports.gi.GObject;
const Lang = imports.lang;

const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;

const MockItemModel = new Lang.Class({
    Name: 'MockItemModel',
    Extends: GObject.Object,
    Implements: [ EosKnowledgePrivate.HistoryItemModel ],
    Properties: {
        'title': GObject.ParamSpec.override('title',
            EosKnowledgePrivate.HistoryItemModel),
    },
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

    // This test is currently a no-brainer, but after GJS gets patched, it
    // should still work even if the 'title' property is removed from the
    // MockItemModel class.
    // https://bugzilla.gnome.org/show_bug.cgi?id=727368
    it('remembers its title', function () {
        let model = new MockItemModel({
            title: 'Slartibartfast'
        });
        expect(model.title).toEqual('Slartibartfast');
    });
});
