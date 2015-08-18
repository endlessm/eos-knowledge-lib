const ByteArray = imports.byteArray;
const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const WebKit2 = imports.gi.WebKit2;

const Utils = imports.tests.utils;
Utils.register_gresource();

const ArticleObjectModel = imports.search.articleObjectModel;
const ReaderDocumentCard = imports.app.modules.readerDocumentCard;
const CssClassMatcher = imports.tests.CssClassMatcher;
const StyleClasses = imports.app.styleClasses;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);

const TEST_CONTENT_DIR = Utils.get_test_content_srcdir();

function register_webkit_uri_handlers () {
    let security_manager = WebKit2.WebContext.get_default().get_security_manager();
    security_manager.register_uri_scheme_as_local('ekn');
    EosKnowledgePrivate.private_register_global_uri_scheme('ekn', (req) => {
        let html = '<html><div>some text</div></html>';
        let bytes = ByteArray.fromString(html).toGBytes();
        let stream = Gio.MemoryInputStream.new_from_bytes(bytes);
        req.finish(stream, -1, 'text/html; charset=utf-8');
    });
}

describe('Document Card', function () {
    let card;
    let article_object;

    beforeEach(function () {
        register_webkit_uri_handlers();
        let dummy_content = Gio.File.new_for_path(TEST_CONTENT_DIR + 'emacs.html');
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

        article_object = new ArticleObjectModel.ArticleObjectModel({
            ekn_id: 'ekn://astronomy-en/foo',
            content_type: 'text/html',
            title: 'Reader article',
        });
        card = new ReaderDocumentCard.ReaderDocumentCard({
            model: article_object,
        });
    });

    it('can be constructed', function () {
        expect(card).toBeDefined();
    });

    it('emits content ready signal after loading content', function (done) {
        card.load_content(null, (card, task) => {
            card.load_content_finish(task);
            done();
        });
    });

    it('emits content error signal after loading bad content', function (done) {
        let article_object = new ArticleObjectModel.ArticleObjectModel({
            ekn_id: 'file:///bad_uri',
            content_type: 'text/html',
            title: 'Reader article',
        });
        let card = new ReaderDocumentCard.ReaderDocumentCard({
            model: article_object,
        });
        card.load_content(null, (card, task) => {
            expect(function () {
                card.load_content_finish(task);
            }).toThrow();
            done();
        });
    });

    it('clears content view when asked to', function () {
        card.load_content(null, (card, task) => {
            card.load_content_finish(task);
        });
        card.clear_content();
        expect(card.content_view).toBe(null);
    });

    describe('Style class of document card', function () {
        it('has article card class', function () {
            expect(card).toHaveCssClass(StyleClasses.CARD);
        });
        it('has a descendant with title class', function () {
            expect(card).toHaveDescendantWithCssClass(StyleClasses.CARD_TITLE);
        });
        it('has a descendant with attribution class', function () {
            expect(card).toHaveDescendantWithCssClass(StyleClasses.READER_ARTICLE_PAGE_ATTRIBUTION);
        });
        it('has a descendant with decorative bar class', function () {
            expect(card).toHaveDescendantWithCssClass(StyleClasses.READER_DECORATIVE_BAR);
        });
    });

    it('has labels that understand Pango markup', function () {
        let card = new ReaderDocumentCard.ReaderDocumentCard({
            model: new ArticleObjectModel.ArticleObjectModel({
                title: '!!!',
                authors: ['@@@'],
            }),
        });
        expect(Gtk.test_find_label(card, '*!!!*').use_markup).toBeTruthy();
        expect(Gtk.test_find_label(card, '*@@@*').use_markup).toBeTruthy();
    });
});
