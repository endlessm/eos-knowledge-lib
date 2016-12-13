const Eknc = imports.gi.EosKnowledgeContent;
const Gio = imports.gi.Gio;

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
        let model = Eknc.ContentObjectModel.new_from_props({
            thumbnail_uri: image,
        });

        _check_color_for_model(model, done);
    });

    function _check_color_for_model (model, done) {
        DominantColor.get_dominant_color(model, null, (helper, task_obj) => {
            expect(helper.get_dominant_color_finish(task_obj)).toEqual(color);
            done();
        });
    }
});
