eos-knowledge-content node bindings
===================================

Node bindings for the EndlessOS knowledge content library. With this module, you
will be able to access and serve up offline content used in EndlessOS apps
through nodejs, and by extension [electron](https://electron.atom.io/).

You can add this to any node project by running the following.
```
npm install --save eos-knowledge-content
```

## API

For the most part, these bindings should resemble the gjs (GNOME javascript)
bindings used in eos-knowledge-lib. Complete documentation of all objects and
properties can be build from the
[eos-knowledge-content library](https://github.com/endlessm/eos-knowledge-lib/tree/master/ekncontent).

Here's a quick start example grabbing running a query for 'foot' for an app with
the app id 'com.endlessm.soccer.en'.

```js
const Eknc = require('eos-knowledge-content');

let engine = Eknc.Engine.get_default();
engine.default_app_id = 'com.endlessm.soccer.en';

let query = new Eknc.QueryObject({
    query: 'foot',
    limit: 10,
    tags_match_all: ['EknArticleObject'],
});
engine.query(query).then(function (results) {
    console.log('Got results!');
    for (let result of results.get_models()) {
        console.log(result.title);
    }
}).catch(function (error) {
    console.log('Error :(');
    console.log(error);
}).then(function () {
    process.exit(0);
});
```

### Classes

#### Engine
The engine is the main access point to query for content. It is generally used
as a singleton, available via
```js
Eknc.Engine.get_default()
```

It has two properties `default_app_id` and `language` which you will likely want
to set. It provides two main functions `query` and `get_object`.

 - **query(QueryObject query)**: takes in a `QueryObject` and returns a javascript
   promise. This promise will return a `QueryResults` object on a successful
   query.
 - **get_object(String ekn_id)**: takes in a QueryObject and returns a
   javascript promise. This promise will return a `ContentObjectModel` on success.

#### QueryObject
The query object describes a query to run with `Engine`. These objects are
immutable, and all options should be set on construction
```
new Eknc.QueryObject({
  query: 'hello',
});
```

#### QueryResults
You should never need to create a `QueryResults` object yourself, instead you
will fetch on from the `Engine`. Its main method is `get_models`.

 - **get_models()**: Returns a list of `ContentObjectModel`s

#### ContentObjectModel
You will generally not need to construct these object yourself, rather fetch
them via the `Engine`. They are immutable and provide a lot of metadata about
the contents of a article, image or set in our database. This metadata is
exposed via properties.


### Main loop issues
The content library is asynchronous and uses
[glib](https://developer.gnome.org/glib/stable/)'s mainloop for powering its
file polling and timeouts. At the moment, the only option is to drive the glib
mainloop in an idle.

```js
const Eknc = require('eos-knowledge-content');
Eknc.shittyloop();
```
