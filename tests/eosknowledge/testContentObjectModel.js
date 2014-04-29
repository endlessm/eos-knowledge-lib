const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const Gio = imports.gi.Gio;

const CONTENT_OBJECT_EMACS = Endless.getCurrentFileDir() + '/../test-content/emacs.jsonld';

function parse_object_from_file (the_file) {
    let file = Gio.file_new_for_path(the_file);
    let [success, data] = file.load_contents(null);
    return JSON.parse(data);
}

describe ("Content Object Model", function () {
    let contentObject;
    let mockContentData = parse_object_from_file(CONTENT_OBJECT_EMACS);

    describe ("Constructor", function () {
        it ("successfully creates new object from properties", function () {
            print(mockContentData["@id"]);
            contentObject = new EosKnowledge.ContentObjectModel({
                ekn_id : mockContentData["@id"],
                title : mockContentData.title,
                thumbnail_uri : mockContentData.thumbnail,
                language : mockContentData.language,
                copyright_holder : mockContentData.copyrightHolder,
                source_uri : mockContentData.sourceURL,
                synopsis : mockContentData.synopsis,
                last_modified_date : mockContentData.lastModifiedDate,
                license : mockContentData.license
            });
            expect(contentObject.title).toEqual(mockContentData.title);
        });

        it ("successfully creates new object from JSON-LD data", function () {
            contentObject = EosKnowledge.ContentObjectModel.new_from_json_ld(mockContentData);
            expect(contentObject.title).toEqual(mockContentData.title);
        });
    });

    describe ("Properties", function () {
        beforeEach (function() {
            contentObject = EosKnowledge.ContentObjectModel.new_from_json_ld(mockContentData);
            contentObject.set_resources(mockContentData.resources);
            contentObject.set_tags(mockContentData.tags);
        });

        it ("should have an ID", function () {
            expect(contentObject.ekn_id).toEqual(mockContentData["@id"]);
        });

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
            expect(contentObject.get_tags()).toEqual(mockContentData["tags"]);
        });

        it ("should have a license", function () {
            expect(contentObject.license).toEqual(mockContentData["license"]);
        });
    });
});
