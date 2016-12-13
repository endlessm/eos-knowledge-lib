// Copyright 2016 Endless Mobile, Inc.

const Eknc = imports.gi.EosKnowledgeContent;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const ContentGroup = imports.app.modules.contentGroup.contentGroup;
const DynamicBackground = imports.app.modules.layout.dynamicBackground;
const Minimal = imports.tests.minimal;
const MockFactory = imports.tests.mockFactory;

const TEST_CONTENT_BUILDDIR = Utils.get_test_content_builddir();

Gtk.init(null);

describe('Layout.DynamicBackground', function () {
    let module, factory, selection;

    beforeEach(function () {
        [module, factory] = MockFactory.setup_tree({
            type: DynamicBackground.DynamicBackground,
            slots: {
                'content': {
                    type: ContentGroup.ContentGroup,
                    slots: {
                        'selection': {
                            id: 'selection',
                            type: Minimal.MinimalSelection,
                        },
                        'arrangement': {
                            type: Minimal.MinimalArrangement,
                            slots: {
                                'card': { type: Minimal.MinimalCard },
                            },
                        },
                    },
                },
            },
            references: {
                'selection': 'selection',
            },
        });

        let resource = Gio.Resource.load(TEST_CONTENT_BUILDDIR + 'test-content.gresource');
        resource._register();

        spyOn(Gtk.CssProvider.prototype, 'load_from_data');
        selection = factory.get_created('content.selection')[0];
    });

    it('listens to the corresponding event', function () {
        let color = /#604C28/;
        let image = 'resource:///com/endlessm/thrones/red_wedding.jpg';
        let model = Eknc.ContentObjectModel.new_from_props({
            thumbnail_uri: image,
        });
        selection.add_model(model);
        selection.emit('models-changed');
        Utils.update_gui();

        expect(Gtk.CssProvider.prototype.load_from_data.calls.mostRecent().args[0]).toMatch(color);
    });

    it('handles models without thumbnail', function () {
        let model = Eknc.ContentObjectModel.new_from_props();
        selection.add_model(model);
        selection.emit('models-changed');
        Utils.update_gui();

        expect(Gtk.CssProvider.prototype.load_from_data).toHaveBeenCalled();
    });
});
