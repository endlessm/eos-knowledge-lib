const ClutterGst = imports.gi.ClutterGst;
const Endless = imports.gi.Endless;
const GtkClutter = imports.gi.GtkClutter;
const Lang = imports.lang;

let EosKnowledge;

// Make a backup copy of the array
let _oldSearchPath = imports.searchPath.slice(0);
imports.searchPath.unshift(Endless.getCurrentFileDir());

const Application = imports.application;
const ArticleCard = imports.articleCard;
const ArticleObjectModel = imports.articleObjectModel;
const ArticlePage = imports.articlePage;
const ArticlePresenter = imports.articlePresenter;
const Card = imports.card;
const CardA = imports.cardA;
const CardB = imports.cardB;
const CategoriesPage = imports.categoriesPage;
const ContentObjectModel = imports.contentObjectModel;
const EknWebview = imports.eknWebview;
const Engine = imports.engine;
const HomePage = imports.homePage;
const HomePageA = imports.homePageA;
const HomePageB = imports.homePageB;
const KnowledgeApp = imports.knowledgeApp;
const LessonCard = imports.lessonCard;
const Lightbox = imports.lightbox;
const ListCard = imports.listCard;
const MediaInfobox = imports.mediaInfobox;
const MediaObjectModel = imports.mediaObjectModel;
const NavButtonOverlay = imports.navButtonOverlay;
const NoSearchResultsPage = imports.noSearchResultsPage;
const Presenter = imports.presenter;
const Previewer = imports.previewer;
const ProgressCard = imports.progressCard;
const SectionArticlePage = imports.sectionArticlePage;
const SectionPage = imports.sectionPage;
const SectionPageA = imports.sectionPageA;
const SectionPageB = imports.sectionPageB;
const TableOfContents = imports.tableOfContents;
const TextCard = imports.textCard;
const TreeNode = imports.treeNode;
const Window = imports.window;

const ReaderApplication = imports.reader.application;
const ReaderArticlePage = imports.reader.articlePage;
const ReaderDonePage = imports.reader.donePage;
const ReaderProgressLabel = imports.reader.progressLabel;
const ReaderWindow = imports.reader.window;

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

    EosKnowledge.Application = Application.Application;
    EosKnowledge.ArticleCard = ArticleCard.ArticleCard;
    EosKnowledge.ArticleObjectModel = ArticleObjectModel.ArticleObjectModel;
    EosKnowledge.ArticlePage = ArticlePage.ArticlePage;
    EosKnowledge.ArticlePresenter = ArticlePresenter.ArticlePresenter;
    EosKnowledge.Card = Card.Card;
    EosKnowledge.CardA = CardA.CardA;
    EosKnowledge.CardB = CardB.CardB;
    EosKnowledge.CategoriesPage = CategoriesPage.CategoriesPage;
    EosKnowledge.ContentObjectModel = ContentObjectModel.ContentObjectModel;
    EosKnowledge.EknWebview = EknWebview.EknWebview;
    EosKnowledge.Engine = Engine.Engine;
    EosKnowledge.HomePage = HomePage.HomePage;
    EosKnowledge.HomePageA = HomePageA.HomePageA;
    EosKnowledge.ImageObjectModel = MediaObjectModel.ImageObjectModel;
    EosKnowledge.HomePageB = HomePageB.HomePageB;
    EosKnowledge.KnowledgeApp = KnowledgeApp.KnowledgeApp;
    EosKnowledge.LessonCard = LessonCard.LessonCard;
    EosKnowledge.Lightbox = Lightbox.Lightbox;
    EosKnowledge.ListCard = ListCard.ListCard;
    EosKnowledge.MediaInfobox = MediaInfobox.MediaInfobox;
    EosKnowledge.MediaObjectModel = MediaObjectModel.MediaObjectModel;
    EosKnowledge.NavButtonOverlay = NavButtonOverlay.NavButtonOverlay;
    EosKnowledge.NoSearchResultsPage = NoSearchResultsPage.NoSearchResultsPage;
    EosKnowledge.NoSearchResultsPageA = NoSearchResultsPage.NoSearchResultsPageA;
    EosKnowledge.NoSearchResultsPageB = NoSearchResultsPage.NoSearchResultsPageB;
    EosKnowledge.Presenter = Presenter.Presenter;
    EosKnowledge.Previewer = Previewer.Previewer;
    EosKnowledge.ProgressCard = ProgressCard.ProgressCard;
    EosKnowledge.SectionArticlePageA = SectionArticlePage.SectionArticlePageA;
    EosKnowledge.SectionArticlePageB = SectionArticlePage.SectionArticlePageB;
    EosKnowledge.SectionPage = SectionPage.SectionPage;
    EosKnowledge.SectionPageA = SectionPageA.SectionPageA;
    EosKnowledge.SectionPageB = SectionPageB.SectionPageB;
    EosKnowledge.TableOfContents = TableOfContents.TableOfContents;
    EosKnowledge.TextCard = TextCard.TextCard;
    EosKnowledge.tree_model_from_tree_node = TreeNode.tree_model_from_tree_node;
    EosKnowledge.VideoObjectModel = MediaObjectModel.VideoObjectModel;
    EosKnowledge.Window = Window.Window;

    /**
     * Namespace: Reader
     * Separate namespace for the 'reader' app
     *
     * Stability:
     *   Unstable - this API is subject to change.
     *     (Applies to everything in this namespace.)
     */
    EosKnowledge.Reader = {
        Application: ReaderApplication.Application,
        ArticlePage: ReaderArticlePage.ArticlePage,
        DonePage: ReaderDonePage.DonePage,
        ProgressLabel: ReaderProgressLabel.ProgressLabel,
        Window: ReaderWindow.Window,
    };
}
