// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const CssClassMatcher = imports.tests.CssClassMatcher;
const MockFactory = imports.tests.mockFactory;
const Paper = imports.app.modules.layout.paper;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);

describe('Layout.Paper', function () {
    let paper_template;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

        [paper_template] = MockFactory.setup_tree({
            type: Paper.Paper,
            slots: {
                'content': { type: null },
            },
        });
    });

    it('has a frame with the content CSS class', function () {
        expect(paper_template).toHaveDescendantWithCssClass('LayoutPaper__content');
    });
});
