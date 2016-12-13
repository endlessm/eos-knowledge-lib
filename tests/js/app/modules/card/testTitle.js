const Eknc = imports.gi.EosKnowledgeContent;
const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Compliance = imports.tests.compliance;
const CssClassMatcher = imports.tests.CssClassMatcher;
const Title = imports.app.modules.card.title;

Gtk.init(null);

describe('Card.Title', function () {
    let card;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        card = new Title.Title({
            model: Eknc.ContentObjectModel.new_from_props(),
        });
    });

    it('has a label with title class', function () {
        expect(card).toHaveDescendantWithCssClass('CardTitle__title');
    });

    it('has a widget with before class', function () {
        expect(card).toHaveDescendantWithCssClass('CardTitle__before');
    });

    it('has a widget with after class', function () {
        expect(card).toHaveDescendantWithCssClass('CardTitle__after');
    });

    it('has labels that understand Pango markup', function () {
        let card = new Title.Title({
            model: Eknc.ContentObjectModel.new_from_props({
                title: '!!!',
            }),
        });
        expect(Gtk.test_find_label(card, '*!!!*').use_markup).toBeTruthy();
    });
});

Compliance.test_card_compliance(Title.Title);
