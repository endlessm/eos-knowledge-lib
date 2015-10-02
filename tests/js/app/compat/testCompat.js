const Compat = imports.js.app.compat.compat;
const MockEngine = imports.tests.mockEngine;

describe('Compatibility layer', function () {
    let json;

    beforeEach(function () {
        json = {
            titleImageURI: 'resource:///com/endlessm/thrones-en/agot.svg',
            appId: 'com.endlessm.thrones-en',
            appTitle: 'Game of Thrones',
            appSubtitle: 'A Song of Ice and Fire',
            backgroundHomeURI: 'resource:///com/endlessm/thrones-en/background.jpg',
            backgroundSectionURI: 'resource:///com/endlessm/thrones-en/background_blurred.jpg',
            language: 'en',
            templateType: 'A',
            sections: [
                {
                    title: 'Whitewalkers',
                    thumbnailURI: 'resource:///com/endlessm/thrones-en/whitewalker.jpg',
                    tags: ['asia', 'latin america'],
                },
                {
                    title: 'Kings',
                    thumbnailURI: 'resource:///com/endlessm/thrones-en/joffrey.jpg',
                    featured: true,
                    tags: ['hostels', 'monuments'],
                },
                {
                    title: 'Weddings',
                    thumbnailURI: 'resource:///com/endlessm/thrones-en/red_wedding.jpg',
                    tags: ['countries', 'monuments', 'mountains'],
                },
            ],
        };
    });

    describe('for v1 sections', function () {
        let engine;

        beforeEach(function () {
            engine = new MockEngine.MockEngine();
            engine.default_domain = 'thrones-en';
            spyOn(engine, 'add_runtime_object');
        });

        it('removes the sections property from the app.json object', function () {
            expect(json.hasOwnProperty('sections')).toBeTruthy();
            Compat.create_v1_set_models(json, engine);
            expect(json.hasOwnProperty('sections')).toBeFalsy();
        });

        it('adds runtime objects to the engine for each section', function () {
            Compat.create_v1_set_models(json, engine);
            expect(engine.add_runtime_object).toHaveBeenCalledWith('ekn://thrones-en/920b7986d1d3fdd6ae5ab7be5564423d8333906b',
                jasmine.objectContaining({
                    ekn_id: 'ekn://thrones-en/920b7986d1d3fdd6ae5ab7be5564423d8333906b',
                    title: 'Whitewalkers',
                    thumbnail_uri: 'resource:///com/endlessm/thrones-en/whitewalker.jpg',
                    child_tags: jasmine.arrayContaining(['asia', 'latin america']),
                    tags: ['EknHomePageTag'],
                }));
            expect(engine.add_runtime_object).toHaveBeenCalledWith('ekn://thrones-en/54551efb90c4a248b3d6a040ed847d5a55608878',
                jasmine.objectContaining({
                    ekn_id: 'ekn://thrones-en/54551efb90c4a248b3d6a040ed847d5a55608878',
                    title: 'Kings',
                    thumbnail_uri: 'resource:///com/endlessm/thrones-en/joffrey.jpg',
                    child_tags: jasmine.arrayContaining(['hostels', 'monuments']),
                    tags: ['EknHomePageTag'],
                }));
            expect(engine.add_runtime_object).toHaveBeenCalledWith('ekn://thrones-en/9b802deaa87a0eb04ac716058daf47d1a4aae24a',
                jasmine.objectContaining({
                    ekn_id: 'ekn://thrones-en/9b802deaa87a0eb04ac716058daf47d1a4aae24a',
                    title: 'Weddings',
                    thumbnail_uri: 'resource:///com/endlessm/thrones-en/red_wedding.jpg',
                    child_tags: jasmine.arrayContaining(['countries', 'monuments', 'mountains']),
                    tags: ['EknHomePageTag'],
                }));
        });

        it('does nothing if no sections, like in a reader app', function () {
            Compat.create_v1_set_models({}, engine);
            expect(engine.add_runtime_object).not.toHaveBeenCalled();
        });
    });
});
