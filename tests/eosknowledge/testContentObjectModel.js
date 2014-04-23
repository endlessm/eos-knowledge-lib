const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;

const CONTENT_OBJECT_EMACS = Endless.getCurrentFileDir() + '/../test-content/emacs.jsonld';

function parse_object_from_file (filename) {
    var file = Gio.file_new_for_path(CONTENT_OBJECT_EMACS);
    var data = file.load_contents(null);
    return JSON.parse(data[1]);
};

describe ("Content Object Model", function () {
    let contentObject;
    let mockContentData = parse_object_from_file(CONTENT_OBJECT_EMACS);

    beforeEach (function() {
        contentObject = new EosKnowledge.ContentObjectModel(mockContentData);
    });

    describe ("Constructor", function () {
        it ("throws error when '@type' is not present", function () {
            let wrongData = {
                "@context": "ekn:context/FooBar",
                "@id": "http://localhost:3000/v2/text_editors/Emacs"
            };

            expect(function () {
                let wrong = new EosKnowledge.ContentObjectModel(wrongData);
            }).toThrow();
        });

        it ("throws error when '@id' is not present", function () {
            let wrongData = {
                "@type": "ekn:vocab/ContentObject",
                "@context": "ekn:context/FooBar"
            };

            expect(function () {
                let wrong = new EosKnowledge.ContentObjectModel(wrongData);
            }).toThrow();
        });
    });

    describe ("Properties", function () {
        it ("should have a title", function () {
            expect(contentObject.title).toEqual(mockContentData["title"]);
        });

        it ("should have a language", function () {
            expect(contentObject.language).toEqual(mockContentData["language"]);
        });

        it ("should have a synopsis", function () {
            expect(contentObject.synopsis).toEqual(mockContentData["synopsis"]);
        });

        it ("should have a last-modified date", function () {
            expect(contentObject.last_modified_date).toEqual(new Date(mockContentData.lastModifiedDate));
        });

        it ("should have tags", function () {
            expect(contentObject.tags).toEqual(mockContentData["tags"]);
        });

        it ("should have a license", function () {
            expect(contentObject.license).toEqual(mockContentData["license"]);
        });
    })
});
