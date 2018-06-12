const Gtk = imports.gi.Gtk;

const CssClassMatcher = imports.tests.CssClassMatcher;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;
const SlidingPanelOverlay = imports.framework.widgets.slidingPanelOverlay;
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
});
