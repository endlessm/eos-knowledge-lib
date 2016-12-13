const Eknc = imports.gi.EosKnowledgeContent;
const Gdk = imports.gi.Gdk;
const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Card = imports.app.interfaces.card;
const Compliance = imports.tests.compliance;
const CssClassMatcher = imports.tests.CssClassMatcher;
const Text = imports.app.modules.card.text;
const SetMap = imports.app.setMap;

Gtk.init(null);

describe('Card.Text', function () {
    let card, set;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        set = Eknc.SetObjectModel.new_from_props({
            ekn_id: '2',
            title: 'Bar',
        });
        spyOn(SetMap, 'get_set_for_tag').and.returnValue(set);
        card = new Text.Text({
            model: Eknc.ContentObjectModel.new_from_props({
                title: '!!!',
                synopsis: '@@@',
                tags: ['???'],
            }),
        });
    });

    it('has label style classes', function () {
        expect(card).toHaveDescendantWithCssClass('CardText__title');
        expect(card).toHaveDescendantWithCssClass('CardText__synopsis');
        expect(card).toHaveDescendantWithCssClass('CardText__context');
    });

    it('has labels that understand Pango markup', function () {
        expect(Gtk.test_find_label(card, '*!!!*').use_markup).toBeTruthy();
        expect(Gtk.test_find_label(card, '*@@@*').use_markup).toBeTruthy();
        expect(Gtk.test_find_label(card, '*???*').use_markup).toBeTruthy();
    });

    describe('when resizing', function () {
        function _check_visibility_for_height (height, state) {
            it('with height ' + height + ' updates labels visibility', function () {
                let alloc = new Gdk.Rectangle({
                    height: height,
                    width: Card.MaxSize.A,
                });
                card.size_allocate(alloc);
                Utils.update_gui();
                expect(card._title_label.visible).toBe(state.title);
                expect(card._synopsis_label.visible).toBe(state.synopsis);
                expect(card._context_label.visible).toBe(state.context);
            });
        }
        _check_visibility_for_height(
            Card.MinSize.A, {
                title: true,
                synopsis: false,
                context: false
        });
        _check_visibility_for_height(
            Card.MinSize.B, {
                title: true,
                synopsis: false,
                context: true,
        });
        _check_visibility_for_height(
            Card.MinSize.C, {
                title: true,
                synopsis: true,
                context: true,
        });
    });
});

Compliance.test_card_compliance(Text.Text);
