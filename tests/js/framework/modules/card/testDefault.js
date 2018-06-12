const {DModel, Gtk} = imports.gi;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Compliance = imports.tests.compliance;
const CssClassMatcher = imports.tests.CssClassMatcher;
const Default = imports.framework.modules.card.default;

Gtk.init(null);

describe('Card.Default', function () {
    let card;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        card = new Default.Default({
            model: new DModel.Content({
                title: '!!!',
            }),
        });
    });

    it('has the correct style classes', function () {
        expect(card).toHaveDescendantWithCssClass('CardDefault__synopsis');
        expect(card).toHaveDescendantWithCssClass('CardDefault__context');
        expect(card).toHaveDescendantWithCssClass('CardDefault__title');
        expect(card).toHaveDescendantWithCssClass('CardDefault__thumbnail');
    });

    it('has labels that understand Pango markup', function () {
        expect(Gtk.test_find_label(card, '*!!!*').use_markup).toBeTruthy();
    });
});

Compliance.test_card_compliance(Default.Default);
