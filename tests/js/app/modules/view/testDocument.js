const {DModel, EvinceDocument, Gio, GObject, Gtk, WebKit2} = imports.gi;

const Utils = imports.tests.utils;
Utils.register_gresource();

const {Document} = imports.app.modules.view.document;
const Knowledge = imports.app.knowledge;
const CssClassMatcher = imports.tests.CssClassMatcher;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;
const Minimal = imports.tests.minimal;
const MockWidgets = imports.tests.mockWidgets;
const TableOfContents = imports.app.widgets.tableOfContents;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);
EvinceDocument.init();

const TEST_CONTENT_DIR = Utils.get_test_content_srcdir();

const MockEknWebviewDecision = new Knowledge.Class({
    Name: 'MockEknWebviewDecision',
    Extends: GObject.Object,
    Properties: {
        'uri': GObject.ParamSpec.string('uri', '', '',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            ''),
    },
    _init: function (props={}) {
        this.parent(props);
        this.request = { uri: this.uri };
    },
    use: function () {
    },
    ignore: function () {
    },
});

describe('View.Document', function () {
    let view, model, real_session_descriptor, toc;

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

        toc =
            [{"hasIndex": 0, "hasIndexLabel": "1", "hasLabel": "Foo", "hasContent": "#Foo"},
             {"hasIndex": 1, "hasIndexLabel": "2", "hasLabel": "Bar", "hasContent": "#Bar"},
             {"hasIndex": 2, "hasIndexLabel": "3", "hasLabel": "Baz", "hasContent": "#Baz"}];

        model = DModel.Article.new_from_props({
            title: '!!!',
            table_of_contents: toc,
        });
        view = new Document({
            model: model,
            show_toc: true,
        });
    });

    afterEach(function () {
        Object.defineProperty(Gio.DBus, 'session', real_session_descriptor);
    });

    it('instantiates a table of contents widget', function () {
        expect(view.toc).toBeA(TableOfContents.TableOfContents);
    });

    it('has labels that understand Pango markup', function () {
        expect(Gtk.test_find_label(view, '*!!!*').use_markup).toBeTruthy();
        // FIXME: the above line will find either title_label or top_title_label
        // but not both
    });

    describe('Style class of document view', function () {
        it('has a descendant with title class', function () {
            expect(view).toHaveDescendantWithCssClass('ViewDocument__title');
        });
        it('has a descendant with toolbar frame class', function () {
            expect(view).toHaveDescendantWithCssClass('ViewDocument__toolbarFrame');
        });
        it('has an expanded table of contents by default', function () {
            expect(view.toc).not.toHaveCssClass('ViewDocument__toolbarFrame--collapsed');
        });
    });

    describe('with pdf model', function () {
        let pdf_model;
        beforeEach(function (done) {
            pdf_model = DModel.Article.new_from_props({
                content_type: 'application/pdf',
                title: 'Pdf title',
                table_of_contents: toc,
            });
            pdf_model.get_content_stream = () => {
                let file = Gio.File.new_for_path(TEST_CONTENT_DIR + 'pdf-sample1.pdf');
                return file.read(null);
            };

            view = new Document({
                model: pdf_model,
            });
            view.load_content_promise().then(done);
        });

        it('can be loaded', function () {});

        it('never show a table of contents', function () {
            expect(view.toc.visible).toBe(false);
        });
    });

    describe('with html model', function () {
        let html_model;
        beforeEach(function (done) {
            html_model = DModel.Article.new_from_props({
                id: 'ekn:///foo/bar',
                content_type: 'text/html',
                title: 'Html title',
                table_of_contents: toc,
            });
            view = new Document({
                model: html_model,
                show_toc: true,
            });
            spyOn(view, '_create_webview').and.returnValue(new MockWidgets.MockEknWebview());
            view.load_content_promise().then(done);
            view.content_view.emit('load-changed', WebKit2.LoadEvent.COMMITTED);
        });

        it('can be loaded', function () {});

        describe('table of contents', function () {
            let win;
            const TOP_BOTTOM_BAR_HEIGHT = 36 + 30;
            beforeEach(function () {
                win = new Gtk.OffscreenWindow();
                win.add(view);
            });

            it('section list is populated', function () {
                let labels = [];
                for (let obj of toc) {
                    if (!('hasParent' in obj)) {
                        labels.push(obj['hasLabel']);
                    }
                }
            });

            it('collapses toc at SVGA', function () {
                win.set_size_request(800, 600 - TOP_BOTTOM_BAR_HEIGHT);
                win.show_all();
                Utils.update_gui();
                expect(view.toc.collapsed).toBe(true);
            });

            it('does not collapse toc at XGA', function () {
                win.set_size_request(1024, 768 - TOP_BOTTOM_BAR_HEIGHT);
                win.show_all();
                Utils.update_gui();
                expect(view.toc.collapsed).toBe(false);
            });

            it('collapses in composite mode', function () {
                spyOn(imports.app.utils, 'get_text_scaling_factor').and.returnValue(2.2);
                win.set_size_request(1600, 1200 - TOP_BOTTOM_BAR_HEIGHT);
                win.show_all();
                Utils.update_gui();
                expect(view.toc.collapsed).toBe(true);
            });

            it('scrolls to the right section', function () {
                let decision = new MockEknWebviewDecision({ uri: 'ekn:///foo/bar/#Baz'});
                expect(view.toc.target_section).toBe(0);
                view.content_view.emit('decide-policy', decision, WebKit2.PolicyDecisionType.NAVIGATION_ACTION);
                Utils.update_gui();
                expect(view.toc.target_section).toBe(2);
            });
        });

        it('adds custom CSS if requested', function (done) {
            view = new Document({
                model: html_model,
                custom_css: 'some_custom.css',
            });
            spyOn(view, '_create_webview').and.callFake(() => {
                let webview = new MockWidgets.MockEknWebview();
                spyOn(webview.renderer, 'set_custom_css_files');
                return webview;
            });
            view.load_content_promise()
            .then(() => {
                expect(view.content_view.renderer.set_custom_css_files)
                    .toHaveBeenCalledWith(jasmine.arrayContaining(['some_custom.css']));
                done();
            });
            view.content_view.emit('load-changed', WebKit2.LoadEvent.COMMITTED);
            view.content_view.emit('load-changed', WebKit2.LoadEvent.FINISHED);
        });
    });
});
