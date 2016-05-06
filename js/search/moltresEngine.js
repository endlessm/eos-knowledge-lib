const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

const ArticleObjectModel = imports.search.articleObjectModel;
const Engine = imports.search.engine;
const SearchUtils = imports.search.utils;
const SetObjectModel = imports.search.setObjectModel;

const IMAGES_DIR = 'resource:///com/endlessm/knowledge/data/images/tools/';

const MoltresEngine = new Lang.Class({
    Name: 'MoltresEngine',
    Extends: GObject.Object,

    _init: function () {
        this.parent();
        this._to_return = null;
        this._counter = 0;
    },

    add_runtime_object: function () {},
    get_ekn_id: function () {},

    get_object_by_id: function (ekn_id, cancellable, callback) {
        // Retrieve the original model data corresponding to
        // this ekn_id. Each ekn_id is made unique by appending
        // a nonce to the end. To get the original data, we
        // remove the nonce and compare the ekn_id to those
        // fixed ekn_ids we have defined below in _ARTICLES/_SETS.
        let model_props = this._ARTICLES.concat(this._SETS).filter((data) => {
            return data.ekn_id == ekn_id.split('#')[0];
        })[0];

        // We only want to modify the ekn_id for this specific
        // model, not the pristine data blob in _ARTICLES/_SETS, so
        // we make a copy first.
        let copy = JSON.parse(JSON.stringify(model_props));
        copy.ekn_id = ekn_id;
        if (copy.tags.indexOf('EknSetObject') >= 0) {
            this._to_return = this._generate_set_object(copy);
        } else {
            this._to_return = this._generate_article_object(copy);
        }
        callback(this);
    },

    get_object_by_id_finish: function () {
        return this._to_return;
    },

    get_objects_by_query: function (query, cancellable, callback) {
        let generation_func;
        let uniquify = (data) => {
            // Make a copy of the data, since we are about to modify it for
            // a particular usage and we don't want those changes to persist
            // for all future models.
            let unique_data = JSON.parse(JSON.stringify(data));
            // Ensure we have unique ids for each object
            unique_data.ekn_id = data.ekn_id + '#' + this._counter++;
            return unique_data;
        }
        if (query.tags.indexOf('EknSetObject') >= 0) {
            generation_func = () => {
                let unique = uniquify(this._SETS[GLib.random_int_range(0, this._SETS.length)]);
                return this._generate_set_object(unique);
            }
        } else {
            generation_func = () => {
                let unique = uniquify(this._ARTICLES[GLib.random_int_range(0, this._ARTICLES.length)]);
                return this._generate_article_object(unique);
            }
        }

        this._to_return = [];
        for (let i = 0; i < Math.min(10, query.limit); i++) {
            this._to_return.push(generation_func());
        }
        callback(this);
    },

    get_objects_by_query_finish: function () {
        return [this._to_return, null];
    },

    _ARTICLES: [
        {
            title: 'Football',
            ekn_id: 'ekn://moltres/football',
            tags: ['people', 'EknArticleObject'],
            thumbnail_uri: IMAGES_DIR + 'football.jpg',
        },
        {
            title: 'The Importance of Studying',
            ekn_id: 'ekn://moltres/studying',
            tags: ['work', 'EknArticleObject'],
            thumbnail_uri: IMAGES_DIR + 'desk.jpg',
        },
        {
            title: 'A Room With A View',
            ekn_id: 'ekn://moltres/room',
            tags: ['nature', 'EknArticleObject'],
            thumbnail_uri: IMAGES_DIR + 'house.jpg',
        },
    ],

    _SETS: [
        {
            title: 'Nature',
            ekn_id: 'ekn://moltres/nature',
            child_tags: ['nature'],
            tags: ['EknSetObject'],
            thumbnail_uri: IMAGES_DIR + 'forest.jpg',
            featured: false,
        },
        {
            title: 'People',
            ekn_id: 'ekn://moltres/people',
            child_tags: ['people'],
            tags: ['EknSetObject'],
            thumbnail_uri: IMAGES_DIR + 'people.jpg',
            featured: false,
        },
        {
            title: 'Work',
            ekn_id: 'ekn://moltres/work',
            child_tags: ['work'],
            tags: ['EknSetObject'],
            thumbnail_uri: IMAGES_DIR + 'food.jpg',
            featured: true,
        },
    ],

    _SYNOPSIS: 'Aenean sollicitudin, purus ac \
feugiat fermentum, est nulla finibus enim, vitae \
convallis dui eros ac enim. Proin efficitur sollicitudin \
lectus, nec consequat turpis volutpat quis. Vestibulum \
sagittis ut leo nec ullamcorper. Nullam eget odio a elit \
placerat varius non id dui.',

    _generate_set_object: function (data) {
        data.synopsis = this._SYNOPSIS;
        return new SetObjectModel.SetObjectModel(data);
    },

    _generate_article_object: function (data) {
        data.synopsis = this._SYNOPSIS;
        data.content_type = 'text/html';
        data.source = 'wikipedia';
        data.get_content_stream = () => { return SearchUtils.string_to_stream('<html><body><p>Some content</p></body></html>'); };
        return new ArticleObjectModel.ArticleObjectModel(data);        
    },
});

// Override the default engine singleton with our own, moltres Engine.
let override_engine = () => {
    let engine = new MoltresEngine();
    Engine.the_engine = engine;
};
