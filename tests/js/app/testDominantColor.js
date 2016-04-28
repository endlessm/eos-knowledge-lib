// Copyright (C) 2016 Endless Mobile, Inc.

const Gio = imports.gi.Gio;

const ContentObjectModel = imports.search.contentObjectModel;
const DominantColor = imports.app.dominantColor;
const MockEngine = imports.tests.mockEngine;
const Utils = imports.tests.utils;

const TEST_CONTENT_BUILDDIR = Utils.get_test_content_builddir();

describe ('Dominant Color', function () {
    let color, image, engine;

    beforeEach(function () {
        color = '#604C28';
        image = 'resource:///com/endlessm/thrones/red_wedding.jpg';
        engine = MockEngine.mock_default();

        let resource = Gio.Resource.load(TEST_CONTENT_BUILDDIR + 'test-content.gresource');
        resource._register();
    });

    it('extracts color when fetching the image from a resource file', function (done) {
        let model = new ContentObjectModel.ContentObjectModel({
            thumbnail_uri: image,
        });

        _check_color_for_model(model, done);
    });

    it('extracts color when fetching the image from another model', function (done) {
        let model = new ContentObjectModel.ContentObjectModel({
            thumbnail_uri: 'ekn:///image',
        });

        let image_model = new ContentObjectModel.ContentObjectModel({
            ekn_id: 'ekn:///image',
            get_content_stream: () => {
                let file = Gio.File.new_for_uri(image);
                return file.read(null);
            },
        });

        engine.get_object_by_id_finish.and.returnValue(image_model);

        _check_color_for_model(model, done);
    });

    function _check_color_for_model (model, done) {
        DominantColor.get_dominant_color(model, null, (helper, task_obj) => {
            expect(helper.get_dominant_color_finish(task_obj)).toEqual(color);
            done();
        });
    }
});
