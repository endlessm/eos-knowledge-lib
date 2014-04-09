const Gio = imports.gi.Gio;
const Lang = imports.lang;
const Endless = imports.gi.Endless;

let EosKnowledge;

let _oldSearchPath = imports.searchPath;
imports.searchPath.unshift(Endless.getCurrentFileDir());

const Card = imports.card;
const LessonCard = imports.lesson_card;

imports.searchPath = _oldSearchPath;

function _init() {
    // "this" is imports.gi.EosKnowledge
    EosKnowledge = this;

    // Hackzors. We need to load the gresource from javascript before any C
    // calls are made (to load the CSS). By referencing one of our C functions
    // here we force the C lib to be initialized along with it its gresource
    this.hello_c;

    Card._EosKnowledge = EosKnowledge;
    LessonCard._EosKnowledge = EosKnowledge;

    Lang.copyPublicProperties(Card, EosKnowledge);
    Lang.copyPublicProperties(LessonCard, EosKnowledge);
}
