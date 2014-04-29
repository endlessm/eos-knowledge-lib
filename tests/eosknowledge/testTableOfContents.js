const EosKnowledge = imports.gi.EosKnowledge;
const Gtk = imports.gi.Gtk;

const CssClassMatcher = imports.CssClassMatcher;

describe('Table of contents widget', function () {
    let toc;
    let short_list = ['apple', 'orange', 'banana'];
    let long_list = ['one', 'two', 'three', 'four', 'five', 'six'];

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        toc = new EosKnowledge.TableOfContents();

        notify = jasmine.createSpy('notify');
        toc.connect('notify', function (object, pspec) {
            // Seems properties defined in js can only be accessed through
            // object[name] with the underscore variant on the name
            notify(pspec.name, object[pspec.name.replace('-', '_')]);
        });

    });

    it('can be constructed', function () {});

    it('can set section-list', function () {
        // Seems worth testing this as having a list property in javascript
        // isn't common
        toc.section_list = short_list;
        expect(toc.section_list).toBe(short_list);
    });

    it('selected-section always less than list length', function () {
        toc.selected_section = 999;
        expect(toc.selected_section).toBe(-1);
        toc.section_list = long_list;
        toc.selected_section = 999;
        expect(toc.selected_section).toBe(long_list.length - 1);
        toc.selected_section = 4;
        expect(toc.selected_section).toBe(4);
        notify.calls.reset();
        toc.section_list = short_list;
        expect(notify).toHaveBeenCalledWith('selected-section', short_list.length - 1);
        expect(toc.selected_section).toBe(short_list.length - 1);
    });

    describe('Style class of table of contents', function () {
        it('has toc class', function () {
            expect(toc).toHaveCssClass(EosKnowledge.STYLE_CLASS_TOC);
        });
        it('has gtk view class', function () {
            expect(toc).toHaveCssClass(Gtk.STYLE_CLASS_VIEW);
        });
        it('has collapsed class when collapsed property true', function () {
            toc.collapsed = true;
            expect(toc).toHaveCssClass(EosKnowledge.STYLE_CLASS_COLLAPSED);
            toc.collapsed = false;
            expect(toc).not.toHaveCssClass(EosKnowledge.STYLE_CLASS_COLLAPSED);
        });
        it('has a descendant with toc entry class', function () {
            toc.section_list = short_list;
            expect(toc).toHaveDescendantWithCssClass(EosKnowledge.STYLE_CLASS_TOC_ENTRY);
        });
    });
});
