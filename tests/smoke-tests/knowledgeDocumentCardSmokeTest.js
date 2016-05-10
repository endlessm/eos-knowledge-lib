const Endless = imports.gi.Endless;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Utils = imports.tests.utils;
Utils.register_gresource();

const ArticleObjectModel = imports.search.articleObjectModel;
const KnowledgeDocumentCard = imports.app.modules.knowledgeDocumentCard;
const MediaObjectModel = imports.search.mediaObjectModel;
const SequenceCard = imports.app.modules.sequenceCard;

const TEST_APPLICATION_ID = 'com.endlessm.knowledge.test.document-card';

let srcdir = Utils.get_test_content_srcdir();
let json_ld = Utils.parse_object_from_path(srcdir + 'mexico.jsonld');
let article_model = new ArticleObjectModel.ArticleObjectModel({
    get_content_stream: () => {
        let file = Gio.File.new_for_path(Utils.get_test_content_srcdir() + 'mexico.html');
        return file.read(null);
    },
}, json_ld);
let media_model = new MediaObjectModel.MediaObjectModel({
    get_content_stream: () => {
        let file = Gio.File.new_for_path(Utils.get_test_content_srcdir() + 'joffrey.jpg');
        return file.read(null);
    },
});
let previous_model = new ArticleObjectModel.ArticleObjectModel({
    title: 'Guatemala',
});
let next_model = new ArticleObjectModel.ArticleObjectModel({
    title: 'Canada',
});

let mock_engine = {
    get_object_by_id: function (id, cancellable, callback) {
        callback(this, id);
    },

    get_object_by_id_finish: function (id) {
        if (id === article_model.ekn_id)
            return article_model;
        return media_model;
    },
};
imports.search.engine.get_default = () => mock_engine;

const TestApplication = new Lang.Class({
    Name: 'TestApplication',
    Extends: Endless.Application,

    vfunc_startup: function () {
        this.parent();

        let provider = new Gtk.CssProvider();
        let css_file = Gio.File.new_for_uri('resource:///com/endlessm/knowledge/data/css/buffet.css');
        provider.load_from_file(css_file);
        Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
                                                 provider,
                                                 Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

        let previous_card = new SequenceCard.SequenceCard({
            model: previous_model,
            sequence: SequenceCard.Sequence.PREVIOUS,
        });
        let next_card = new SequenceCard.SequenceCard({
            model: next_model,
            sequence: SequenceCard.Sequence.NEXT,
        });
        let card = new KnowledgeDocumentCard.KnowledgeDocumentCard({
            model: article_model,
            previous_card: previous_card,
            next_card: next_card,
            show_toc: true,
        });
        card.load_content(null, (card, task) => {
            card.load_content_finish(task);
        });

        let window = new Endless.Window({
            application: this
        });
        window.get_page_manager().add(card);
        window.show_all();
    }
});

let app = new TestApplication({
    application_id: TEST_APPLICATION_ID,
    flags: 0
});
app.run(ARGV);
