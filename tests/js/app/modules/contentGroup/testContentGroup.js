const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Actions = imports.app.actions;
const ContentGroup = imports.app.modules.contentGroup.contentGroup;
const ContentObjectModel = imports.search.contentObjectModel;
const Minimal = imports.tests.minimal;
const MockDispatcher = imports.tests.mockDispatcher;
const MockFactory = imports.tests.mockFactory;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);

describe('ContentGroup.ContentGroup', function () {
    let content_group, arrangement, title, selection, factory, dispatcher;

    beforeEach(function () {
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

        dispatcher = MockDispatcher.mock_default();
        [content_group, factory] = MockFactory.setup_tree({
            type: ContentGroup.ContentGroup,
            slots: {
                'arrangement': {
                    type: Minimal.MinimalArrangement,
                    slots: {
                        'card': { type: Minimal.MinimalCard },
                    },
                },
                'title': {
                    type: Minimal.MinimalBinModule,
                },
                'selection': {
                    type: Minimal.MinimalSelection,
                },
            },
        });
        arrangement = factory.get_last_created('arrangement');
        title = factory.get_last_created('title');
        selection = factory.get_last_created('selection');
        spyOn(selection, 'get_models').and.callThrough();
    });

    it('creates and packs an arrangement widget', function () {
        expect(content_group).toHaveDescendant(arrangement);
    });

    it('creates and packs a title widget', function () {
        expect(content_group).toHaveDescendant(title);
    });

    it('does not create a card widget at construct time', function () {
        let cards = factory.get_created('arrangement.card');
        expect(cards.length).toEqual(0);
    });

    it('adds cards created by selection to the arrangement', function () {
        selection.queue_load_more(5);
        expect(arrangement.get_count()).toBe(5);
        expect(factory.get_created('arrangement.card').length).toBe(5);
    });

    it('dispatches item clicked', function () {
        let model = new ContentObjectModel.ContentObjectModel();
        selection.get_models.and.returnValue([model]);
        content_group.load();
        arrangement.emit('card-clicked', model);
        Utils.update_gui();
        let payload = dispatcher.last_payload_with_type(Actions.ITEM_CLICKED);
        let matcher = jasmine.objectContaining({
            model: model,
            context: [ model ],
        });
        expect(payload).toEqual(matcher);
    });

    it('displays error message on selection error state', function () {
        let error_label = Gtk.test_find_label(content_group, '*error*');

        // Implementation detail :-(
        let stack = error_label.get_ancestor(Gtk.Stack.$gtype);
        function is_shown(widget, stack) {
            return (stack.visible_child === widget ||
                widget.is_ancestor(stack.visible_child));
        }

        expect(is_shown(error_label, stack)).toBeFalsy();
        selection.simulate_error();
        Utils.update_gui();
        expect(is_shown(error_label, stack)).toBeTruthy();
    });
});
