const Gtk = imports.gi.Gtk;

const CssClassMatcher = imports.tests.CssClassMatcher;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;
const SlidingPanel = imports.framework.widgets.slidingPanel;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);

describe('Sliding panel', function () {
    let panel_widget;
    beforeEach(function () {
        panel_widget = new Gtk.Label({
            visible: true,
        });
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);
    });

    it('only shows the panel when reveal panel is true', function () {
        let panel = new SlidingPanel.SlidingPanel({
            reveal_panel: false,
            panel_widget: panel_widget,
        });
        expect(panel.visible_child).not.toHaveDescendant(panel_widget);
        panel.reveal_panel = true;
        expect(panel.visible_child).toHaveDescendant(panel_widget);
    });

    it('adds style classes appropriate to the hide direciton of the panel', function () {
        let test_direction_and_class = (direction, klass) => {
            let panel = new SlidingPanel.SlidingPanel({
                panel_widget: panel_widget,
                reveal_panel: true,
                hide_direction: direction,
            });
            expect(panel).toHaveCssClass(klass);
            panel.panel_widget = null;
            panel.destroy();
        };
        test_direction_and_class(Gtk.PositionType.TOP, Gtk.STYLE_CLASS_TOP);
        test_direction_and_class(Gtk.PositionType.RIGHT, Gtk.STYLE_CLASS_RIGHT);
        test_direction_and_class(Gtk.PositionType.BOTTOM, Gtk.STYLE_CLASS_BOTTOM);
        test_direction_and_class(Gtk.PositionType.LEFT, Gtk.STYLE_CLASS_LEFT);
    });
});
