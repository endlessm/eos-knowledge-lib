const Eknc = imports.gi.EosKnowledgeContent;
const Json = imports.gi.Json;

const InstanceOfMatcher = imports.tests.InstanceOfMatcher;

describe('Object model from json node', function () {
    beforeEach(function () {
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
    });

    it('errors with malformed data', function () {
        let node = Json.from_string(JSON.stringify([1, 2, 3]));
        expect(() => { Eknc.object_model_from_json_node(node); }).toThrow();
    });

    it('errors with missing @type', function () {
        let node = Json.from_string(JSON.stringify({}));
        expect(() => { Eknc.object_model_from_json_node(node); }).toThrow();
    });

    it('errors with unknown @type', function () {
        let node = Json.from_string(JSON.stringify({
            '@type': 'foobar',
        }));
        expect(() => { Eknc.object_model_from_json_node(node); }).toThrow();
    });

    it('creates a content object model', function () {
        let node = Json.from_string(JSON.stringify({
            '@type': 'ekn://_vocab/ContentObject',
        }));
        let model = Eknc.object_model_from_json_node(node);
        expect(model).toBeA(Eknc.ContentObjectModel);
    });

    it('creates a article object model', function () {
        let node = Json.from_string(JSON.stringify({
            '@type': 'ekn://_vocab/ArticleObject',
        }));
        let model = Eknc.object_model_from_json_node(node);
        expect(model).toBeA(Eknc.ArticleObjectModel);
    });

    it('creates a set object model', function () {
        let node = Json.from_string(JSON.stringify({
            '@type': 'ekn://_vocab/SetObject',
        }));
        let model = Eknc.object_model_from_json_node(node);
        expect(model).toBeA(Eknc.SetObjectModel);
    });

    it('creates a media object model', function () {
        let node = Json.from_string(JSON.stringify({
            '@type': 'ekn://_vocab/MediaObject',
        }));
        let model = Eknc.object_model_from_json_node(node);
        expect(model).toBeA(Eknc.MediaObjectModel);
    });

    it('creates a video object model', function () {
        let node = Json.from_string(JSON.stringify({
            '@type': 'ekn://_vocab/VideoObject',
        }));
        let model = Eknc.object_model_from_json_node(node);
        expect(model).toBeA(Eknc.VideoObjectModel);
    });

    it('creates a image object model', function () {
        let node = Json.from_string(JSON.stringify({
            '@type': 'ekn://_vocab/ImageObject',
        }));
        let model = Eknc.object_model_from_json_node(node);
        expect(model).toBeA(Eknc.ImageObjectModel);
    });
});
