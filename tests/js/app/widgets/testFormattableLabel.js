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

    it('handles string length correctly', function () {
        label.use_markup = true;
        label.label = 'ç';
    });

    it('handles entities in markup strings correctly', function () {
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
        label.use_markup = true;
        label.label = "Custer&apos;s Last Stand";
        expect(label.label).toBe("CUSTER'S LAST STAND");
    });
});
