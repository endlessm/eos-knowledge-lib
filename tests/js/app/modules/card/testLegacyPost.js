const Eknc = imports.gi.EosKnowledgeContent;
const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Compliance = imports.tests.compliance;
const LegacyPost = imports.app.modules.card.legacyPost;

Gtk.init(null);

describe('Card.LegacyPost', function () {
    it('has labels that understand Pango markup', function () {
        let card = new LegacyPost.LegacyPost({
            model: Eknc.ContentObjectModel.new_from_props({
                title: '!!!',
            }),
        });
        expect(Gtk.test_find_label(card, '*!!!*').use_markup).toBeTruthy();
    });
});

Compliance.test_card_compliance(LegacyPost.LegacyPost);
