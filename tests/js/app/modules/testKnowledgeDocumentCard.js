// Copyright (C) 2016 Endless Mobile, Inc.

const EvinceDocument = imports.gi.EvinceDocument;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const WebKit2 = imports.gi.WebKit2;

const Utils = imports.tests.utils;
Utils.register_gresource();

const ArticleObjectModel = imports.search.articleObjectModel;
const KnowledgeDocumentCard = imports.app.modules.knowledgeDocumentCard;
const CssClassMatcher = imports.tests.CssClassMatcher;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;
const Minimal = imports.tests.minimal;
const MockWidgets = imports.tests.mockWidgets;
const StyleClasses = imports.app.styleClasses;
const TableOfContents = imports.app.widgets.tableOfContents;
const TreeNode = imports.search.treeNode;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);
EvinceDocument.init();

const TEST_CONTENT_DIR = Utils.get_test_content_srcdir();

describe('Knowledge Document Card', function () {
    let card, model, real_session_descriptor, toc_json, toc;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);
        // Mock out the entire session bus or we will error in an environment
        // without a session bus. Because session is a property with only a
        // getter, it can't be mocked with regular spyOn methods yet. See bug
        // https://github.com/jasmine/jasmine/issues/943
        real_session_descriptor = Object.getOwnPropertyDescriptor(Gio.DBus, 'session');
        let mock_session = jasmine.createSpyObj('session', ['signal_subscribe']);
        Object.defineProperty(Gio.DBus, 'session', {
            value: mock_session,
            configurable: true,
        });

        toc_json = { "tableOfContents":
            [{"hasIndex": 0, "hasIndexLabel": 1, "hasLabel": "Foo", "hasContent": "#Foo"},
             {"hasIndex": 1, "hasIndexLabel": 2, "hasLabel": "Bar", "hasContent": "#Bar"},
             {"hasIndex": 2, "hasIndexLabel": 3, "hasLabel": "Baz", "hasContent": "#Baz"}]};
        toc = TreeNode.tree_model_from_tree_node(toc_json);

        model = new ArticleObjectModel.ArticleObjectModel({
            ekn_id: 'ekn:///foo/bar',
            title: '!!!',
        });
        card = new KnowledgeDocumentCard.KnowledgeDocumentCard({
            model: model,
            show_toc: true,
        });
    });

    afterEach(function () {
        Object.defineProperty(Gio.DBus, 'session', real_session_descriptor);
    });

    it('can be constructed', function () {
        expect(card).toBeDefined();
    });

    it('instantiates a table of contents widget', function () {
        expect(card.toc).toBeA(TableOfContents.TableOfContents);
    });

    it('has labels that understand Pango markup', function () {
        expect(Gtk.test_find_label(card, '*!!!*').use_markup).toBeTruthy();
        // FIXME: the above line will find either title_label or top_title_label
        // but not both
    });

    describe('Style class of document card', function () {
        it('has article card class', function () {
            expect(card).toHaveCssClass(StyleClasses.CARD);
        });
        it('has a descendant with title class', function () {
            expect(card).toHaveDescendantWithCssClass(StyleClasses.CARD_TITLE);
        });
        it('has a descendant with toolbar frame class', function () {
            expect(card).toHaveDescendantWithCssClass(StyleClasses.DOCUMENT_CARD_TOOLBAR_FRAME);
        });
        it('has an expanded table of contents by default', function () {
            expect(card.toc).not.toHaveCssClass(StyleClasses.COLLAPSED);
        });
    });

    describe('with pdf model', function () {
        let pdf_model;
        beforeEach(function (done) {
            pdf_model = new ArticleObjectModel.ArticleObjectModel({
                ekn_id: 'ekn:///foo/bar',
                content_type: 'application/pdf',
                get_content_stream: () => {
                    let file = Gio.File.new_for_path(TEST_CONTENT_DIR + 'pdf-sample1.pdf');
                    return file.read(null);
                },
                title: 'Pdf title',
                table_of_contents: toc,
            });

            card = new KnowledgeDocumentCard.KnowledgeDocumentCard({
                model: pdf_model,
            });
            card.load_content(null, (card, task) => {
                expect(() => card.load_content_finish(task)).not.toThrow();
                done();
            });
        });

        it('can be loaded', function () {});

        it('never show a table of contents', function () {
            expect(card.toc.visible).toBe(false);
        });
    });

    describe('with html model', function () {
        let html_model, previous_card, next_card;
        beforeEach(function (done) {
            html_model = new ArticleObjectModel.ArticleObjectModel({
                ekn_id: 'ekn:///foo/bar',
                content_type: 'text/html',
                title: 'Html title',
                table_of_contents: toc,
            });
            previous_card = new Minimal.MinimalCard();
            next_card = new Minimal.MinimalCard();
            card = new KnowledgeDocumentCard.KnowledgeDocumentCard({
                model: html_model,
                show_toc: true,
                previous_card: previous_card,
                next_card: next_card,
            });
            spyOn(card, '_create_webview').and.returnValue(new MockWidgets.MockEknWebview());
            card.load_content(null, (card, task) => {
                card.load_content_finish(task);
                done();
            });
            card.content_view.emit('load-changed', WebKit2.LoadEvent.COMMITTED);
        });

        it('can be loaded', function () {});

        it('adds a previous/next card when set', function () {
            expect(card).toHaveDescendant(previous_card);
            expect(card).toHaveDescendant(next_card);
        });

        describe('table of contents', function () {
            let win;
            const TOP_BOTTOM_BAR_HEIGHT = 36 + 30;
            beforeEach(function () {
                win = new Gtk.OffscreenWindow();
                win.add(card);
            });

            it('section list is populated', function () {
                let labels = [];
                for (let obj of toc_json['tableOfContents']) {
                    if (!('hasParent' in obj)) {
                        labels.push(obj['hasLabel']);
                    }
                }
                expect(card.toc.section_list).toEqual(labels);
            });

            it('collapses toc at SVGA', function () {
                win.set_size_request(800, 600 - TOP_BOTTOM_BAR_HEIGHT);
                win.show_all();
                Utils.update_gui();
                expect(card.toc.collapsed).toBe(true);
            });

            it('does not collapse toc at XGA', function () {
                win.set_size_request(1024, 768 - TOP_BOTTOM_BAR_HEIGHT);
                win.show_all();
                Utils.update_gui();
                expect(card.toc.collapsed).toBe(false);
            });

            it('collapses in composite mode', function () {
                spyOn(imports.app.utils, 'get_text_scaling_factor').and.returnValue(2.2);
                win.set_size_request(1600, 1200 - TOP_BOTTOM_BAR_HEIGHT);
                win.show_all();
                Utils.update_gui();
                expect(card.toc.collapsed).toBe(true);
            });
        });

        it('adds custom CSS if requested', function (done) {
            card = new KnowledgeDocumentCard.KnowledgeDocumentCard({
                model: html_model,
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
    });
});
