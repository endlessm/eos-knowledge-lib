const Endless = imports.gi.Endless;
const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Utils = imports.tests.utils;
Utils.register_gresource();
const ArticleObjectModel = imports.search.articleObjectModel;
const ThumbCard = imports.app.modules.thumbCard;
const PostCard = imports.app.modules.postCard;
const SearchResultCard = imports.app.modules.searchResultCard;

const TEST_APPLICATION_ID = 'com.endlessm.knowledge.card';
const TESTDIR = Endless.getCurrentFileDir() + '/..';

const TestApplication = new Lang.Class ({
    Name: 'TestApplication',
    Extends: Endless.Application,

    vfunc_startup: function() {
        this.parent();

        let provider = new Gtk.CssProvider();
        let css_file = Gio.File.new_for_uri('resource:///com/endlessm/knowledge/data/css/endless_buffet.css');
        provider.load_from_file(css_file);
        Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
                                                 provider,
                                                 Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

        let models = [
            {
                    title: 'Red Wedding',
                    thumbnail: 'ekn://red_wedding.jpg',
                    '@type': 'ekn://_vocab/ArticleObject',
                    synopsis: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium ' +
                    'doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et ' +
                    'quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas ' +
                    'sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione ' +
                    'voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, ' +
                    'consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore ' +
                    'magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam ' +
                    'corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure ' +
                    'reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui ' +
                    'dolorem eum fugiat quo voluptas nulla pariatur?'
            },
            {
                    title: 'White Walkers',
                    thumbnail: 'ekn://whitewalker.jpg',
                    '@type': 'ekn://_vocab/ArticleObject',
                    synopsis: 'Here is a medium sized synopsis which needs to be quite long so I can see how' +
                    'it looks when the size of the card changes. But it is not very long.',
            },
            {
                    title: 'King Joffrey Boratheon',
                    thumbnail: 'ekn://joffrey.jpg',
                    '@type': 'ekn://_vocab/ArticleObject',
                    synopsis: 'Here is a short synopsis.',
            },
        ];

        let create_cards = (CardType, orientation) => {
            let grid = new Gtk.Grid({
                orientation: orientation,
            });
            models.map((json) => {
                let props = {
                    ekn_version: 2,
                };
                props.get_content_stream = (ekn_id) => {
                    let filename = ekn_id.slice(6);
                    let file = Gio.File.new_for_path(Utils.get_test_content_builddir() + filename);
                    return file.read(null);
                };
                let model = new ArticleObjectModel.ArticleObjectModel(props, json);
                let card = new CardType({
                    model: model,
                    'title-capitalization': EosKnowledgePrivate.TextTransform.UPPERCASE,
                });
                return card;
            }).forEach((card) => {
                grid.add(card);
            });
            return grid;
        }

        let thumb_grid = create_cards(ThumbCard.ThumbCard, Gtk.Orientation.HORIZONTAL);
        let post_grid = create_cards(PostCard.PostCard, Gtk.Orientation.HORIZONTAL);
        let search_results_grid = create_cards(SearchResultCard.SearchResultCard, Gtk.Orientation.VERTICAL);

        let grand_grid = new Gtk.Grid({
            orientation: Gtk.Orientation.VERTICAL,
        });

        grand_grid.add(thumb_grid);
        grand_grid.add(post_grid);
        grand_grid.add(search_results_grid);

        let window = new Endless.Window({
            application: this,
        });
        window.get_page_manager().add(grand_grid);
        window.show_all();
    },
});

let app = new TestApplication({
    application_id: TEST_APPLICATION_ID,
    flags: 0,
});
app.run(ARGV);
