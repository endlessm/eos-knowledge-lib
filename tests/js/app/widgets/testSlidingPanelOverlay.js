const Gtk = imports.gi.Gtk;

const CssClassMatcher = imports.tests.CssClassMatcher;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;
const SlidingPanelOverlay = imports.app.widgets.slidingPanelOverlay;
const StyleClasses = imports.app.styleClasses;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);

describe('Sliding panel overlay', function () {
    let overlay;
    beforeEach(function () {
        overlay = new SlidingPanelOverlay.SlidingPanelOverlay({
            visible: true,
        });
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);
    });

    it('adds widgets to the overlay inside a panel', function () {
        let panel_widget = new Gtk.Label({
            visible: true,
        });
        let panel = overlay.add_panel_widget(panel_widget, Gtk.PositionType.TOP);
        expect(overlay).toHaveDescendant(panel);
        expect(panel).toHaveDescendant(panel_widget);
    });

    it('binds transition duration to child panels', function () {
        overlay.transition_duration = 42;
        let panel = overlay.add_panel_widget(new Gtk.Label(), Gtk.PositionType.TOP);
        expect(panel.transition_duration).toBe(42);
        overlay.transition_duration = 1000;
        expect(panel.transition_duration).toBe(1000);
    });

    it('sets align appropriate to the position of the panel', function () {
        let test_position_and_align = (position, valign, halign) => {
            let panel = overlay.add_panel_widget(new Gtk.Label(), position);
            expect(panel.valign).toBe(valign);
            expect(panel.halign).toBe(halign);
        };
        test_position_and_align(Gtk.PositionType.TOP, Gtk.Align.START, Gtk.Align.FILL);
        test_position_and_align(Gtk.PositionType.RIGHT, Gtk.Align.FILL, Gtk.Align.END);
        test_position_and_align(Gtk.PositionType.BOTTOM, Gtk.Align.END, Gtk.Align.FILL);
        test_position_and_align(Gtk.PositionType.LEFT, Gtk.Align.FILL, Gtk.Align.START);
    });
});
