// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const CssClassMatcher = imports.tests.CssClassMatcher;
const PaperTemplate = imports.app.modules.paperTemplate;
const StyleClasses = imports.app.styleClasses;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);

describe('Paper Template module', function () {
    let paper_template;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

        paper_template = new PaperTemplate.PaperTemplate();
    });

    it('can be constructed', function () {});

    it('has the paper-template CSS class', function () {
        expect(paper_template).toHaveCssClass('paper-template');
    });

    it('has a frame with the content CSS class', function () {
        expect(paper_template).toHaveDescendantWithCssClass(StyleClasses.CONTENT);
    });
});
