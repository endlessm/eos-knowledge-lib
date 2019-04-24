const {DModel, Gio, GObject, Zim} = imports.gi;
const Lang = imports.lang;

const Utils = imports.framework.utils;

const ZIM_META_KEYS = [
    'Name',
    'Title',
    'Creator',
    'Publisher',
    'Date',
    'Description',
    'LongDescription',
    'Language',
    'License',
    'Tags',
    'Relation',
    'Source',
    'Counter',
];

var ZimContent = new Lang.Class({
    Name: 'ZimContent',
    Extends: DModel.Content,

    _init: function (params, zim_article) {
        this.parent(params);
        this._zim_article = zim_article;
    },

    get_content_stream: function() {
        let bytes = this._zim_article.get_data().toGBytes();
        return Gio.MemoryInputStream.new_from_bytes(bytes);
    },
});

var ZimArticle = new Lang.Class({
    Name: 'ZimArticle',
    Extends: DModel.Article,

    _init: function (params, zim_article) {
        this.parent(params);
        this._zim_article = zim_article;
    },

    get_content_stream: function() {
        let bytes = this._zim_article.get_data().toGBytes();
        return Gio.MemoryInputStream.new_from_bytes(bytes);
    },
});

var ZimImage = new Lang.Class({
    Name: 'ZimImage',
    Extends: DModel.Image,

    _init: function (params, zim_article) {
        this.parent(params);
        this._zim_article = zim_article;
    },

    get_content_stream: function() {
        let bytes = this._zim_article.get_data().toGBytes();
        return Gio.MemoryInputStream.new_from_bytes(bytes);
    },
});

var ZimEngineDomain = new Lang.Class({
    Name: 'ZimEngineDomain',
    Extends: GObject.Object,

    _init: function(content_path) {
        this._zim_file = Zim.File.new(content_path);

        this._meta = this._load_metadata();
        this._source_id = this._meta['Name'] || '';

        this._main_page_id = this._load_main_page();

        this._set_models = [];

        let main_set = new DModel.Set({
            title: this._meta['Title'],
            id: `zim://${this._source_id}/_set/main`,
            tags: [],
            child_tags: ['ZimMainPage'],
            featured: true,
        });

        this._set_models.push(main_set);
    },

    _load_metadata: function() {
        let meta = {};

        for (let key of ZIM_META_KEYS) {
            let namespace_id = 'M'.charCodeAt(0);
            let article = this._zim_file.get_article_by_namespace(namespace_id, key);
            let article_data = article.good() ? article.get_data() : null;
            if (article_data) {
                meta[key] = article_data.toString();
            }
        }

        return meta;
    },

    _load_main_page: function() {
        let header = this._zim_file.get_fileheader();

        if (!header.has_main_page()) {
            return undefined;
        }

        let main_page_index = header.get_main_page();
        let [namespace, article] = this._load_zim_article_for_index(main_page_index);

        if (!article) {
            return undefined;
        }
        
        let article_url = article.get_url();
        let zim_path = [namespace, article_url].join('/');
        return this._zim_path_to_uri(zim_path);
    },

    read_uri: function(uri) {
        // Expected uri format: zim://[source]/[zim_path...]
        let zim_path = this._uri_to_zim_path(uri);
        if (!zim_path) {
            return [false, null, null];
        }

        let [_namespace, zim_article] = this._load_zim_article_for_zim_path(zim_path);
        if (!zim_article) {
            return [false, null, null];
        }

        let article_data = zim_article.get_data().toGBytes();
        let mime_type = zim_article.get_mime_type();
        return [true, article_data, mime_type];
    },

    get_shards: function() {
        return [];
    },

    get_subscription_ids: function() {
        return [];
    },

    get_object: function(uri) {
        return this._build_model_for_id(uri);
    },

    query: function(query) {
        if (query.tags_match_all.indexOf('EknSetObject') >= 0) {
            return this._get_sets(query);
        } else if (query.tags_match_all.indexOf('EknArticleObject') >= 0) {
            return this._get_items(query, 'EknArticleObject');
        } else if (query.tags_match_all.indexOf('EknVideoObject') >= 0) {
            return this._get_items(query, 'EknVideoObject');
        } else if (query.tags_match_all.indexOf('EknAudioObject') >= 0) {
            return this._get_items(query, 'EknAudioObject');
        } else {
            return this._get_items(query, null);
        }
    },

    _build_model_for_id: function(id) {
        // Expected id format: zim://[source]/[zim_path...]
        let zim_path = this._uri_to_zim_path(id);
        return this._build_model_for_zim_path(zim_path);
    },

    _build_model_for_zim_path: function(zim_path) {
        let [namespace, zim_article] = this._load_zim_article_for_zim_path(zim_path);

        if (!zim_article) {
            return Promise.reject("Failed to load zim article");
        }

        return Promise.resolve(
            this._build_model_for_zim_article(namespace, zim_article)
        );
    },

    _load_zim_article_for_index: function(index) {
        let article = this._zim_file.get_article_by_index(index);
        if (article.good() && article.is_redirect()) {
            article = article.get_redirect_article();
        }
        if (!article.good()) {
            article = null;
        }
        return ["A", article];
    },

    _load_zim_article_for_zim_path: function(zim_path) {
        let [namespace, path] = this._get_zim_path_components(zim_path);
        let namespace_id = namespace.charCodeAt(0);
        let article = this._zim_file.get_article_by_namespace(namespace_id, path);
        if (article.good() && article.is_redirect()) {
            article = article.get_redirect_article();
        }
        if (!article.good()) {
            article = null;
        }
        return [namespace, article];
    },

    _get_zim_path_components: function(zim_path) {
        let components = zim_path.split('/');
        let namespace = components[0] || '';
        let path = components.slice(1).join('/');
        return [namespace, path];
    },

    _build_model_for_zim_article: function(namespace, zim_article) {
        let article_url = zim_article.get_url();
        let article_title = zim_article.get_title();
        let article_mime_type = zim_article.get_mime_type();
        let zim_path = [namespace, article_url].join('/');

        let model_id = this._zim_path_to_uri(zim_path);

        let source_id = this._meta['Name'] || '';
        let source_name = this._meta['Title'] || '';
        let date = this._meta['Date'] || '';
        let creator = this._meta['Creator'];
        let license = this._meta['License'] || '';

        let tags = [];

        let default_data = {
            id: model_id,
            title: article_title,
            content_type: article_mime_type,
        }

        if (namespace === 'A') {
            // TODO: Set resources to a list of linked media models

            tags.push('EknArticleObject');

            if (model_id === this._main_page_id) {
                tags.push('ZimMainPage');
            }

            return new ZimArticle(
                Object.assign({}, default_data, {
                    is_server_templated: true,
                    source: source_id,
                    source_name: source_name,
                    published: date,
                    authors: creator ? [creator] : [],
                    synopsis: "This is an article",
                    license: license,
                    tags: tags,
                }),
                zim_article
            );
        } else if (namespace === 'I') {
            // TODO: Check content type to handle videos and other file types
            return new ZimImage(
                Object.assign({}, default_data, {
                    copyright_holder: creator,
                    license: license,
                    tags: tags,
                }),
                zim_article
            );
        } else {
            return new ZimContent(
                Object.assign({}, default_data, {
                    copyright_holder: creator,
                    license: license,
                    tags: tags,
                }),
                zim_article
            );
        }
    },

    _uri_to_zim_path: function(uri) {
        if (!uri.startsWith('zim://')) {
            return null;
        }
        return Utils.components_from_id(uri).join('/');
    },

    _zim_path_to_uri: function(zim_path) {
        return `zim://${this._source_id}/${zim_path}`;
    },

    _get_sets: function (query) {
        let set_models = this._set_models;

        if (query.tags_match_any.length > 0) {
            set_models = set_models.filter(
                model => query.tags_match_any.some(tag => model.tags.includes(tag))
            );
        }

        return Promise.resolve({
            models: set_models.slice(query.offset, query.limit + query.offset),
            upper_bound: set_models.length,
        });
    },

    _get_items: function (query, type_tag) {
        if (query.search_terms) {
            let search = Zim.Search.new(this._zim_file);
            search.set_query(query.search_terms);
            search.set_suggestion_mode(false);
            search.set_range(query.offset, query.limit + query.offset);

            let matching_zim_paths = [];
            let search_iter = search.begin();

            while (search_iter && search_iter.get_url()) {
                matching_zim_paths.push(search_iter.get_url());
                search_iter = search_iter.next() ? search_iter : null;
            }

            let all_models = matching_zim_paths.map(
                zim_path => this._build_model_for_zim_path(zim_path)
            );

            return Promise.all(all_models).then(
                (models) => {
                    return {
                        models: models,
                        upper_bound: search.get_matches_estimated(),
                    };
                }
            );
        } else if (query.tags_match_any) {
            let all_models = [];

            if (query.tags_match_any.includes("ZimMainPage") && this._main_page_id !== undefined) {
                all_models.push(
                    this._build_model_for_id(this._main_page_id)
                );
            }

            return Promise.all(all_models).then(
                (models) => {
                    return {
                        models: models.slice(query.offset, query.limit + query.offset),
                        upper_bound: models.length,
                    }
                }
            );
        } else if (query.tags_match_all) {
            return Promise.resolve({
                models: [],
                upper_bound: 0,
            })
        } else {
            return Promise.resolve({
                models: [],
                upper_bound: 0,
            })
        }
    }
});

var ZimEngine = new Lang.Class({
    Name: 'ZimEngine',
    Extends: GObject.Object,

    _init: function (content_path) {
        this.parent();
        this._domain = new ZimEngineDomain(content_path);
    },

    get_domain: function () {
        return this._domain;
    },

    get_id: function () {},

    get_object(id) {
        let domain = this.get_domain();
        return domain.get_object(id);
    },

    query(query) {
        let domain = this.get_domain();
        return domain.query(query);
    },
});

// Override the default engine singleton with our own, moltres Engine.
function override_engine(content_path) {
    let engine = new ZimEngine(content_path);
    DModel.Engine.get_default = function () {
        return engine;
    };
};
