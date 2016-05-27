const Gtk = imports.gi.Gtk;

const ContentObjectModel = imports.search.contentObjectModel;
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
                'order': {
                    type: Minimal.MinimalOrder,
                    properties: {
                        'ascending': false,
                    },
                },
                'filter': { type: Minimal.TitleFilter },
            },
        });
        arrangement = factory.create_module_tree();
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
        factory.get_last_created('card').emit('clicked');
    });

    it('packs its cards in the correct order', function () {
        spyOn(arrangement, 'pack_card');
        let models = Minimal.add_ordered_cards(arrangement, 5);
        arrangement.pack_card.calls.allArgs().forEach((args, ix) => {
            expect(args[0].model).toBe(models[ix]);
            expect(args[1]).toBe(0);  // each card packed in front
        });
    });

    it('filters its cards', function () {
        spyOn(arrangement, 'pack_card');
        let models = Minimal.add_filtered_cards(arrangement, 3, 3);
        expect(arrangement.pack_card.calls.count()).toBe(3);
        arrangement.pack_card.calls.allArgs().map(args => args[0].model).forEach(model => {
            expect(models).toContain(model);
            expect(model.title).toEqual('#nofilter');
        });
    });

    it('does not create cards for cards beyond the max', function () {
        spyOn(arrangement, 'pack_card');
        arrangement.max_cards = 1;
        Minimal.add_filtered_cards(arrangement, 3, 3);
        expect(arrangement.pack_card.calls.count()).toBe(1);
    });
});
