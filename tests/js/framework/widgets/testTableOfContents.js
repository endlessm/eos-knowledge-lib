const Gtk = imports.gi.Gtk;

const CssClassMatcher = imports.tests.CssClassMatcher;
const TableOfContents = imports.framework.widgets.tableOfContents;

Gtk.init(null);

describe('Table of contents widget', function () {
    let toc, notify;
    let toc_entries = ['one', 'two', 'three', 'four', 'five', 'six'];

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        toc = new TableOfContents.TableOfContents({
            transition_duration: 0
        });
        toc.section_list = toc_entries;

        notify = jasmine.createSpy('notify');
        toc.connect('notify', function (object, pspec) {
            // Seems properties defined in js can only be accessed through
            // object[name] with the underscore variant on the name
            notify(pspec.name, object[pspec.name.replace('-', '_')]);
        });

    });

    it('can set section-list', function () {
        // Seems worth testing this as having a list property in javascript
        // isn't common
        toc.section_list = toc_entries;
        expect(toc.section_list).toBe(toc_entries);
    });

    it('target-section always less than list length, greater than 0', function () {
        toc.target_section = 999;
        expect(toc.target_section).toBe(toc_entries.length - 1);
        toc.target_section = -999;
        expect(toc.target_section).toBe(0);
        toc.target_section = 4;
        expect(toc.target_section).toBe(4);
    });

    it('selected-section follows target-section', function () {
        expect(toc.target_section).toBe(0);
        expect(toc.selected_section).toBe(0);
        notify.calls.reset();
        toc.target_section = 4;
        expect(toc.selected_section).toBe(4);
        expect(notify).toHaveBeenCalledWith('selected-section', 4);
    });

    describe('Style class of table of contents', function () {
        it('has collapsed class when collapsed property true', function () {
            toc.collapsed = true;
            expect(toc).toHaveCssClass('TableOfContents--collapsed');
            toc.collapsed = false;
            expect(toc).not.toHaveCssClass('TableOfContents--collapsed');
        });
        it('has a descendant with toc entry class', function () {
            expect(toc).toHaveDescendantWithCssClass('TableOfContents__entry');
        });
    });
});
