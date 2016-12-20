const Eknc = imports.gi.EosKnowledgeContent;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Engine = imports.search.engine;
const QueryObject = imports.search.queryObject;
const SearchUtils = imports.search.utils;

const IMAGES_DIR = 'resource:///com/endlessm/knowledge/data/images/tools/';
const NUM_TOP_LEVEL_SETS = 20;
const NUM_SUBSETS_PER_SET = 3;

const MoltresEngine = new Lang.Class({
    Name: 'MoltresEngine',
    Extends: GObject.Object,

    _init: function () {
        this.parent();
        this._to_return = null;
        this._counter = 0;
        this._set_models = [];

        // Sets must all be created up front and be fixed. We cannot create
        // them dynamically at runtime because otherwise the SetMap (which
        // gets populated during init(), will not work properly)
        for (let i = 0; i < NUM_TOP_LEVEL_SETS; i++) {
            let set_props = JSON.parse(JSON.stringify(this._SETS[i % this._SETS.length]));
            let child_tag = set_props.title + i;
            set_props.child_tags = [child_tag];
            set_props.ekn_id = set_props.ekn_id + '$' + i;
            this._set_models.push(this._generate_set_object(set_props));

            // Now create subsets for this set. The child_tag variable is what
            // connects a parent set to its subsets.
            for (let j = 0; j < NUM_SUBSETS_PER_SET; j++) {
                let subset_props = JSON.parse(JSON.stringify(this._SETS[j]));
                subset_props.tags.push(child_tag)
                subset_props.featured = false;
                let subset_child_tag = subset_props.title + 'subset' + i + '' + j;
                subset_props.child_tags = [subset_child_tag];
                subset_props.ekn_id = subset_props.ekn_id + 'subset' + i + '' + j;
                this._set_models.push(this._generate_set_object(subset_props));
            }
        }
    },

    get_ekn_id: function () {},

    get_object: function (ekn_id, cancellable, callback) {
        let set = this._set_models.filter((model) => {
            return model.ekn_id === ekn_id;
        })[0];

        if (set) {
            this._to_return = set;
            callback(this);
            return;
        }
        // Retrieve the original model data corresponding to
        // this ekn_id. Each ekn_id is made unique by appending
        // a nonce to the end. To get the original data, we
        // remove the nonce and compare the ekn_id to those
        // fixed ekn_ids we have defined below in _ARTICLES/_SETS.
        let model_props = this._ARTICLES.filter((data) => {
            return data.ekn_id == ekn_id.split('$')[0];
        })[0];

        // We only want to modify the ekn_id for this specific
        // model, not the pristine data blob in _ARTICLES/_SETS, so
        // we make a copy first.
        let copy = JSON.parse(JSON.stringify(model_props));
        copy.ekn_id = ekn_id;
        this._to_return = this._generate_article_object(copy);
        callback(this);
    },

    get_object_finish: function () {
        return this._to_return;
    },

    _get_sets: function (query) {
        let set_models = this._set_models.filter((model) => {
            if (query.tags_match_any.length === 0)
                return true;
            return query.tags_match_any.some((tag) => {
                return model.tags.indexOf(tag) >= 0;
            });
        });

        this._to_return = set_models;
        this._info = {
            upper_bound: set_models.length,
        }
    },

    _get_articles: function (query) {
        let matching_strings = this._ARTICLES.reduce((arr, obj) => {
                                                return arr.concat(obj.title.toLowerCase().split(' '));
                                             }, [])
                                             .concat(this._SYNOPSIS.toLowerCase().split(' '));
        // If the query matches any article or set title, or the synopsis, return some content.
        // Otherwise, return nothing. If no query string was specified at all, we also want to
        // return content since this handles e.g. suggested articles modules.
        this._to_return = [];
        if (!query.query || query.query.toLowerCase().split(' ').some((token) => matching_strings.indexOf(token.trim()) > -1)) {
            for (let i = 0; i < Math.min(10, query.limit); i++) {
                let data = this._ARTICLES[i % this._ARTICLES.length];
                let unique_data = JSON.parse(JSON.stringify(data));
                unique_data.ekn_id = data.ekn_id + '$' + this._counter++;

                // If query requested articles matching certain tags, dynamically
                // add those tags at runtime, to 'fake' the result.
                if (query.tags_match_any.length !== 0)
                    unique_data.tags.push(query.tags_match_any[0])
                this._to_return.push(this._generate_article_object(unique_data));
            }
            this._info = {
                upper_bound: this._to_return.length,
            };
        }
    },

    get_objects_for_query: function (query, cancellable, callback) {
        let generation_func;
        if (query.tags_match_all.indexOf('EknSetObject') >= 0) {
            this._get_sets(query);
        } else {
            this._get_articles(query);
        }

        callback(this);
    },

    get_objects_for_query_finish: function () {
        return [this._to_return, this._info];
    },

    _ARTICLES: [
        {
            title: 'Football',
            ekn_id: 'ekn://moltres/football',
            tags: ['EknArticleObject'],
            thumbnail_uri: IMAGES_DIR + 'football.jpg',
        },
        {
            title: 'The Importance of Studying',
            ekn_id: 'ekn://moltres/studying',
            tags: ['EknArticleObject'],
            thumbnail_uri: IMAGES_DIR + 'desk.jpg',
        },
        {
            title: 'A Room With A View',
            ekn_id: 'ekn://moltres/room',
            tags: ['EknArticleObject'],
            thumbnail_uri: IMAGES_DIR + 'house.jpg',
        },
    ],

    _SETS: [
        {
            title: 'Nature',
            ekn_id: 'ekn://moltres/nature',
            tags: ['EknSetObject'],
            thumbnail_uri: IMAGES_DIR + 'forest.jpg',
            featured: true,
        },
        {
            title: 'People',
            ekn_id: 'ekn://moltres/people',
            tags: ['EknSetObject'],
            thumbnail_uri: IMAGES_DIR + 'people.jpg',
            featured: true,
        },
        {
            title: 'Work',
            ekn_id: 'ekn://moltres/work',
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
        return Eknc.SetObjectModel.new_from_props(data);
    },

    _generate_article_object: function (data) {
        data.synopsis = this._SYNOPSIS;
        data.content_type = 'text/html';
        data.source = 'wikipedia';
        data.license = 'CC-BY-SA 3.0';
        let article = Eknc.ArticleObjectModel.new_from_props(data);
        article.get_content_stream = () => { return SearchUtils.string_to_stream('<html><body><p>Some content</p></body></html>'); };
        return article;
    },
});

// Override the default engine singleton with our own, moltres Engine.
let override_engine = () => {
    let engine = new MoltresEngine();
    Engine.the_engine = engine;
};
