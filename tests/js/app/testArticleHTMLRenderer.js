const Eknc = imports.gi.EosKnowledgeContent;

const ArticleHTMLRenderer = imports.app.articleHTMLRenderer;
const Utils = imports.tests.utils;
const AppUtils = imports.app.utils;
const SetMap = imports.app.setMap;

describe('Article HTML Renderer', function () {
    let wikihow_model, wikibooks_model, wikipedia_model, wikisource_model;
    let renderer;

    beforeEach(function () {
        Utils.register_gresource();
        let engine = Eknc.Engine.get_default();
        const html = AppUtils.string_to_bytes('<html><body><p>dummy html</p></body></html>');
        spyOn(engine, 'get_domain').and.returnValue({
            read_uri: () => [true, html, 'text/html']
        });

        renderer = new ArticleHTMLRenderer.ArticleHTMLRenderer();
        wikipedia_model = Eknc.ArticleObjectModel.new_from_props({
            source_uri: 'http://en.wikipedia.org/wiki/When_It_Hits_the_Fan',
            original_uri: 'http://en.wikipedia.org/wiki/When_It_Hits_the_Fan',
            content_type: 'text/html',
            source: 'wikipedia',
            source_name: 'Wikipedia',
            license: 'CC-BY-SA 3.0',
            title: 'Wikipedia title',
        });
        wikisource_model = Eknc.ArticleObjectModel.new_from_props({
            source_uri: 'http://en.wikisource.org/wiki/When_It_Hits_the_Fan',
            original_uri: 'http://en.wikisource.org/wiki/When_It_Hits_the_Fan',
            content_type: 'text/html',
            source: 'wikisource',
            source_name: 'Wikibooks',
            license: 'CC-BY-SA 3.0',
            title: 'Wikibooks title',
        });
        wikihow_model = Eknc.ArticleObjectModel.new_from_props({
            source_uri: 'http://www.wikihow.com/Give-Passive-Aggressive-Gifts-for-Christmas',
            original_uri: 'http://www.wikihow.com/Give-Passive-Aggressive-Gifts-for-Christmas',
            content_type: 'text/html',
            source: 'wikihow',
            source_name: 'wikiHow',
            license: 'Owner permission',
            title: 'Wikihow & title',
        });
        wikibooks_model = Eknc.ArticleObjectModel.new_from_props({
            source_uri: 'http://en.wikibooks.org/wiki/When_It_Hits_the_Fan',
            original_uri: 'http://en.wikibooks.org/wiki/When_It_Hits_the_Fan',
            content_type: 'text/html',
            source: 'wikibooks',
            source_name: 'Wikibooks',
            license: 'CC-BY-SA 3.0',
            title: 'Wikibooks title',
        });
    });

    it('can render an article', function () {
        expect(renderer.render(wikihow_model)).toBeDefined();
    });

    it('does not render double html and body tags', function () {
        let html = renderer.render(wikibooks_model);
        expect(html.match(/<html>/g).length).toBe(1);
        expect(html.match(/<body>/g).length).toBe(1);
    });

    it('shows a title only when told to', function () {
        let html_no_title = renderer.render(wikibooks_model);
        renderer.show_title = true;
        let html_with_title = renderer.render(wikibooks_model);
        expect(html_with_title).toMatch('Wikibooks title');
        expect(html_no_title).not.toMatch('Wikibooks title');
    });

    it('links to creative commons license on wikimedia pages', function () {
        let html = renderer.render(wikibooks_model);
        expect(html).toMatch('license://CC-BY-SA%203.0');
    });

    it('links to original wikihow articles', function () {
        let html = renderer.render(wikihow_model);
        expect(html).toMatch('http://www.wikihow.com/Give-Passive-Aggressive-Gifts-for-Christmas');
    });

    it('includes correct css for article type', function () {
        expect(renderer.render(wikihow_model)).toMatch('wikihow.css');
        expect(renderer.render(wikibooks_model)).toMatch('wikimedia.css');
    });

    it('escapes html special characters in title', function () {
        let html = renderer.render(wikihow_model);
        expect(html).toMatch('Wikihow &amp; title');
    });

    it('includes article html unescaped', function () {
        let html = renderer.render(wikihow_model);
        expect(html).toMatch('<p>dummy html</p>');
    });

    it('includes scroll_manager.js only when told to', function () {
        let html_without_scroll_manager = renderer.render(wikibooks_model);
        renderer.enable_scroll_manager = true;
        let html_with_scroll_manager = renderer.render(wikibooks_model);

        expect(html_with_scroll_manager).toMatch('scroll-manager.js');
        expect(html_without_scroll_manager).not.toMatch('scroll-manager.js');
    });

    it('includes MathJax in rendered Wikipedia, Wikibooks, and Wikisource articles', function () {
        let html = renderer.render(wikibooks_model);
        expect(html).toMatch('<script type="text/x-mathjax-config">');
        html = renderer.render(wikipedia_model);
        expect(html).toMatch('<script type="text/x-mathjax-config">');
        html = renderer.render(wikisource_model);
        expect(html).toMatch('<script type="text/x-mathjax-config">');
    });

    it('does not include MathJax in articles from other sources', function () {
        let html = renderer.render(wikihow_model);
        expect(html).not.toMatch('<script type="text/x-mathjax-config">');
    });

    describe('Prensa Libre source', function () {
        let model, html, set_models;

        beforeEach(function () {
            set_models = [
                Eknc.SetObjectModel.new_from_props({
                    tags: ['EknHomePageTag', 'EknSetObject'],
                    title: 'Guatemala',
                    child_tags: ['guatemala'],
                    featured: true,
                    ekn_id: 'ekn://prensalibre/1',
                }),
                Eknc.SetObjectModel.new_from_props({
                    tags: ['guatemala', 'EknSetObject'],
                    title: 'Comunitario',
                    child_tags: ['guatemala/comunitario'],
                    featured: false,
                    ekn_id: 'ekn://prensalibre/2',
                }),
            ];

            SetMap.init_map_with_models(set_models);
            model = Eknc.ArticleObjectModel.new_from_props({
                source_uri: 'http://www.prensalibre.com/internacional/el-papa-francisco-dice-que-trump-no-puede-proclamarse-cristiano',
                original_uri: 'http://www.prensalibre.com/internacional/el-papa-francisco-dice-que-trump-no-puede-proclamarse-cristiano',
                content_type: 'text/html',
                source: 'prensa-libre',
                source_name: 'Prensa Libre',
                license: 'Owner permission',
                title: 'El papa Francisco dice que Trump no puede proclamarse cristiano',
                authors: ['Por La Redacci\u00f3n'],
                published: '2016-02-25T09:31:00',
                tags: ['guatemala/comunitario', 'guatemala', 'EknArticleObject'],
            });
            html = renderer.render(model);
        });

        it('shows a link back to the original source', function () {
            expect(html).toMatch('href="' + model.original_uri);
        });

        it('shows the date published', function () {
            expect(html).toMatch('2016');
            expect(html).toMatch('25');
            // FIXME: Date formatting is locale-dependent. Should maybe check
            // for the existence of a div, but that's not robust.
        });

        it('shows the main category (and link) the article is tagged with', function () {
            expect(html).toMatch('guatemala');
            expect(html).toMatch(set_models[0].ekn_id);

            expect(html).not.toMatch('comunitario');
            expect(html).not.toMatch(set_models[1].ekn_id);
        });

        it('loads the appropriate CSS file', function () {
            expect(html).toMatch('prensa-libre.css');
        });
    });

    describe('Server templated content', function () {
        let server_templated_model, html;

        beforeEach(function() {
            server_templated_model = Eknc.ArticleObjectModel.new_from_props({
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
