const {DModel, Gio} = imports.gi;

const DominantColor = imports.framework.dominantColor;
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

    it('extracts color when fetching the image from a resource file', function () {
        let model = new DModel.Content({
            thumbnail_uri: image,
        });

        _check_color_for_model(model);
    });

    function _check_color_for_model (model) {
        expect(DominantColor.get_dominant_color(model)).toEqual(color);
    }
});
