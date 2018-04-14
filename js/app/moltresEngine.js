const {DModel, GObject} = imports.gi;
const Lang = imports.lang;

const Utils = imports.app.utils;

const IMAGES_DIR = 'resource:///com/endlessm/knowledge/data/images/tools/';
const NUM_TOP_LEVEL_SETS = 20;
const NUM_SUBSETS_PER_SET = 3;
const ITEM_TYPES = ['EknAudioObject', 'EknArticleObject', 'EknVideoObject'];
const VIDEO_FILENAME = 'give_that_man_a_knighthood.webm';
const VIDEO_TITLE = 'Video Model';
const AUDIO_TITLE = 'Audio Model';

var MoltresEngine = new Lang.Class({
    Name: 'MoltresEngine',
    Extends: GObject.Object,

    _init: function () {
        this.parent();
        this._article_count = 0;
        this._video_count = 0;
        this._audio_count = 0;
        this._set_models = [];
        this._article_models = [];
        this._video_models = [];
        this._audio_models = [];

        // Sets must all be created up front and be fixed. We cannot create
        // them dynamically at runtime because otherwise the SetMap (which
        // gets populated during init(), will not work properly)
        for (let i = 0; i < NUM_TOP_LEVEL_SETS; i++) {
            let set_props = JSON.parse(JSON.stringify(this._SETS[i % this._SETS.length]));
            let child_tag = set_props.title + i;
            set_props.child_tags = [child_tag];
            set_props.id += '$' + i;
            this._set_models.push(this._generate_set_object(set_props));

            // Now create subsets for this set. The child_tag variable is what
            // connects a parent set to its subsets.
            // Note this means that moltres only works with templates that
            // expect only two levels of sets, i.e will not work with
            // capacitate app.
            for (let j = 0; j < NUM_SUBSETS_PER_SET; j++) {
                let subset_props = JSON.parse(JSON.stringify(this._SETS[j]));
                subset_props.tags.push(child_tag)
                subset_props.featured = false;
                let subset_child_tag = subset_props.title + 'subset' + i + '' + j;
                subset_props.child_tags = [subset_child_tag];
                subset_props.id += 'subset' + i + '' + j;
                this._set_models.push(this._generate_set_object(subset_props));
            }
        }
    },

    get_domain: function () {
        const html = Utils.string_to_bytes('<html><body><p>Some content</p></body></html>');
        return {
            read_uri: () => [true, html, 'text/html'],
            get_shards: () => [],
            get_subscription_ids: () => [],
        };
    },

    get_id: function () {},

    get_object_promise: function (id) {
        return Promise.resolve(this._set_models
        .concat(this._article_models)
        .concat(this._video_models)
        .concat(this._audio_models)
        .find(model => model.id === id));
    },

    _get_sets: function (query) {
        let set_models = this._set_models;

        if (query.tags_match_any.length > 0) {
            set_models = set_models.filter(model =>
                query.tags_match_any.some(tag => model.tags.includes(tag)));
        }

        return {
            models: set_models.slice(query.offset, query.limit + query.offset),
            upper_bound: set_models.length,
        };
    },

    _get_items: function (query, type_tag) {
        let normalize = (str) => str.toLowerCase().split(' ');
        let matching_strings = this._ARTICLES.reduce((arr, obj) => {
                                                return arr.concat(normalize(obj.title));
                                             }, [])
                                             .concat(normalize(this._SYNOPSIS))
                                             .concat(normalize(VIDEO_TITLE))
                                             .concat(normalize(AUDIO_TITLE));
        // If the query matches any article or set title, or the synopsis, return some content.
        // Otherwise, return nothing. If no query string was specified at all, we also want to
        // return content since this handles e.g. suggested articles modules.
        let to_return = {
            models: [],
            upper_bound: 0,
        };
        if (!query.search_terms ||
            query.search_terms.toLowerCase().split(' ').some(token => matching_strings.indexOf(token.trim()) > -1)) {
            for (let i = 0; i < Math.min(10, query.limit); i++) {
                let data = this._ARTICLES[i % this._ARTICLES.length];
                let unique_data = JSON.parse(JSON.stringify(data));

                // type_tag is like 'EknArticleObject' or 'EknVideoObject'.
                // If no type explicitly requested, randomly pick one
                let object_type = type_tag;
                if (!object_type) {
                    let rand_index = Math.floor(Math.random() * 100) % ITEM_TYPES.length;
                    object_type = ITEM_TYPES[rand_index];
                }
                unique_data.tags.push(object_type);
                // If query requested articles matching certain tags, dynamically
                // add those tags at runtime, to 'fake' the result.
                if (query.tags_match_any.length !== 0)
                    unique_data.tags.push(query.tags_match_any[0]);

                let model;
                if (object_type === 'EknArticleObject') {
                    model = this._generate_article_object(unique_data);
                } else if (object_type === 'EknVideoObject') {
                    model = this._generate_video_object(unique_data);
                } else if (object_type === 'EknAudioObject') {
                    model = this._generate_audio_object(unique_data);
                } else {
                    logError("Moltres does not support serving objects of type " + object_type);
                }
                to_return.models.push(model);
            }
            to_return.upper_bound = to_return.models.length;
        }
        return to_return;
    },

    query_promise: function (query) {
        if (query.tags_match_all.indexOf('EknSetObject') >= 0) {
            return Promise.resolve(this._get_sets(query));
        } else if (query.tags_match_all.indexOf('EknArticleObject') >= 0) {
            return Promise.resolve(this._get_items(query, 'EknArticleObject'));
        } else if (query.tags_match_all.indexOf('EknVideoObject') >= 0) {
            return Promise.resolve(this._get_items(query, 'EknVideoObject'));
        } else if (query.tags_match_all.indexOf('EknAudioObject') >= 0) {
            return Promise.resolve(this._get_items(query, 'EknAudioObject'));
        } else {
            return Promise.resolve(this._get_items(query, null));
        }
    },

    _ARTICLES: [
        {
            title: 'Football',
            tags: [],
            thumbnail_uri: IMAGES_DIR + 'football.jpg',
        },
        {
            title: 'The Importance of Studying',
            tags: [],
            thumbnail_uri: IMAGES_DIR + 'desk.jpg',
        },
        {
            title: 'A Room With A View',
            tags: [],
            thumbnail_uri: IMAGES_DIR + 'house.jpg',
        },
    ],

    _SETS: [
        {
            title: 'Nature',
            id: 'ekn://moltres/nature',
            tags: ['EknSetObject'],
            thumbnail_uri: IMAGES_DIR + 'forest.jpg',
            featured: true,
        },
        {
            title: 'People',
            id: 'ekn://moltres/people',
            tags: ['EknSetObject'],
            thumbnail_uri: IMAGES_DIR + 'people.jpg',
            featured: true,
        },
        {
            title: 'Work',
            id: 'ekn://moltres/work',
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
        return new DModel.Set(data);
    },

    _generate_audio_object: function (data) {
        data.synopsis = this._SYNOPSIS;
        data.content_type = 'audio/webm';
        data.title = AUDIO_TITLE;
        data.id = IMAGES_DIR + VIDEO_FILENAME + '/'.repeat(this._audio_count++);
        let audio = new DModel.Audio(data);
        this._audio_models.push(audio);
        return audio;
    },

    _generate_video_object: function (data) {
        data.synopsis = this._SYNOPSIS;
        data.content_type = 'video/webm';
        data.title = VIDEO_TITLE; // Override title so we can see which ones are videos
        // Extra slashes are ignored during the resource lookup so we always get the same
        // file. However this does ensure we have unique IDs
        data.id = IMAGES_DIR + VIDEO_FILENAME + '/'.repeat(this._video_count++);
        let video = new DModel.Video(data);
        this._video_models.push(video);
        return video;
    },

    _generate_article_object: function (data) {
        data.synopsis = this._SYNOPSIS;
        data.content_type = 'text/html';
        data.source = 'wikipedia';
        data.license = 'CC-BY-SA 3.0';
        data.id = 'ekn://moltres/article' + this._article_count++;
        let article = new DModel.Article(data);

        // Save this model. We can't just generate them on the fly and then
        // discard them because later the client could request this same article
        // by ID and we need to remember which tags it had. So we have to
        // keep the model around.
        this._article_models.push(article);
        return article;
    },
});

// Override the default engine singleton with our own, moltres Engine.
function override_engine() {
    let engine = new MoltresEngine();
    DModel.Engine.get_default = function () {
        return engine;
    };
};
