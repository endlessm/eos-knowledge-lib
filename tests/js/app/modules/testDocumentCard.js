const EvinceDocument = imports.gi.EvinceDocument;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const ArticleObjectModel = imports.search.articleObjectModel;
const DocumentCard = imports.app.modules.documentCard;
const CssClassMatcher = imports.tests.CssClassMatcher;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;
const StyleClasses = imports.app.styleClasses;
const TableOfContents = imports.app.tableOfContents;
const TreeNode = imports.search.treeNode;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);
EvinceDocument.init();

const TEST_CONTENT_DIR = Utils.get_test_content_srcdir();

describe('Document Card', function () {
    let card
    let articleObject;

    let toc_json = { "tableOfContents":
    [{"hasIndex": 0, "hasIndexLabel": 1, "hasLabel": "Foo", "hasContent": "#Foo"},
     {"hasIndex": 1, "hasIndexLabel": 2, "hasLabel": "Bar", "hasContent": "#Bar"},
     {"hasIndex": 2, "hasIndexLabel": 3, "hasLabel": "Baz", "hasContent": "#Baz"}]};

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

        let toc = TreeNode.tree_model_from_tree_node(toc_json);
        articleObject = new ArticleObjectModel.ArticleObjectModel({
            ekn_id: 'ekn:///foo/bar',
            content_type: 'application/pdf',
            get_content_stream: () => {  
                let file = Gio.File.new_for_path(TEST_CONTENT_DIR + 'pdf-sample1.pdf');
                return file.read(null);
            },
            title: 'Wikihow & title',
            table_of_contents: toc,
        });
        card = new DocumentCard.DocumentCard({
            model: articleObject,
        });
    });

    it('can be constructed', function () {
        expect(card).toBeDefined();
    });

    it('instantiates a table of contents widget', function () {
        expect(card.toc).toBeA(TableOfContents.TableOfContents);
    });

    it('calls content ready after initialization', function () {
        let dummy = {
            ready: function () {},
        };
        spyOn(dummy, 'ready');
        let docCard = new DocumentCard.DocumentCard({
            model: articleObject,
            content_ready_callback: dummy.ready,
        });
        expect(dummy.ready).toHaveBeenCalled();
    });

    it('can set toc section list', function () {
        let labels = [];
        for (let obj of toc_json['tableOfContents']) {
            if (!('hasParent' in obj)) {
                labels.push(obj['hasLabel']);
            }
        }
        expect(card.toc.section_list).toEqual(labels);
    });

    describe('Style class of article card A', function () {
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
});
