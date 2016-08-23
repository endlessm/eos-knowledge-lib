const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Knowledge = imports.app.knowledge;

const FooBox = new Knowledge.Class({
    Name: 'FooBox',
    Extends: Gtk.Box,
    Properties: {
        'foo-name': GObject.ParamSpec.string('foo-name', 'Foobar name', 'Foobar name', 
                    GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
                    'fooboxdefault'),
        'foo-size': GObject.ParamSpec.int('foo-size', 'Foobar size', 'Foobar size',
                    GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
                    0, 1024, 1)
    },
});

/* Initialize GTK before running tests */
Gtk.init(null);

/* TODO: check for other common features like signal connection, packing props etc */
describe('Gtk.Builder', function () {
    let builder;

    beforeEach(function () {
        builder = Gtk.Builder.new_from_string (
'<interface> \
  <object class="EknFooBox" id="foobox1" /> \
  <object class="EknFooBox" id="foobox2"> \
    <property name="foo-name">MyFooBox</property> \
    <property name="foo-size">16</property> \
    <child> \
    <object class="GtkLabel" id="label"> \
      <property name="label">FooBox Label</property> \
      </object> \
    </child> \
  </object> \
</interface>', -1);
    });

    it('can instantiate a class defined in JS', function () {
        let foobox = builder.get_object ("foobox1");
        expect(foobox).toBeDefined();
    });

    it('can set a property on a class defined in JS', function () {
        let foobox = builder.get_object ("foobox2");
        expect(foobox).toBeDefined();
        expect(foobox.foo_name).toBe("MyFooBox");
        expect(foobox.foo_size).toBe(16);
    });

    it('can instantiate a child on a class defined in JS', function () {
        let foobox = builder.get_object ("foobox2");
	let children = foobox.get_children();
        expect(foobox).toBeDefined();
        expect(children).toBeDefined();
        expect(children.length).toBe(1);
        expect(children[0].label).toBe("FooBox Label");
    });

});
