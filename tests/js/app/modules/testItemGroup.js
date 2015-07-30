const Gtk = imports.gi.Gtk;

Gtk.init(null);

const ContentObjectModel = imports.search.contentObjectModel;
const ItemGroup = imports.app.modules.itemGroup;
const Minimal = imports.tests.minimal;
const MockFactory = imports.tests.mockFactory;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

describe('Item group module', function () {
    let group, arrangement, factory;

    beforeEach(function () {
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

        factory = new MockFactory.MockFactory();
        factory.add_named_mock('test-arrangement', Minimal.MinimalArrangement);
        factory.add_named_mock('home-card', Minimal.MinimalCard);
        factory.add_named_mock('item-group', ItemGroup.ItemGroup, {
            'arrangement': 'test-arrangement',
        });
        group = new ItemGroup.ItemGroup({
            factory: factory,
            factory_name: 'item-group',
        });
        arrangement = factory.get_created_named_mocks('test-arrangement')[0];
    });

    it('constructs', function () {
        expect(group).toBeDefined();
    });

    it('creates and packs an arrangement widget', function () {
        expect(group).toHaveDescendant(arrangement);
    });

    it('adds cards when given a list of models', function () {
        group.set_cards([
            new ContentObjectModel.ContentObjectModel(),
            new ContentObjectModel.ContentObjectModel(),
            new ContentObjectModel.ContentObjectModel(),
        ]);
        expect(arrangement.count).toBe(3);
        expect(factory.get_created_named_mocks('home-card').length).toBe(3);
    });

    it('clears the existing cards when given a new list', function () {
        group.set_cards([
            new ContentObjectModel.ContentObjectModel(),
            new ContentObjectModel.ContentObjectModel(),
            new ContentObjectModel.ContentObjectModel(),
        ]);
        group.set_cards([
            new ContentObjectModel.ContentObjectModel(),
            new ContentObjectModel.ContentObjectModel(),
        ]);
        expect(arrangement.count).toBe(2);
        expect(factory.get_created_named_mocks('home-card').length).toBe(5);
    });

    it('appends cards from a list of models to the existing cards', function () {
        group.set_cards([
            new ContentObjectModel.ContentObjectModel(),
            new ContentObjectModel.ContentObjectModel(),
            new ContentObjectModel.ContentObjectModel(),
        ]);
        group.append_cards([
            new ContentObjectModel.ContentObjectModel(),
            new ContentObjectModel.ContentObjectModel(),
        ]);
        expect(arrangement.count).toBe(5);
        expect(factory.get_created_named_mocks('home-card').length).toBe(5);
    });
});
