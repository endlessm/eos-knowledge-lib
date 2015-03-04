const ClutterGst = imports.gi.ClutterGst;
const Endless = imports.gi.Endless;
const GtkClutter = imports.gi.GtkClutter;
const Lang = imports.lang;

let EosKnowledge;

// Make a backup copy of the array
let _oldSearchPath = imports.searchPath.slice(0);
imports.searchPath.unshift(Endless.getCurrentFileDir());

const ArticleCard = imports.articleCard;
const ArticleHTMLRenderer = imports.articleHTMLRenderer;
const ArticlePage = imports.articlePage;
const ArticlePresenter = imports.articlePresenter;
const Card = imports.card;
const CardA = imports.cardA;
const CardB = imports.cardB;
const CategoriesPage = imports.categoriesPage;
const EknWebview = imports.eknWebview;
const HomePage = imports.homePage;
const HomePageA = imports.homePageA;
const HomePageB = imports.homePageB;
const Launcher = imports.launcher;
const LessonCard = imports.lessonCard;
const Lightbox = imports.lightbox;
const ListCard = imports.listCard;
const MediaInfobox = imports.mediaInfobox;
const NavButtonOverlay = imports.navButtonOverlay;
const NoSearchResultsPage = imports.noSearchResultsPage;
const PdfCard = imports.pdfCard;
const PDFView = imports.PDFView;
const Presenter = imports.presenter;
const PresenterLoader = imports.presenterLoader;
const Previewer = imports.previewer;
const ProgressCard = imports.progressCard;
const SectionArticlePage = imports.sectionArticlePage;
const SectionPage = imports.sectionPage;
const SectionPageA = imports.sectionPageA;
const SectionPageB = imports.sectionPageB;
const SpaceContainer = imports.spaceContainer;
const TableOfContents = imports.tableOfContents;
const TextCard = imports.textCard;
const TreeNode = imports.treeNode;
const WebkitURIHandlers = imports.webkitURIHandlers;
const Window = imports.window;

const ReaderArticlePage = imports.reader.articlePage;
const ReaderDonePage = imports.reader.donePage;
const ReaderOverviewPage = imports.reader.overviewPage;
const ReaderPresenter = imports.reader.presenter;
const ReaderProgressLabel = imports.reader.progressLabel;
const ReaderTitleView = imports.reader.titleView;
const ReaderUserSettingsModel = imports.reader.userSettingsModel;
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

    EosKnowledge.ArticleCard = ArticleCard.ArticleCard;
    EosKnowledge.ArticleHTMLRenderer = ArticleHTMLRenderer.ArticleHTMLRenderer;
    EosKnowledge.ArticlePage = ArticlePage.ArticlePage;
    EosKnowledge.ArticlePresenter = ArticlePresenter.ArticlePresenter;
    EosKnowledge.Card = Card.Card;
    EosKnowledge.CardA = CardA.CardA;
    EosKnowledge.CardB = CardB.CardB;
    EosKnowledge.CategoriesPage = CategoriesPage.CategoriesPage;
    EosKnowledge.EknWebview = EknWebview.EknWebview;
    EosKnowledge.get_presenter_for_resource = PresenterLoader.get_presenter_for_resource;
    EosKnowledge.HomePage = HomePage.HomePage;
    EosKnowledge.HomePageA = HomePageA.HomePageA;
    EosKnowledge.HomePageB = HomePageB.HomePageB;
    EosKnowledge.Launcher = Launcher.Launcher;
    EosKnowledge.LessonCard = LessonCard.LessonCard;
    EosKnowledge.Lightbox = Lightbox.Lightbox;
    EosKnowledge.ListCard = ListCard.ListCard;
    EosKnowledge.MediaInfobox = MediaInfobox.MediaInfobox;
    EosKnowledge.NavButtonOverlay = NavButtonOverlay.NavButtonOverlay;
    EosKnowledge.NoSearchResultsPage = NoSearchResultsPage.NoSearchResultsPage;
    EosKnowledge.NoSearchResultsPageA = NoSearchResultsPage.NoSearchResultsPageA;
    EosKnowledge.NoSearchResultsPageB = NoSearchResultsPage.NoSearchResultsPageB;
    EosKnowledge.PdfCard = PdfCard.PdfCard;
    EosKnowledge.PDFView = PDFView.PDFView;
    EosKnowledge.Presenter = Presenter.Presenter;
    EosKnowledge.Previewer = Previewer.Previewer;
    EosKnowledge.ProgressCard = ProgressCard.ProgressCard;
    EosKnowledge.SectionArticlePageA = SectionArticlePage.SectionArticlePageA;
    EosKnowledge.SectionArticlePageB = SectionArticlePage.SectionArticlePageB;
    EosKnowledge.SectionPage = SectionPage.SectionPage;
    EosKnowledge.SectionPageA = SectionPageA.SectionPageA;
    EosKnowledge.SectionPageB = SectionPageB.SectionPageB;
    EosKnowledge.SpaceContainer = SpaceContainer.SpaceContainer;
    EosKnowledge.TableOfContents = TableOfContents.TableOfContents;
    EosKnowledge.TextCard = TextCard.TextCard;
    EosKnowledge.register_webkit_uri_handlers = WebkitURIHandlers.register_webkit_uri_handlers;
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
        ArticlePage: ReaderArticlePage.ArticlePage,
        DonePage: ReaderDonePage.DonePage,
        OverviewPage: ReaderOverviewPage.OverviewPage,
        Presenter: ReaderPresenter.Presenter,
        ProgressLabel: ReaderProgressLabel.ProgressLabel,
        TitleView: ReaderTitleView.TitleView,
        UserSettingsModel: ReaderUserSettingsModel.UserSettingsModel,
        Window: ReaderWindow.Window,
    };
}
