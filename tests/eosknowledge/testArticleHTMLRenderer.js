const EosKnowledge = imports.gi.EosKnowledge;
const EosKnowledgeSearch = imports.EosKnowledgeSearch;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

describe('Article HTML Renderer', function () {
    let wikihow_model, wikibooks_model, embedly_model;
    let renderer;

    beforeEach(function () {
        renderer = new EosKnowledge.ArticleHTMLRenderer();
        wikihow_model = new EosKnowledgeSearch.ArticleObjectModel({
            source_uri: 'http://www.wikihow.com/Give-Passive-Aggressive-Gifts-for-Christmas',
            html: '<html><body><p>wikihow html</p></body></html>',
            html_source: 'wikihow',
            title: 'Wikihow & title',
        });
        wikibooks_model = new EosKnowledgeSearch.ArticleObjectModel({
            source_uri: 'http://en.wikibooks.org/wiki/When_It_Hits_the_Fan',
            html: '<html><body><p>wikibooks html</p></body></html>',
            html_source: 'wikibooks',
            title: 'Wikibooks title',
        });
        embedly_model = new EosKnowledgeSearch.ArticleObjectModel({
            html: '<html><body><p>embedly html</p></body></html>',
            html_source: 'embedly',
            title: 'Embedly title',
        });
        javascripty_model = new EosKnowledgeSearch.ArticleObjectModel({
            html: '<html>{{{#javascript-files}}}{{{.}}}{{{#javascript-files}}}</html>',
            html_source: 'wikihow',
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
        renderer.show_title = true;
        let html_with_title = renderer.render(embedly_model);
        renderer.show_title = false;
        let html_no_title = renderer.render(embedly_model);
        expect(html_with_title).toMatch('Embedly title');
        expect(html_no_title).not.toMatch('Embedly title');
    });

    it('links to creative commons license on wikimedia pages', function () {
        let html = renderer.render(wikibooks_model);
        expect(html).toMatch('creativecommons.org');
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

    it('escapes html special characters in title', function () {
        let html = renderer.render(wikihow_model);
        expect(html).toMatch('Wikihow &amp; title');
    });

    it('includes article html unescaped', function () {
        let html = renderer.render(wikihow_model);
        expect(html).toMatch('<p>wikihow html</p>');
    });

    it('includes scroll_manager.js only when told to', function () {
        renderer.enable_scroll_manager = true;
        let html_with_scroll_manager = renderer.render(embedly_model);
        renderer.enable_scroll_manager = false;
        let html_without_scroll_manager = renderer.render(embedly_model);

        expect(html_with_scroll_manager).toMatch('scroll-manager.js');
        expect(html_without_scroll_manager).not.toMatch('scroll-manager.js');
    });
});
