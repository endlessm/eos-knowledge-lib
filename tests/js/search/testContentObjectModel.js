const ContentObjectModel = imports.search.contentObjectModel;
const utils = imports.tests.utils;

const TEST_CONTENT_DIR = utils.get_test_content_srcdir();
const CONTENT_OBJECT_EMACS = TEST_CONTENT_DIR + 'emacs.jsonld';

describe ("Content Object Model", function () {
    let contentObject;
    let mockContentData = utils.parse_object_from_path(CONTENT_OBJECT_EMACS);

    describe ("Constructor", function () {
        it ("successfully creates new object from properties", function () {
            contentObject = new ContentObjectModel.ContentObjectModel({
                ekn_id : mockContentData["@id"],
                title : mockContentData.title,
                original_uri: mockContentData.originalURI,
                thumbnail_id : mockContentData.thumbnail,
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
            contentObject = ContentObjectModel.ContentObjectModel.new_from_json_ld(mockContentData);
            expect(contentObject.title).toEqual(mockContentData.title);
        });

        it ("successfully creates new object from JSON-LD with missing properties", function () {
            let just_a_title_json_ld = {
                "@id": mockContentData["@id"],
                "title": mockContentData["title"]
            };
            contentObject = ContentObjectModel.ContentObjectModel.new_from_json_ld(just_a_title_json_ld);
            expect(contentObject.title).toEqual(mockContentData.title);
        });
    });

    describe ("Properties", function () {
        beforeEach (function() {
            contentObject = ContentObjectModel.ContentObjectModel.new_from_json_ld(mockContentData);
        });

        it ("should have an ID", function () {
            expect(contentObject.ekn_id).toEqual(mockContentData["@id"]);
        });

        it ("should have a title", function () {
            expect(contentObject.title).toEqual(mockContentData["title"]);
        });

        it('has an original URI', function () {
            expect(contentObject.original_uri).toEqual(mockContentData.originalURI);
        });

        it ("should have a language", function () {
            expect(contentObject.language).toEqual(mockContentData["language"]);
        });

        it ("should have a synopsis", function () {
            expect(contentObject.synopsis).toEqual(mockContentData["synopsis"]);
        });

        it ("should have a last-modified date", function () {
            expect(new Date(contentObject.last_modified_date))
                .toEqual(new Date(mockContentData.lastModifiedDate));
        });

        it ("should have tags", function () {
            expect(contentObject.tags).toEqual(mockContentData["tags"]);
        });

        it ("should have a license", function () {
            expect(contentObject.license).toEqual(mockContentData["license"]);
        });

        it ("should have a thumbnail-id", function () {
            expect(contentObject.thumbnail_id).toEqual(mockContentData["thumbnail"]);
        });

        it ("should have resources", function () {
            expect(contentObject.resources).toEqual(mockContentData.resources);
        });

        it ("should have redirects-to", function () {
            expect(contentObject.redirects_to).toEqual(mockContentData.redirectsTo);
        });
    });
});
