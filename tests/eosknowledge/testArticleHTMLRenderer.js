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
            body_html: '<html><body><p>wikihow body html</p></body></html>',
            html_source: 'wikihow',
            title: 'Wikihow & title',
        });
        wikibooks_model = new EosKnowledgeSearch.ArticleObjectModel({
            source_uri: 'http://en.wikibooks.org/wiki/When_It_Hits_the_Fan',
            body_html: '<html><body><p>wikibooks body html</p></body></html>',
            html_source: 'wikibooks',
            title: 'Wikibooks title',
        });
        embedly_model = new EosKnowledgeSearch.ArticleObjectModel({
            body_html: '<html><body><p>embedly body html</p></body></html>',
            html_source: 'embedly',
            title: 'Embedly title',
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
        let html_with_title = renderer.render(embedly_model, true);
        let html_no_title = renderer.render(embedly_model, false);
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
        expect(html).toMatch('<p>wikihow body html</p>');
    });
});
