const _Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;

let _oldSearchPath = imports.searchPath;
imports.searchPath.unshift(_Endless.getCurrentFileDir());

EosKnowledge.ArticleCard = imports.articleCard.ArticleCard;
EosKnowledge.ArticleObjectModel = imports.articleObjectModel.ArticleObjectModel;
EosKnowledge.ArticlePageA = imports.articlePageA.ArticlePageA;
EosKnowledge.Card = imports.card.Card;
EosKnowledge.ContentObjectModel = imports.contentObjectModel.ContentObjectModel;
EosKnowledge.Engine = imports.engine.Engine;
EosKnowledge.HomePageA = imports.homePageA.HomePageA;
EosKnowledge.LessonCard = imports.lessonCard.LessonCard;
EosKnowledge.Lightbox = imports.lightbox.Lightbox;
EosKnowledge.ListCard = imports.listCard.ListCard;
EosKnowledge.ProgressCard = imports.progressCard.ProgressCard;
EosKnowledge.SectionArticlePageA = imports.sectionArticlePageA.SectionArticlePageA;
EosKnowledge.SectionPageA = imports.sectionPageA.SectionPageA;
EosKnowledge.TableOfContents = imports.tableOfContents.TableOfContents;
EosKnowledge.tree_model_from_tree_node = imports.treeNode.tree_model_from_tree_node;
EosKnowledge.WebviewSwitcherView = imports.webviewSwitcherView.WebviewSwitcherView;
EosKnowledge.WindowA = imports.windowA.WindowA;

// Hackzors. We need to load the gresource from javascript before any C
// calls are made (to load the CSS). By referencing one of our C functions
// here we force the C lib to be initialized along with it its gresource
EosKnowledge.hello_c;

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

imports.searchPath = _oldSearchPath;
