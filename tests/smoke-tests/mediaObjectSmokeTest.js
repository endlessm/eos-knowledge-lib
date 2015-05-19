const Endless = imports.gi.Endless;
const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const ArticleObjectModel = imports.search.articleObjectModel;
const ArticlePage = imports.app.articlePage;
const ArticlePresenter = imports.app.articlePresenter;
const Engine = imports.search.engine;
const Lightbox = imports.app.lightbox;
const MediaInfobox = imports.app.mediaInfobox;
const MediaObjectModel = imports.search.mediaObjectModel;
const Previewer = imports.app.previewer;
const Utils = imports.tests.utils;

const TEST_APPLICATION_ID = 'com.endlessm.knowledge.mediaobject';
const TESTDIR = Endless.getCurrentFileDir() + '/..';
const MOCK_ARTICLE_PATH = Endless.getCurrentFileDir() + '/../test-content/emacs.jsonld';
const MOCK_ARTICLE_RESOURCES_PATH = Endless.getCurrentFileDir() + '/../test-content/emacs-resources.jsonld';

const TestApplication = new Lang.Class ({
    Name: 'TestApplication',
    Extends: Endless.Application,

    vfunc_startup: function() {
        this.parent();

        Utils.register_gresource();
        let provider = new Gtk.CssProvider();
        let css_file = Gio.File.new_for_uri('resource:///com/endlessm/knowledge/endless_knowledge.css');
        provider.load_from_file(css_file);
        Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
                                                 provider,
                                                 Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

        let window = new Endless.Window({
            application: this
        });

        this._model = new ArticleObjectModel.ArticleObjectModel.new_from_json_ld(this._get_mock_article_data());
        this._model.ekn_id = 'file://' + TESTDIR + '/test-content/emacs.html';
        this._model.set_resources(this._get_mock_media_objects());

        this._view = new ArticlePage.ArticlePage();

        this._engine = new Engine.Engine();

        this._presenter = new ArticlePresenter.ArticlePresenter({
            article_view: this._view,
            engine: this._engine
        });
        this._presenter.load_article(this._model, EosKnowledgePrivate.LoadingAnimationType.NONE);
        this._presenter.connect('media-object-clicked', function (obj, media_object, is_resource) {
            let infobox = MediaInfobox.MediaInfobox.new_from_ekn_model(media_object);
            this._previewer.file = Gio.File.new_for_uri(media_object.content_uri);
            this._lightbox.infobox_widget = infobox;
            this._lightbox.media_object = media_object;
            this._lightbox.reveal_overlays = true;
        }.bind(this));

        this._previewer = new Previewer.Previewer({
            visible: true
        });

        this._lightbox = new Lightbox.Lightbox({
            content_widget: this._previewer
        });
        this._lightbox.add(this._view);

        this._lightbox.connect('navigation-previous-clicked', Lang.bind(this, function (lightbox, media_object) {
            let resources = this._model.get_resources();
            let current_index = this._get_position_in_resources(media_object.ekn_id, resources);
            if (current_index > 0) {
                let new_object = resources[current_index - 1];
                let infobox = MediaInfobox.MediaInfobox.new_from_ekn_model(new_object);
                this._previewer.file = Gio.File.new_for_uri(new_object.content_uri);
                this._lightbox.media_object = new_object;
                this._lightbox.infobox_widget = infobox;
                this._lightbox.reveal_overlays = true;
            }
        }));
        this._lightbox.connect('navigation-next-clicked', Lang.bind(this, function (lightbox, media_object) {
            let resources = this._model.get_resources();
            let current_index = this._get_position_in_resources(media_object.ekn_id, resources);
            if (current_index < resources.length - 1) {
                let new_object = resources[current_index + 1];
                let infobox = MediaInfobox.MediaInfobox.new_from_ekn_model(new_object);
                this._previewer.file = Gio.File.new_for_uri(new_object.content_uri);
                this._lightbox.media_object = new_object;
                this._lightbox.infobox_widget = infobox;
                this._lightbox.reveal_overlays = true;
            }
        }));

        window.get_page_manager().add(this._lightbox);
        window.show_all();
    },

    _get_mock_article_data: function () {
        let file = Gio.file_new_for_path(MOCK_ARTICLE_PATH);
        let [success, data] = file.load_contents(null);
        return JSON.parse(data);
    },

    _get_position_in_resources: function (article_model_id, resources) {
        let resource_ids = resources.map(function (model) {
            return model.ekn_id;
        });
        return resource_ids.indexOf(article_model_id);
    },

    _get_mock_media_objects: function () {
        let json = [
            {
                "@context": "http://127.0.0.1:3003/api/_context/ImageObject",
                "@type": "ekv:ImageObject",
                "@id": "http://127.0.0.1:3003/img/stallman_up",
                "contentURL": "file://" + TESTDIR + "/test-content/Richard_Stallman_at_Pittsburgh_University.jpg",
                "title": "Richard Stallman at Pittsburgh University,",
                "tags": ["bear", "beard"],
                "caption": "Richard Stallman at Pittsburgh University",
                "license": "GNU",
                "copyrightHolder": "the world",
                "encodingFormat": "jpg",
                "height": "666",
                "width": "666"
            },
            {
                "@context": "http://127.0.0.1:3003/api/_context/ImageObject",
                "@type": "ekv:ImageObject",
                "@id": "http://127.0.0.1:3003/img/emacs_colorsyntax",
                "contentURL": "file://" + TESTDIR + "/test-content/emacs-colorsyntax.png",
                "title": "Editing C source code in GNU Emacs",
                "tags": ["Editor", "emacs"],
                "caption": "Editing C source code in GNU Emacs",
                "encodingFormat": "png",
                "height": "666",
                "width": "666"
            },
            {
                "@context": "http://127.0.0.1:3003/api/_context/ImageObject",
                "@type": "ekv:ImageObject",
                "@id": "http://127.0.0.1:3003/img/emacs_buffers",
                "contentURL": "file://" + TESTDIR + "/test-content/Emacs_Dired_buffers.png",
                "title": "Editing multiple Dired buffers in GNU Emacs",
                "tags": ["Dired buffers", "emacs"],
                "caption": "Editing multiple Dired buffers in GNU Emacs",
                "encodingFormat": "png",
                "height": "666",
                "copyrightHolder": "the world",
                "width": "666"
            }
        ];
        // let json = JSON.parse(blob);
        let media_objects = json.map(function (obj) {
            return MediaObjectModel.MediaObjectModel.new_from_json_ld(obj);
        });
        return media_objects;
    }
});

let app = new TestApplication({
    application_id: TEST_APPLICATION_ID,
    flags: 0
});
app.run(ARGV);
