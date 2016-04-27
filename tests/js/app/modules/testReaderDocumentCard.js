// Copyright (C) 2016 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;
const WebKit2 = imports.gi.WebKit2;

const Utils = imports.tests.utils;
Utils.register_gresource();

const ArticleObjectModel = imports.search.articleObjectModel;
const CssClassMatcher = imports.tests.CssClassMatcher;
const MockWidgets = imports.tests.mockWidgets;
const ReaderDocumentCard = imports.app.modules.readerDocumentCard;
const StyleClasses = imports.app.styleClasses;

Gtk.init(null);

describe('Reader Document Card', function () {
    let card, article_object;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        article_object = new ArticleObjectModel.ArticleObjectModel({
            ekn_id: 'ekn://astronomy-en/foo',
            content_type: 'text/html',
            title: 'Reader article',
        });
        card = new ReaderDocumentCard.ReaderDocumentCard({
            model: article_object,
        });
        spyOn(card, '_create_webview').and.callFake(() => {
            let webview = new MockWidgets.MockEknWebview();
            spyOn(webview.renderer, 'set_custom_css_files');
            return webview;
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
        card.content_view.emit('load-changed', WebKit2.LoadEvent.FINISHED);
    });

    it('emits content error signal after loading bad content', function (done) {
        card.load_content(null, (card, task) => {
            expect(function () {
                card.load_content_finish(task);
            }).toThrow();
            done();
        });
        card.content_view.emit('load-failed', WebKit2.LoadEvent.COMMITTED, 'ekn://astronomy-en/foo');
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

    it('adds custom reader CSS if no other CSS requested', function (done) {
        card.load_content(null, (card, task) => {
            card.load_content_finish(task);
            expect(card.content_view.renderer.set_custom_css_files)
                .toHaveBeenCalledWith(jasmine.arrayContaining(['reader.css']));
            done();
        });
        card.content_view.emit('load-changed', WebKit2.LoadEvent.COMMITTED);
        card.content_view.emit('load-changed', WebKit2.LoadEvent.FINISHED);
    });

    it('adds custom CSS if requested', function (done) {
        card = new ReaderDocumentCard.ReaderDocumentCard({
            model: article_object,
            custom_css: 'some_custom.css',
        });
        spyOn(card, '_create_webview').and.callFake(() => {
            let webview = new MockWidgets.MockEknWebview();
            spyOn(webview.renderer, 'set_custom_css_files');
            return webview;
        });
        card.load_content(null, (card, task) => {
            card.load_content_finish(task);
            expect(card.content_view.renderer.set_custom_css_files)
                .toHaveBeenCalledWith(jasmine.arrayContaining(['some_custom.css']));
            done();
        });
        card.content_view.emit('load-changed', WebKit2.LoadEvent.COMMITTED);
        card.content_view.emit('load-changed', WebKit2.LoadEvent.FINISHED);
    });

    it('displays page number in UI', function () {
        card.page_number = 1234;
        expect(Gtk.test_find_label(card, '*1234*')).not.toBeNull();
    });

    it('displays total pages in UI', function () {
        card.total_pages = 4321;
        expect(Gtk.test_find_label(card, '*4321*')).not.toBeNull();
    });
});
