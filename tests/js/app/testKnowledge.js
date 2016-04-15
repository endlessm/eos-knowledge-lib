const ByteArray = imports.byteArray;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

Gtk.init(null);

const Knowledge = imports.app.knowledge;

describe('Syntactic sugar metaclass', function () {
    it('overrides properties automatically (this test should not warn)', function () {
        const MyGObjectInterface = new Lang.Interface({
            Name: 'MyGObjectInterface',
            Requires: [GObject.Object],
            Properties: {
                'foo': GObject.ParamSpec.boolean('foo', '', '',
                    GObject.ParamFlags.READWRITE, false),
            },
        });
        const MyClass = new Knowledge.Class({
            Name: 'MyModule',
            Extends: GObject.Object,
            Implements: [MyGObjectInterface],
        });
        expect(() => new MyClass()).not.toThrow();
    });

    it('does not try to override properties on a non-GObject interface', function () {
        const MyInterface = new Lang.Interface({
            Name: 'MyInterface',
        });
        expect(() => new Knowledge.Class({
            Name: 'MyClassImplementingLangInterface',
            Extends: GObject.Object,
            Implements: [MyInterface],
        })).not.toThrow();
    });

    it('works okay with GtkWidget subclasses', function () {
        let MyWidgetModule = new Knowledge.Class({
            Name: 'MyWidgetModule',
            Extends: Gtk.Grid,
            Template: ByteArray.fromString('<interface>' +
                '  <template class="Gjs_MyWidgetModule" parent="GtkGrid">' +
                '    <child>' +
                '      <object class="GtkLabel" id="child"/>' +
                '    </child>' +
                '  </template>' +
                '</interface>'),
            InternalChildren: ['child'],
            _init: function (props={}) {
                this.parent(props);
                expect(this._child).toBeDefined();
            },
        });
        new MyWidgetModule();
    });
});
