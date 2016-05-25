
const ArticleHTMLRenderer = imports.app.articleHTMLRenderer;
const ArticleObjectModel = imports.search.articleObjectModel;
const Utils = imports.tests.utils;
const SearchUtils = imports.search.utils;
const SetMap = imports.app.setMap;
const SetObjectModel = imports.search.setObjectModel;

describe('Article HTML Renderer', function () {
    let wikihow_model, wikibooks_model, embedly_model, javascripty_model;
    let renderer;

    beforeEach(function () {
        Utils.register_gresource();

        renderer = new ArticleHTMLRenderer.ArticleHTMLRenderer();
        wikihow_model = new ArticleObjectModel.ArticleObjectModel({
            source_uri: 'http://www.wikihow.com/Give-Passive-Aggressive-Gifts-for-Christmas',
            original_uri: 'http://www.wikihow.com/Give-Passive-Aggressive-Gifts-for-Christmas',
            get_content_stream: () => { return SearchUtils.string_to_stream('<html><body><p>wikihow html</p></body></html>'); },
            content_type: 'text/html',
            source: 'wikihow',
            source_name: 'wikiHow',
            license: 'Owner permission',
            title: 'Wikihow & title',
        });
        wikibooks_model = new ArticleObjectModel.ArticleObjectModel({
            source_uri: 'http://en.wikibooks.org/wiki/When_It_Hits_the_Fan',
            original_uri: 'http://en.wikibooks.org/wiki/When_It_Hits_the_Fan',
            get_content_stream: () => { return SearchUtils.string_to_stream('<html><body><p>wikibooks html</p></body></html>'); },
            content_type: 'text/html',
            source: 'wikibooks',
            source_name: 'Wikibooks',
            license: 'CC-BY-SA 3.0',
            title: 'Wikibooks title',
        });
        embedly_model = new ArticleObjectModel.ArticleObjectModel({
            get_content_stream: () => { return SearchUtils.string_to_stream('<html><body><p>embedly html</p></body></html>'); },
            content_type: 'text/html',
            source: 'embedly',
            original_uri: 'http://blog.ly/post/2015/03/12/rendering-an-article',
            source_name: 'Pantheon Blog',
            license: 'CC-BY-SA 4.0',
            title: 'Embedly title',
        });
        javascripty_model = new ArticleObjectModel.ArticleObjectModel({
            get_content_stream: () => { return SearchUtils.string_to_stream('<html>{{{#javascript-files}}}{{{.}}}{{{#javascript-files}}}</html>'); },
            content_type: 'text/html',
            source: 'wikihow',
            title: 'Javascripts Galore',
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
        let html_no_title = renderer.render(embedly_model);
        renderer.show_title = true;
        let html_with_title = renderer.render(embedly_model);
        expect(html_with_title).toMatch('Embedly title');
        expect(html_no_title).not.toMatch('Embedly title');
    });

    it('links to creative commons license on wikimedia pages', function () {
        let html = renderer.render(wikibooks_model);
        expect(html).toMatch('creativecommons');
    });

    it('links to original wikihow articles', function () {
        let html = renderer.render(wikihow_model);
        expect(html).toMatch('http://www.wikihow.com/Give-Passive-Aggressive-Gifts-for-Christmas');
    });

    it('includes correct css for article type', function () {
        expect(renderer.render(wikihow_model)).toMatch('wikihow.css');
        expect(renderer.render(wikibooks_model)).toMatch('wikimedia.css');
        expect(renderer.render(embedly_model)).toMatch('embedly.css');
    });

    it('links to the custom css only when told to', function () {
        let no_reader_html = renderer.render(embedly_model);
        renderer.set_custom_css_files(['reader2.css']);
        let html = renderer.render(embedly_model);
        expect(html).toMatch('reader2.css');
        expect(no_reader_html).not.toMatch('reader2.css');
    });

    it('escapes html special characters in title', function () {
        let html = renderer.render(wikihow_model);
        expect(html).toMatch('Wikihow &amp; title');
    });

    it('includes article html unescaped', function () {
        let html = renderer.render(wikihow_model);
        expect(html).toMatch('<p>wikihow html</p>');
    });

    it('includes scroll_manager.js only when told to', function () {
        let html_without_scroll_manager = renderer.render(embedly_model);
        renderer.enable_scroll_manager = true;
        let html_with_scroll_manager = renderer.render(embedly_model);

        expect(html_with_scroll_manager).toMatch('scroll-manager.js');
        expect(html_without_scroll_manager).not.toMatch('scroll-manager.js');
    });

    it('links to the original blog in embedly articles', function () {
        let html = renderer.render(embedly_model);
        expect(html).toMatch(/<a.*>Pantheon Blog<\/a>/);
        expect(html).toMatch('http://blog.ly/post/2015/03/12/rendering-an-article');
    });

    it('links to the license in embedly articles', function () {
        let html = renderer.render(embedly_model);
        expect(html).toMatch('creativecommons');
    });

    it('includes MathJax in rendered Wikipedia, Wikibooks, and Wikisource articles', function () {
        let html = renderer.render(wikibooks_model);
        expect(html).toMatch('<script type="text/x-mathjax-config">');
        wikibooks_model.source = 'wikipedia';
        html = renderer.render(wikibooks_model);
        expect(html).toMatch('<script type="text/x-mathjax-config">');
        wikibooks_model.source = 'wikisource';
        html = renderer.render(wikibooks_model);
        expect(html).toMatch('<script type="text/x-mathjax-config">');
    });

    it('does not include MathJax in articles from other sources', function () {
        let html = renderer.render(wikihow_model);
        expect(html).not.toMatch('<script type="text/x-mathjax-config">');
        html = renderer.render(embedly_model);
        expect(html).not.toMatch('<script type="text/x-mathjax-config">');
    });

    describe('Prensa Libre source', function () {
        let model, html, set_models;

        beforeEach(function () {
            set_models = [
                new SetObjectModel.SetObjectModel({
                    tags: ['EknHomePageTag', 'EknSetObject'],
                    title: 'Guatemala',
                    child_tags: ['guatemala'],
                    featured: true,
                    ekn_id: 'ekn://prensalibre/1',
                }),
                new SetObjectModel.SetObjectModel({
                    tags: ['guatemala', 'EknSetObject'],
                    title: 'Comunitario',
                    child_tags: ['guatemala/comunitario'],
                    featured: false,
                    ekn_id: 'ekn://prensalibre/2',
                }),
            ];

            SetMap.init_map_with_models(set_models);
            model = new ArticleObjectModel.ArticleObjectModel({
                source_uri: 'http://www.prensalibre.com/internacional/el-papa-francisco-dice-que-trump-no-puede-proclamarse-cristiano',
                original_uri: 'http://www.prensalibre.com/internacional/el-papa-francisco-dice-que-trump-no-puede-proclamarse-cristiano',
                get_content_stream: () => SearchUtils.string_to_stream('<html><body><p>Prensa Libre</p></body></html>'),
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
            expect(html).toMatch(model.original_uri);
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
});
