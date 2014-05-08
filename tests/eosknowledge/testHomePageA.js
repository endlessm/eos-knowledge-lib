const EosKnowledge = imports.EosKnowledge.EosKnowledge;
const Endless = imports.gi.Endless;
const Gtk = imports.gi.Gtk;

const CssClassMatcher = imports.CssClassMatcher;

Gtk.init(null);

const TESTDIR = Endless.getCurrentFileDir() + '/..';

describe('Home page for Template A', function () {
    let home_page;
    let card_list = [
            new EosKnowledge.Card({
                title: 'Subtitled Card',
                subtitle: 'This is the Subtitle',
            }),
            new EosKnowledge.Card({
                title: 'Picture Card',
                thumbnail_uri: TESTDIR + '/test-content/pig1.jpg',
            }),
            new EosKnowledge.Card({
                title: 'Everything card',
                subtitle: 'This card has everything',
                thumbnail_uri: TESTDIR + '/test-content/pig2.jpg',
            }),
            new EosKnowledge.LessonCard({
                title: 'Mustard lesson',
                subtitle: 'Sample, incomplete',
                // By Bogdan29roman, CC-BY-SA
                // http://en.wikipedia.org/wiki/File:Mu%C5%9Ftar.jpg
                thumbnail_uri: TESTDIR + '/test-content/mustard.jpg',
                item_index: 1,
                complete: false
            })
        ];

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        home_page = new EosKnowledge.HomePageA({
            title: "Guatemala",
            subtitle: "A place where Fernando is king"
        });

        notify = jasmine.createSpy('notify');
        home_page.connect('notify', function (object, pspec) {
            // Seems properties defined in js can only be accessed through
            // object[name] with the underscore variant on the name
            notify(pspec.name, object[pspec.name.replace('-', '_')]);
        });

    });

    it('can be constructed', function () {});

    it('can set cards', function () {
        // Seems worth testing this as having a list property in javascript
        // isn't common
        home_page.cards = card_list;
        expect(home_page.cards).toBe(card_list);
    });

    it('can set title and subtitle', function () {
        home_page.title = "Brazil";
        expect(home_page.title).toBe("Brazil");

        home_page.subtitle = "The land of caipirinhas";
        expect(home_page.subtitle).toBe("The land of caipirinhas");
    });

    describe('Style class of table of contents', function () {
        it('has home_page class', function () {
            expect(home_page).toHaveCssClass(EosKnowledge.STYLE_CLASS_HOME_PAGE);
        });
        it('has a descendant with title class', function () {
            expect(home_page).toHaveDescendantWithCssClass(EosKnowledge.STYLE_CLASS_HOME_PAGE_TITLE);
        });
        it('has a descendant with subtitle class', function () {
            expect(home_page).toHaveDescendantWithCssClass(EosKnowledge.STYLE_CLASS_HOME_PAGE_SUBTITLE);
        });
        it('has a descendant with search box class', function () {
            expect(home_page).toHaveDescendantWithCssClass(EosKnowledge.STYLE_CLASS_SEARCH_BOX);
        });
        it('has a descendant with container class', function () {
            expect(home_page).toHaveDescendantWithCssClass(EosKnowledge.STYLE_CLASS_CARD_CONTAINER);
        });
    });
});
