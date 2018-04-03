const {DModel, Gtk} = imports.gi;

const Minimal = imports.tests.minimal;
const MockFactory = imports.tests.mockFactory;

Gtk.init(null);

describe('Arrangement interface', function () {
    let arrangement, factory;

    beforeEach(function () {
        factory = new MockFactory.MockFactory({
            type: Minimal.MinimalArrangement,
            slots: {
                'card': { type: Minimal.MinimalCard },
            },
        });
        arrangement = factory.create_root_module();
    });

    it('returns -1 for default card limit', function () {
        expect(arrangement.get_max_cards()).toBe(-1);
    });

    it("pays attention to the implementation's fade_card_in()", function () {
        spyOn(arrangement, 'fade_card_in');
        arrangement.fade_cards = true;
        arrangement.set_models([new DModel.Content()]);
        expect(arrangement.fade_card_in).toHaveBeenCalled();
    });

    it('emits a signal when the card is clicked', function (done) {
        let model = new DModel.Content();
        arrangement.set_models([model]);
        arrangement.connect('card-clicked', (arrangement, clicked_model) => {
            expect(clicked_model).toBe(model);
            done();
        });
        factory.get_last_created('card').emit('clicked');
    });

    it('does not create cards for cards beyond the max', function () {
        spyOn(arrangement, 'pack_card');
        arrangement.max_cards = 1;
        Minimal.add_cards(arrangement, 3);
        expect(arrangement.pack_card.calls.count()).toBe(1);
    });
});
