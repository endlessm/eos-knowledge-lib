const Eknc = require('../index.js');

Eknc.start_glib_mainloop();
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
        console.log(result.constructor.name + ': ' + result.title);
        console.log(' ', result.tags);
        let { mime_type, data } = engine.get_domain().read_uri(result.ekn_id);
        if (data)
            console.log('  ' + mime_type + ': ' + data.toString('utf8', 0, 20) + '...');
    }
}).catch(function (error) {
    console.log('Error :(');
    console.log(error);
}).then(function () {
    process.exit(0);
});
