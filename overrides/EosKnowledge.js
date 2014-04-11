const Gio = imports.gi.Gio;
const Lang = imports.lang;
const Endless = imports.gi.Endless;

let EosKnowledge;

let _oldSearchPath = imports.searchPath;
imports.searchPath.unshift(Endless.getCurrentFileDir());

const ArticleCard = imports.articleCard;
const Card = imports.card;
const LessonCard = imports.lessonCard;
const ListCard = imports.listCard;

imports.searchPath = _oldSearchPath;

function _init() {
    // "this" is imports.gi.EosKnowledge
    EosKnowledge = this;

    // Hackzors. We need to load the gresource from javascript before any C
    // calls are made (to load the CSS). By referencing one of our C functions
    // here we force the C lib to be initialized along with it its gresource
    this.hello_c;

    let modulesToImport = [ArticleCard, Card, LessonCard, ListCard];
    modulesToImport.forEach(function (module) {
        // Inject the EosKnowledge module into the module being imported, to
        // avoid recursive imports
        module._EosKnowledge = EosKnowledge;
        // Copy the module's public properties into the EosKnowledge module --
        // remember to make all toplevel non-public symbols private with _
        Lang.copyPublicProperties(module, EosKnowledge);
    });
}
