const {DModel, Gio} = imports.gi;

const ArticleHTMLRenderer = imports.framework.articleHTMLRenderer;
const Utils = imports.tests.utils;
const AppUtils = imports.framework.utils;
const SetMap = imports.framework.setMap;

describe('Article HTML Renderer', function () {
    let wikihow_model, wikibooks_model, wikipedia_model;
    let all_models;
    let renderer;

    beforeEach(function () {
        Utils.register_gresource();
        let engine = DModel.Engine.get_default();
        const html = AppUtils.string_to_bytes('<html><body><p>dummy html</p></body></html>');
        spyOn(engine, 'get_domain').and.returnValue({
            read_uri: () => [true, html, 'text/html']
        });
        spyOn(Gio.Application, 'get_default').and.returnValue({
            get_web_overrides_css: function () { return []; },
        });

        renderer = new ArticleHTMLRenderer.ArticleHTMLRenderer();
        wikipedia_model = new DModel.Article({
            source_uri: 'http://en.wikipedia.org/wiki/When_It_Hits_the_Fan',
            original_uri: 'http://en.wikipedia.org/wiki/When_It_Hits_the_Fan',
            content_type: 'text/html',
            source: 'wikipedia',
            source_name: 'Wikipedia',
            license: 'CC-BY-SA 3.0',
            title: 'Wikipedia title',
            is_server_templated: false,
        });
        wikihow_model = new DModel.Article({
            source_uri: 'http://www.wikihow.com/Give-Passive-Aggressive-Gifts-for-Christmas',
            original_uri: 'http://www.wikihow.com/Give-Passive-Aggressive-Gifts-for-Christmas',
            content_type: 'text/html',
            source: 'wikihow',
            source_name: 'wikiHow',
            license: 'Owner permission',
            title: 'Wikihow & title',
            is_server_templated: false,
        });
        wikibooks_model = new DModel.Article({
            source_uri: 'http://en.wikibooks.org/wiki/When_It_Hits_the_Fan',
            original_uri: 'http://en.wikibooks.org/wiki/When_It_Hits_the_Fan',
            content_type: 'text/html',
            source: 'wikibooks',
            source_name: 'Wikibooks',
            license: 'CC-BY-SA 3.0',
            title: 'Wikibooks title',
            is_server_templated: false,
        });

        all_models = [
            wikipedia_model,
            wikihow_model,
            wikibooks_model,
        ];
    });

    it('can render an article', function () {
        expect(renderer.render(wikihow_model)).toBeDefined();
    });

    it('does not render double html and body tags', function () {
        let html = renderer.render(wikibooks_model);
        expect(html.match(/<html>/g).length).toBe(1);
        expect(html.match(/<body>/g).length).toBe(1);
    });

    it('includes correct auxillary css on any model type', function () {
        all_models.forEach(m => {
            expect(renderer.render(m)).toMatch('clipboard.css');
            expect(renderer.render(m)).toMatch('share-actions.css');
        });
    });

    it('includes correct auxillary js on any model type', function () {
        all_models.forEach(m => {
            expect(renderer.render(m)).toMatch('jquery-min.js');
            expect(renderer.render(m)).toMatch('clipboard-manager.js');
            expect(renderer.render(m)).toMatch('crosslink.js');
            expect(renderer.render(m)).toMatch('chunk.js');
            expect(renderer.render(m)).toMatch('share-actions.js');
        });
    });

    it('includes custom css on any model type', function () {
        renderer.set_custom_css_files(['custom.css'])
        all_models.forEach(m =>
            expect(renderer.render(m)).toMatch('custom.css')
        );
    });

    ['facebook', 'twitter', 'whatsapp'].forEach(function (network) {
        it(`includes a share button for ${network}`, function () {
            expect(renderer.render(wikipedia_model))
                .toMatch(`messageHandlers.share_on_${network}.postMessage\\(0\\)`);
        });
    });

    it('escapes html special characters in title', function () {
        let html = renderer.render(wikihow_model);
        expect(html).toMatch('Wikihow &amp; title');
    });

    it('includes article html unescaped', function () {
        let html = renderer.render(wikihow_model);
        expect(html).toMatch('<p>dummy html</p>');
    });

    describe('Model with custom tags', function () {
        let model;
        let setModel;
        let nonfeaturedSetModel;

        beforeEach(function () {
            model = new DModel.Article({
                source_uri: 'http://en.wikibooks.org/wiki/When_It_Hits_the_Fan',
                original_uri: 'http://en.wikibooks.org/wiki/When_It_Hits_the_Fan',
                content_type: 'text/html',
                source: 'wikibooks',
                source_name: 'Wikibooks',
                license: 'CC-BY-SA 3.0',
                title: 'Wikibooks title',
                tags: ['Famous Books']
            });
            setModel = new DModel.Set({
                tags: ['EknSetObject'],
                title: 'Famous Books - Set Title',
                featured: true,
                child_tags: ['Famous Books']
            });
            nonfeaturedSetModel = new DModel.Set({
                tags: ['EknSetObject'],
                title: 'Infamous Books - Set Title',
                featured: false,
                child_tags: ['Infamous Books']
            });

            SetMap.init_map_with_models([nonfeaturedSetModel, setModel]);
        });

        afterEach(function () {
            SetMap.init_map_with_models([]);
        });

        it('includes sets in the metadata', function () {
            expect(renderer.render(model)).toMatch('Famous Books \\- Set Title');
        });

        it('includes featured ParentSets in the chunk data', function () {
            expect(renderer.render(model))
                .toMatch('"ParentFeaturedSets":\\s*\\[\\{.*"title":\s*"Famous Books \\- Set Title"');
        });

        it('does not include non-featured ParentSets in the chunk data', function () {
            expect(renderer.render(model))
                .not.toMatch('"ParentFeaturedSets":\\s*\\[\\{.*"title":\s*"Infamous Books \\- Set Title"');
        });
    });

    describe('Model with outgoing links', function () {
        let model;
        let setModel;
        let nonfeaturedSetModel;
        let engine;

        beforeEach(function () {
            engine = DModel.Engine.get_default();
            model = new DModel.Article({
                source_uri: 'http://en.wikibooks.org/wiki/When_It_Hits_the_Fan',
                original_uri: 'http://en.wikibooks.org/wiki/When_It_Hits_the_Fan',
                content_type: 'text/html',
                source: 'wikibooks',
                source_name: 'Wikibooks',
                license: 'CC-BY-SA 3.0',
                title: 'Wikibooks title',
                tags: ['Famous Books'],
                outgoing_links: [
                    'http://outgoing.link',
                ]
            });

            spyOn(engine, 'test_link').and.callFake(function(link) {
                if (link === 'http://outgoing.link') {
                    return 'ekn://some_uri';
                }

                return null;
            });
        });

        it('includes cross-links in the metadata', function () {
            expect(renderer.render(model)).toMatch('crosslink_init\\(\\["ekn://some_uri"');
        });
    });

    describe('Server templated content', function () {
        let server_templated_model, html;

        beforeEach(function() {
            server_templated_model = new DModel.Article({
                content_type: 'text/html',
                is_server_templated: true,
                title: 'Some good server templated content',
            });
            let renderer = new ArticleHTMLRenderer.ArticleHTMLRenderer();
            html = renderer.render(server_templated_model);
        });

        it('can render server-templated content', function () {
            expect(html).toBeDefined();
        });

        it('was sent through the wrapper', function () {
            expect(html).toMatch(/window\.crosslink_init/);
        });

        it('contains the body of the content as well', function () {
            expect(html).toMatch(/dummy html/);
        });
    });
});
