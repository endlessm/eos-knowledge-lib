
const ArticleHTMLRenderer = imports.app.articleHTMLRenderer;
const ArticleObjectModel = imports.search.articleObjectModel;
const Utils = imports.tests.utils;
const SearchUtils = imports.search.utils;

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
        renderer.set_custom_css_files(['reader.css']);
        let html = renderer.render(embedly_model);
        expect(html).toMatch('reader.css');
        expect(no_reader_html).not.toMatch('reader.css');
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

    it('renders wikihow and wiki articles properly with EOS 2.2 DB information', function () {
        let reference_wiki_html = renderer.render(wikibooks_model);
        let reference_wikihow_html = renderer.render(wikihow_model);

        let wikihow_model_eos22 = new ArticleObjectModel.ArticleObjectModel({
            source_uri: 'http://www.wikihow.com/Give-Passive-Aggressive-Gifts-for-Christmas',
            content_type: 'text/html',
            get_content_stream: () => { return SearchUtils.string_to_stream('<html><body><p>wikihow html</p></body></html>'); },
            source: 'wikihow',
            license: 'Creative Commons',
            title: 'Wikihow & title',
        });
        let wikibooks_model_eos22 = new ArticleObjectModel.ArticleObjectModel({
            source_uri: 'http://en.wikibooks.org/wiki/When_It_Hits_the_Fan',
            content_type: 'text/html',
            get_content_stream: () => { return SearchUtils.string_to_stream('<html><body><p>wikibooks html</p></body></html>'); },
            source: 'wikibooks',
            license: 'Creative Commons',
            title: 'Wikibooks title',
        });

        let wiki_html = renderer.render(wikibooks_model_eos22);
        let wikihow_html = renderer.render(wikihow_model_eos22);

        expect(wiki_html).toEqual(reference_wiki_html);
        expect(wikihow_html).toEqual(reference_wikihow_html);
    });
});
