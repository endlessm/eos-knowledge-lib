/* global private_imports */

imports.gi.versions.WebKit2 = '4.0';

const Endless = imports.gi.Endless;
const Lang = imports.lang;

let EosKnowledge;

// Create a separate private importer so that client code can't import our
// private modules by mistake.
window.private_imports = imports['.'];
private_imports.searchPath.unshift(Endless.getCurrentFileDir());

const ArticleCard = private_imports.articleCard;
const ArticleHTMLRenderer = private_imports.articleHTMLRenderer;
const ArticlePage = private_imports.articlePage;
const ArticlePresenter = private_imports.articlePresenter;
const Card = private_imports.card;
const CardA = private_imports.cardA;
const CardB = private_imports.cardB;
const CategoriesPage = private_imports.categoriesPage;
const EknWebview = private_imports.eknWebview;
const HomePage = private_imports.homePage;
const HomePageA = private_imports.homePageA;
const HomePageB = private_imports.homePageB;
const Launcher = private_imports.launcher;
const LessonCard = private_imports.lessonCard;
const Lightbox = private_imports.lightbox;
const LightboxPresenter = private_imports.lightboxPresenter;
const ListCard = private_imports.listCard;
const MediaInfobox = private_imports.mediaInfobox;
const NavButtonOverlay = private_imports.navButtonOverlay;
const NoSearchResultsPage = private_imports.noSearchResultsPage;
const PdfCard = private_imports.pdfCard;
const PDFView = private_imports.PDFView;
const Presenter = private_imports.presenter;
const PresenterLoader = private_imports.presenterLoader;
const Previewer = private_imports.previewer;
const ProgressCard = private_imports.progressCard;
const SectionArticlePage = private_imports.sectionArticlePage;
const SectionPage = private_imports.sectionPage;
const SectionPageA = private_imports.sectionPageA;
const SectionPageB = private_imports.sectionPageB;
const SpaceContainer = private_imports.spaceContainer;
const TableOfContents = private_imports.tableOfContents;
const TextCard = private_imports.textCard;
const WebkitURIHandlers = private_imports.webkitURIHandlers;
const Window = private_imports.window;

const ReaderArticlePage = private_imports.reader.articlePage;
const ReaderCard = private_imports.reader.card;
const ReaderDonePage = private_imports.reader.donePage;
const ReaderOverviewPage = private_imports.reader.overviewPage;
const ReaderPresenter = private_imports.reader.presenter;
const ReaderProgressLabel = private_imports.reader.progressLabel;
const ReaderSearchResultsPage = private_imports.reader.searchResultsPage;
const ReaderStandalonePage = private_imports.reader.standalonePage;
const ReaderTitleView = private_imports.reader.titleView;
const ReaderUserSettingsModel = private_imports.reader.userSettingsModel;
const ReaderWebviewTooltip = private_imports.reader.webviewTooltip;
const ReaderWindow = private_imports.reader.window;

delete window.private_imports;

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
    EosKnowledge.LightboxPresenter = LightboxPresenter.LightboxPresenter;
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
        ArticleSnippet: ReaderOverviewPage.ArticleSnippet,
        Card: ReaderCard.Card,
        DonePage: ReaderDonePage.DonePage,
        OverviewPage: ReaderOverviewPage.OverviewPage,
        Presenter: ReaderPresenter.Presenter,
        ProgressLabel: ReaderProgressLabel.ProgressLabel,
        SearchResultsPage: ReaderSearchResultsPage.SearchResultsPage,
        StandalonePage: ReaderStandalonePage.StandalonePage,
        TitleView: ReaderTitleView.TitleView,
        UserSettingsModel: ReaderUserSettingsModel.UserSettingsModel,
        WebviewTooltip: ReaderWebviewTooltip.WebviewTooltip,
        Window: ReaderWindow.Window,
    };
}
