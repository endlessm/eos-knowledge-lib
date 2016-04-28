// Copyright (C) 2016 Endless Mobile, Inc.

const SetObjectModel = imports.search.setObjectModel;

describe('Set object model', function () {
    let model, jsonld;

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
        model = new SetObjectModel.SetObjectModel({}, jsonld);
    });

    it('constructs from a JSON-LD document', function () {
        expect(model).toBeDefined();
    });

    it('inherits properties set from parent model', function () {
        expect(model.title).toEqual(jsonld['title']);
        expect(model.tags).toEqual(jasmine.arrayContaining(jsonld['tags']));
        expect(model.featured).toBeTruthy();
        expect(model.thumbnail_uri).toEqual(jsonld['thumbnail']);
    });

    it('marshals a child_tags property', function () {
        expect(model.child_tags).toEqual(jasmine.arrayContaining(jsonld['childTags']));
    });

    it('makes a deep copy of the child tags', function () {
        jsonld['childTags'] = ['Other', 'tags'];
        expect(model.child_tags).not.toEqual(jsonld['childTags']);
    });
});
