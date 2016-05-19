/* exported TwitterTimeline */

// Copyright 2016 Endless Mobile, Inc.

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

const TwitterTimeline = new Module.Class({
    Name: 'TwitterTimelineCollection',
    Extends: Collection.Collection,

    _init: function (props={}) {
        this._loading = false;
        this._can_load_more = true;
        this._max_id = 0;
        this._set_model = null;

        this.parent(props);

        this._proxy = Rest.OAuthProxy.new_with_token(CONSUMER_KEY,
            CONSUMER_SECRET, TOKEN, TOKEN_SECRET,
            'https://api.twitter.com/1.1/', false);

        Dispatcher.get_default().register(payload => {
            switch (payload.action_type) {
            case Actions.SET_CLICKED:
                // This is instead of listening to global state
                this._set_model = payload.model;
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
        call.set_function('statuses/user_timeline.json');
        call.add_param('screen_name', this._set_model.title.slice(1));  // -@
        call.add_param('include_rts', '1');
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
                payload.shift();
                // max_id is inclusive, so we already got that tweet
            }

            let results = payload.map(tweet => {
                return new ArticleObjectModel.ArticleObjectModel({
                    ekn_id: 'ekn:///oracle-google-en/' + tweet.id_str,
                    title: tweet.user.name + ' (@' + tweet.user.screen_name + ')',
                    synopsis: tweet.text,
                });
            });

            this._max_id = payload.reduce((max_id, tweet) =>
                Math.min(tweet.id, max_id), Infinity);

            this._set_can_load_more(true);

            let results_added = results.filter(this.add_model, this);
            if (results_added.length > 0) {
                this.emit('models-changed');
            }
        });
    },
});

