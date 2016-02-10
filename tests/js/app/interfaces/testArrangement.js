const Gtk = imports.gi.Gtk;

const ContentObjectModel = imports.search.contentObjectModel;
const Minimal = imports.tests.minimal;
const MockFactory = imports.tests.mockFactory;

Gtk.init(null);

describe('Arrangement interface', function () {
    let arrangement, factory;

    beforeEach(function () {
        factory = new MockFactory.MockFactory();
        factory.add_named_mock('card', Minimal.MinimalCard);
        factory.add_named_mock('arrangement', Minimal.MinimalArrangement, {
            'card-type': 'card',
        });
        arrangement = factory.create_named_module('arrangement');
    });

    it('has a minimal implementation', function () {
        expect(arrangement).toBeDefined();
    });

    it('returns -1 for default card limit', function () {
        expect(arrangement.get_max_cards()).toBe(-1);
    });

    it("pays attention to the implementation's fade_card_in()", function () {
        spyOn(arrangement, 'fade_card_in');
        arrangement.fade_cards = true;
        arrangement.add_model(new ContentObjectModel.ContentObjectModel());
        expect(arrangement.fade_card_in).toHaveBeenCalled();
    });

    it('emits a signal when the card is clicked', function (done) {
        let model = new ContentObjectModel.ContentObjectModel();
        arrangement.add_model(model);
        arrangement.connect('card-clicked', (arrangement, clicked_model) => {
            expect(clicked_model).toBe(model);
            done();
        });
        factory.get_last_created_named_mock('card').emit('clicked');
    });
});
