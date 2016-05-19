/* exported TwitterSearch */

// Copyright 2016 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Rest = imports.gi.Rest;

const Actions = imports.app.actions;
const ArticleObjectModel = imports.search.articleObjectModel;
const Collection = imports.app.modules.collection.collection;
const Dispatcher = imports.app.dispatcher;
const Module = imports.app.interfaces.module;

const CONSUMER_KEY = 'wGhtPDGOTp7FTG4GgQ9eelePK';
const CONSUMER_SECRET = 'redacted';
const TOKEN = 'redacted';
const TOKEN_SECRET = 'redacted';

const TwitterSearch = new Module.Class({
    Name: 'TwitterSearchCollection',
    Extends: Collection.Collection,

    Properties: {
        'hashtag': GObject.ParamSpec.string('hashtag', '', '',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            ''),
    },

    _init: function (props={}) {
        this._loading = false;
        this._can_load_more = true;
        this._max_id = 0;
        this._query = null;

        this.parent(props);

        this._proxy = Rest.OAuthProxy.new_with_token(CONSUMER_KEY,
            CONSUMER_SECRET, TOKEN, TOKEN_SECRET,
            'https://api.twitter.com/1.1/', false);

        Dispatcher.get_default().register(payload => {
            switch (payload.action_type) {
            case Actions.SEARCH_TEXT_ENTERED:
                // This is instead of listening to global state
                this._query = payload.query;
                this.clear();
                this._set_can_load_more(true);
                break;
            }
        });
    },

    get loading() {
        return this._loading;
    },

    get can_load_more() {
        return this._can_load_more;
    },

    _set_can_load_more: function (value) {
        if (this.can_load_more === value)
            return;
        this._can_load_more = value;
        this.notify('can-load-more');
    },

    load_more: function (num_desired) {
        if (this.loading)
            return;
        this._loading = true;

        let call = new Rest.OAuthProxyCall({ proxy: this._proxy });
        call.set_method('GET');
        call.set_function('search/tweets.json');
        call.add_param('q', encodeURI(this.hashtag + ' ' + this._query));
        if (this._max_id) {
            call.add_param('max_id', this._max_id.toString());
            call.add_param('count', (num_desired + 1).toString());
        } else {
            call.add_param('count', num_desired.toString());
        }

        call.invoke_async(null, (call, res) => {
            this._loading = false;
            this.notify('loading');

            try {
                call.invoke_finish(res);
            } catch (e) {
                logError(e, 'Could not load more tweets');
                this._set_can_load_more(false);
                return;
            }

            let payload = JSON.parse(call.get_payload());
            if (this._max_id) {
                payload.statuses.shift();
                // max_id is inclusive, so we already got that tweet
            }

            let results = payload.statuses.map(tweet => {
                return new ArticleObjectModel.ArticleObjectModel({
                    ekn_id: 'ekn:///oracle-google-en/' + tweet.id_str,
                    title: tweet.user.name + ' (@' + tweet.user.screen_name + ')',
                    synopsis: tweet.text,
                });
            });

            this._max_id = payload.statuses.reduce((max_id, tweet) =>
                Math.min(tweet.id, max_id), Infinity);

            this._set_can_load_more(true);

            let results_added = results.filter(this.add_model, this);
            if (results_added.length > 0) {
                this.emit('models-changed');
            }
        });
    },
});

