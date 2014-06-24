const EosKnowledge = imports.gi.EosKnowledge;
const Endless = imports.gi.Endless;
const Gtk = imports.gi.Gtk;

const CssClassMatcher = imports.CssClassMatcher;

EosKnowledge.init();

const TESTDIR = Endless.getCurrentFileDir() + '/..';

describe('Home page for Template A', function () {
    let home_page;
    let card_list = [
            new EosKnowledge.Card({
                title: 'Synopsised Card',
                synopsis: 'This is the Synopsis',
            }),
            new EosKnowledge.Card({
                title: 'Picture Card',
                thumbnail_uri: TESTDIR + '/test-content/pig1.jpg',
            }),
            new EosKnowledge.Card({
                title: 'Everything card',
                synopsis: 'This card has everything',
                thumbnail_uri: TESTDIR + '/test-content/pig2.jpg',
            }),
            new EosKnowledge.LessonCard({
                title: 'Mustard lesson',
                synopsis: 'Sample, incomplete',
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

    describe('CSS style context', function () {
        it('has home page A class', function () {
            expect(home_page).toHaveCssClass(EosKnowledge.STYLE_CLASS_HOME_PAGE_A);
        });
        it('has a descendant with container class', function () {
            expect(home_page).toHaveDescendantWithCssClass(EosKnowledge.STYLE_CLASS_CARD_CONTAINER);
        });
    });
});
