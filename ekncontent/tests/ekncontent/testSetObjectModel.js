const Eknc = imports.gi.EosKnowledgeContent;
const Json = imports.gi.Json;

describe('Set object model', function () {
    let model, jsonld;
    let json_node;

    beforeEach(function () {
        jsonld = {
            '@id': 'ekn://physics-en/ba750fd50f18382198e7876c6eb3b95a4759cf12',
            '@type': 'ekn://_vocab/SetObject',
            '@context': 'ekn://_context/SetObject',
            tags: ['EknHomePageTag', 'EknSetObject'],
            title: 'Astrophysics',
            thumbnail: 'resource:///com/endlessm/physics-en/assets/Astrophysics-thumbnail.jpeg',
            childTags: ['Astrophysics'],
            featured: true,
        };
        json_node = Json.from_string(JSON.stringify(jsonld));
        model = Eknc.SetObjectModel.new_from_json_node(json_node);
    });

    it('inherits properties set from parent model', function () {
        expect(model.title).toEqual(jsonld['title']);
        expect(model.tags.deep_unpack()).toEqual(jasmine.arrayContaining(jsonld['tags']));
        expect(model.featured).toBeTruthy();
        expect(model.thumbnail_uri).toEqual(jsonld['thumbnail']);
    });

    it('marshals a child_tags property', function () {
        expect(model.child_tags.deep_unpack()).toEqual(jasmine.arrayContaining(jsonld['childTags']));
    });
});
