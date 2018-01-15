const Eknc = imports.gi.EosKnowledgeContent;

const MOCK_CONTENT_DATA = {
    '@id': 'ekn:text_editors/Emacs',
    'title': 'Emacs',
    'originalURI': 'http://en.wikipedia.org/wiki/Emacs',
    'language': 'pt-BR',
    'synopsis': 'Emacs was invented by Richard Stallman after a long night of drinking.',
    'lastModifiedDate': '2013-05-09T04:12:44',
    'tags': ['uninstall plz', 'awful', 'butterflies'],
    'license': 'Creative-Commons',
    'thumbnail': 'ekn://text_editors/Stallman.jpg',
    'resources': ['ekn://text_editors/stallman_the_bard', 'ekn://text_editors/emacs_screenshot'],
    'featured': true,
    'discoveryFeedContent': {'blurbs':
        ['10 Facts About Emacs That Will Blow Your Mind. #7 Knocked My Socks Off!'],
    },
};

describe('Content Object Model', function () {
    let contentObject;

    it('successfully creates new object from properties', function () {
        contentObject = Eknc.ContentObjectModel.new_from_props({
            ekn_id : 'ekn:text_editors/Emacs',
            title : 'Emacs',
        });
        expect(contentObject.title).toEqual('Emacs');
    });

    it('successfully creates new object from JSON-LD data', function () {
        contentObject = Eknc.ContentObjectModel.new_from_json(MOCK_CONTENT_DATA);
        expect(contentObject.title).toEqual(MOCK_CONTENT_DATA.title);
    });

    it('successfully creates new object from JSON-LD with missing properties', function () {
        let just_a_title_json_ld = {
            '@id': MOCK_CONTENT_DATA['@id'],
            'title': MOCK_CONTENT_DATA['title']
        };
        contentObject = Eknc.ContentObjectModel.new_from_json(just_a_title_json_ld);
        expect(contentObject.title).toEqual(MOCK_CONTENT_DATA.title);
    });

    it('successfully creates a new object with no info at all', function () {
        contentObject = Eknc.ContentObjectModel.new_from_props();
        expect(contentObject.ekn_id.startsWith('ekn:///')).toBeTruthy();
    });

    describe ('properties', function () {
        beforeEach (function() {
            contentObject = Eknc.ContentObjectModel.new_from_json(MOCK_CONTENT_DATA);
        });

        it('should have an ID', function () {
            expect(contentObject.ekn_id).toEqual(MOCK_CONTENT_DATA['@id']);
        });

        it('should have a title', function () {
            expect(contentObject.title).toEqual(MOCK_CONTENT_DATA['title']);
        });

        it('has an original URI', function () {
            expect(contentObject.original_uri).toEqual(MOCK_CONTENT_DATA.originalURI);
        });

        it('should have a language', function () {
            expect(contentObject.language).toEqual(MOCK_CONTENT_DATA['language']);
        });

        it('should have a synopsis', function () {
            expect(contentObject.synopsis).toEqual(MOCK_CONTENT_DATA['synopsis']);
        });

        it('should have a last-modified date', function () {
            expect(new Date(contentObject.last_modified_date))
                .toEqual(new Date(MOCK_CONTENT_DATA.lastModifiedDate));
        });

        it('should have tags', function () {
            expect(contentObject.tags).toEqual(MOCK_CONTENT_DATA['tags']);
        });

        it('should have a license', function () {
            expect(contentObject.license).toEqual(MOCK_CONTENT_DATA['license']);
        });

        it('should have a thumbnail-uri', function () {
            expect(contentObject.thumbnail_uri).toEqual(MOCK_CONTENT_DATA['thumbnail']);
        });

        it('should have resources', function () {
            expect(contentObject.resources).toEqual(MOCK_CONTENT_DATA.resources);
        });

        it('has a featured flag', function () {
            expect(contentObject.featured).toBeTruthy();
        });

        // SKIP: Doesn't work because of deep-unpacking
        xit('has discovery feed content', function () {
            expect(contentObject.discovery_feed_content)
                .toEqual(MOCK_CONTENT_DATA['discoveryFeedContent']);
        });
    });
});
