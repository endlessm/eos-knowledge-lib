const Gtk = imports.gi.Gtk;

const FormattableLabel = imports.app.widgets.formattableLabel;
const Utils = imports.tests.utils;

Gtk.init(null);

describe('Formattable Label', function () {
    let label;

    beforeEach(function () {
        label = new FormattableLabel.FormattableLabel({
            'label': 'Frango',
        });
    });

    it('constructs', function () {});

    it('can format label with CSS', function () {
        let cssProvider = new Gtk.CssProvider();

        cssProvider.load_from_data ("* { \
            -EknFormattableLabel-text-transform: 'uppercase';\
        }");

        let win = new Gtk.OffscreenWindow();
        win.add(label);
        win.show_all();
        label.get_style_context().add_provider(cssProvider,
                                                Gtk.StyleProvider.PRIORITY_APPLICATION + 10);

        Utils.update_gui();

        expect(label.label).toBe("FRANGO");
    });
});
