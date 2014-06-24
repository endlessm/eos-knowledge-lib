const EosKnowledge = imports.gi.EosKnowledge;
const Endless = imports.gi.Endless;
const Gtk = imports.gi.Gtk;

const CssClassMatcher = imports.CssClassMatcher;

EosKnowledge.init();

const TESTDIR = Endless.getCurrentFileDir() + '/..';

const THROWING_CARD_COUNTS = [1, 3, 5, 7];
const NO_THROWING_CARD_COUNTS = [4, 6, 8];

describe('Home page for Template B', function () {
    let home_page;
    let card_list = [
            new EosKnowledge.Card({
                title: 'Subtitled Card',
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
            }),
            new EosKnowledge.Card({
                title: 'Subtitled Card',
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

        home_page = new EosKnowledge.HomePageB();

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

    describe('Card cardinality', function () {
        const CARD_COUNTS_NOT_ALLOWED = [0, 1, 3, 5, 7];
        const CARD_COUNTS_ALLOWED = [4, 6, 8];

        CARD_COUNTS_ALLOWED.map(function (card_count) {
            it ('throws an error if the number of cards is ' + card_count, function () {
                expect(function () {
                    home_page.cards = card_list.slice(0, card_count);
                }).not.toThrow();
            });
        });

        CARD_COUNTS_NOT_ALLOWED.map(function (card_count) {
            it ('throws an error if the number of cards is ' + card_count, function () {
                expect(function () {
                    home_page.cards = card_list.slice(0, card_count);
                }).toThrow();
            });
        });
    });

    describe('CSS style context', function () {
        it('has home page B class', function () {
            expect(home_page).toHaveCssClass(EosKnowledge.STYLE_CLASS_HOME_PAGE_B);
        });
        it('has a descendant with container class', function () {
            expect(home_page).toHaveDescendantWithCssClass(EosKnowledge.STYLE_CLASS_CARD_CONTAINER);
        });
    });
});
