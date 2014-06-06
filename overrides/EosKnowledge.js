const ClutterGst = imports.gi.ClutterGst;
const Endless = imports.gi.Endless;
const GtkClutter = imports.gi.GtkClutter;
const Lang = imports.lang;

let EosKnowledge;

let _oldSearchPath = imports.searchPath;
imports.searchPath.unshift(Endless.getCurrentFileDir());

const ArticleCard = imports.articleCard;
const ArticleObjectModel = imports.articleObjectModel;
const ArticlePageA = imports.articlePageA;
const ArticlePresenter = imports.articlePresenter;
const Card = imports.card;
const CategoriesPage = imports.categoriesPage;
const ContentObjectModel = imports.contentObjectModel;
const Engine = imports.engine;
const HomePage = imports.homePage;
const HomePageA = imports.homePageA;
const HomePageB = imports.homePageB;
const KnowledgeApp = imports.knowledgeApp;
const LessonCard = imports.lessonCard;
const Lightbox = imports.lightbox;
const ListCard = imports.listCard;
const MediaObjectModel = imports.mediaObjectModel;
const Presenter = imports.presenter;
const Previewer = imports.previewer;
const ProgressCard = imports.progressCard;
const SectionArticlePageA = imports.sectionArticlePageA;
const SectionPageA = imports.sectionPageA;
const TableOfContents = imports.tableOfContents;
const TreeNode = imports.treeNode;
const WebviewSwitcherView = imports.webviewSwitcherView;
const WindowA = imports.windowA;

imports.searchPath = _oldSearchPath;

function _init() {
    // "this" is imports.gi.EosKnowledge
    EosKnowledge = this;

    // Hackzors. We need to load the gresource from javascript before any C
    // calls are made (to load the CSS). By referencing one of our C functions
    // here we force the C lib to be initialized along with it its gresource
    this.hello_c;

    // More hackzors. Work around bug where GList-type properties aren't
    // converted properly into JS values.
    // https://bugzilla.gnome.org/show_bug.cgi?id=727787
    Object.defineProperties(EosKnowledge.HistoryModel.prototype, {
        'back-list': {
            get: EosKnowledge.HistoryModel.prototype.get_back_list
        },
        'forward-list': {
            get: EosKnowledge.HistoryModel.prototype.get_forward_list
        },
        // Once again with underscores, because that's the most used name to
        // access properties with
        'back_list': {
            get: EosKnowledge.HistoryModel.prototype.get_back_list
        },
        'forward_list': {
            get: EosKnowledge.HistoryModel.prototype.get_forward_list
        },
        // Once again in camelCaps, because GJS supports that notation too for
        // properties
        'backList': {
            get: EosKnowledge.HistoryModel.prototype.get_back_list
        },
        'forwardList': {
            get: EosKnowledge.HistoryModel.prototype.get_forward_list
        }
    });

    /**
     * Method: init
     *
     * Call this function before calling into any other EosKnowledge function.
     * It will initialize all the libraries EosKnowlege depends on.
     */
    EosKnowledge.init = function () {
        GtkClutter.init(null);
        ClutterGst.init(null);
    };

    EosKnowledge.ArticleCard = ArticleCard.ArticleCard;
    EosKnowledge.ArticleObjectModel = ArticleObjectModel.ArticleObjectModel;
    EosKnowledge.ArticlePageA = ArticlePageA.ArticlePageA;
    EosKnowledge.ArticlePresenter = ArticlePresenter.ArticlePresenter;
    EosKnowledge.Card = Card.Card;
    EosKnowledge.CategoriesPage = CategoriesPage.CategoriesPage;
    EosKnowledge.ContentObjectModel = ContentObjectModel.ContentObjectModel;
    EosKnowledge.Engine = Engine.Engine;
    EosKnowledge.HomePage = HomePage.HomePage;
    EosKnowledge.HomePageA = HomePageA.HomePageA;
    EosKnowledge.ImageObjectModel = MediaObjectModel.ImageObjectModel;
    EosKnowledge.HomePageB = HomePageB.HomePageB;
    EosKnowledge.KnowledgeApp = KnowledgeApp.KnowledgeApp;
    EosKnowledge.LessonCard = LessonCard.LessonCard;
    EosKnowledge.Lightbox = Lightbox.Lightbox;
    EosKnowledge.ListCard = ListCard.ListCard;
    EosKnowledge.MediaObjectModel = MediaObjectModel.MediaObjectModel;
    EosKnowledge.Presenter = Presenter.Presenter;
    EosKnowledge.Previewer = Previewer.Previewer;
    EosKnowledge.ProgressCard = ProgressCard.ProgressCard;
    EosKnowledge.SectionArticlePageA = SectionArticlePageA.SectionArticlePageA;
    EosKnowledge.SectionPageA = SectionPageA.SectionPageA;
    EosKnowledge.TableOfContents = TableOfContents.TableOfContents;
    EosKnowledge.tree_model_from_tree_node = TreeNode.tree_model_from_tree_node;
    EosKnowledge.VideoObjectModel = MediaObjectModel.VideoObjectModel;
    EosKnowledge.WebviewSwitcherView = WebviewSwitcherView.WebviewSwitcherView;
    EosKnowledge.WindowA = WindowA.WindowA;
}
