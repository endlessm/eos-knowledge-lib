const {DModel, Gio, GLib, Gtk} = imports.gi;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Actions = imports.framework.actions;
const ContentGroup = imports.framework.modules.contentGroup.contentGroup;
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
        expect(content_group.visible).toBe(true);
        expect(factory.get_created('arrangement.card').length).toBe(5);
    });

    it('dispatches item clicked', function () {
        let model = new DModel.Content();
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

    it('clears the arrangement when the selection is cleared', function () {
        selection.queue_load_more(5);
        expect(arrangement.get_count()).not.toBe(0);
        selection.clear();
        expect(arrangement.get_count()).toBe(0);
    });

    it('hides itself when no content available', function () {
        selection.get_models.and.returnValue([]);
        selection.queue_load_more(0);
        expect(content_group.visible).toBe(false);
    });

    describe('on selection error state', function () {
        let error_label, log_button, stack;
        function is_shown(widget, stack) {
            return (stack.visible_child === widget ||
                widget.is_ancestor(stack.visible_child));
        }

        beforeEach(function () {
            error_label = Gtk.test_find_label(content_group, '*error*');
            log_button = Gtk.test_find_widget(content_group,
                'Download support info', Gtk.Button.$gtype);

            // Implementation detail :-(
            stack = error_label.get_ancestor(Gtk.Stack.$gtype);
        });

        it('displays error message and log download button', function () {
            expect(is_shown(error_label, stack)).toBeFalsy();
            expect(is_shown(log_button, stack)).toBeFalsy();
            selection.simulate_error();
            Utils.update_gui();
            expect(is_shown(error_label, stack)).toBeTruthy();
            expect(is_shown(log_button, stack)).toBeTruthy();
        });

        it('writes out a log file when the log button is clicked', function () {
            let file = {
                replace_contents: jasmine.createSpy('replace_contents')
                    .and.returnValue([true, 'etag']),
                get_uri: jasmine.createSpy('get_uri')
                    .and.returnValue('the log file uri'),
            };
            spyOn(Gio.File, 'new_for_path').and.returnValue(file);
            spyOn(Gtk, 'show_uri');

            selection.simulate_error();
            log_button.clicked();
            Utils.update_gui();
            expect(Gio.File.new_for_path)
                .toHaveBeenCalledWith(jasmine.stringMatching(/eos-knowledge-lib log .*\.txt/));
            expect(file.replace_contents.calls.mostRecent().args[0])
                .toMatch('this string should show up in the backtrace');
            expect(Gtk.show_uri).toHaveBeenCalledWith(
                jasmine.any(Object),
                'the log file uri',
                jasmine.any(Number));
        });
    });
});
