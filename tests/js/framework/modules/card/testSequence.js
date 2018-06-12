const {DModel, Gtk} = imports.gi;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Compliance = imports.tests.compliance;
const CssClassMatcher = imports.tests.CssClassMatcher;
const Sequence = imports.framework.modules.card.sequence;

Gtk.init(null);

describe('Card.Sequence', function () {
    let model;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        model = new DModel.Content({
            title: '!!!',
        });
    });

    it('has a label with title class', function () {
        let card = new Sequence.Sequence({
            model: model,
        });
        expect(card).toHaveDescendantWithCssClass('CardSequence__title');
    });

    it('has a label with previous/next style classes', function () {
        let card = new Sequence.Sequence({
            model: model,
        });
        expect(card).toHaveDescendantWithCssClass('CardSequence__previousLabel');
        expect(card).toHaveDescendantWithCssClass('CardSequence__nextLabel');
    });

    it('has title label that understand Pango markup', function () {
        let card = new Sequence.Sequence({
            model: model,
        });
        expect(Gtk.test_find_label(card, '*!!!*').use_markup).toBeTruthy();
    });
});

Compliance.test_card_compliance(Sequence.Sequence);
