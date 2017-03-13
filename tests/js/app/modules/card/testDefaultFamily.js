const Eknc = imports.gi.EosKnowledgeContent;
const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Compliance = imports.tests.compliance;
const CssClassMatcher = imports.tests.CssClassMatcher;
const DefaultFamily = imports.app.modules.card.defaultFamily;

Gtk.init(null);

describe('Card.DefaultFamily', function () {
    let card;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        card = new DefaultFamily.DefaultFamily({
            model: Eknc.ContentObjectModel.new_from_props({
                title: '!!!',
            }),
        });
    });

    it('has the correct style classes', function () {
        expect(card).toHaveDescendantWithCssClass('CardDefaultFamily__synopsis');
        expect(card).toHaveDescendantWithCssClass('CardDefaultFamily__context');
        expect(card).toHaveDescendantWithCssClass('CardDefaultFamily__title');
        expect(card).toHaveDescendantWithCssClass('CardDefaultFamily__thumbnail');
    });

    it('has labels that understand Pango markup', function () {
        expect(Gtk.test_find_label(card, '*!!!*').use_markup).toBeTruthy();
    });
});

Compliance.test_card_compliance(DefaultFamily.DefaultFamily);
