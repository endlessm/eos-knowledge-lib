const Eknc = imports.gi.EosKnowledgeContent;
const Gio = imports.gi.Gio;
const Soup = imports.gi.Soup;

const InstanceOfMatcher = imports.tests.InstanceOfMatcher;

// where querystring is the URI component after a '?', and key is the
// name of a query parameter, return the value(s) for that parameter
// e.g.:
//   get_query_vals_for_keyfunction () 'bar'
//   get_query_vals_for_keyfunction () ['bar', 'baz']
function get_query_vals_for_key (querystring, key) {
    let results = querystring.split('&').filter(function (pair) {
        return pair.indexOf(key + '=') === 0;
    }).map(function (pair) {
        return decodeURIComponent(pair.split('=')[1]);
    });

    if (results.length === 1)
        return results[0];
    return results;
}

describe('XapianBridge', function () {
    let noop = function () {};
    let bridge;
    let session;

    beforeEach(function () {
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);

        bridge = new Eknc.XapianBridge();
        session = bridge.get_soup_session();
    });

    describe('constructor', function () {
        it('should default its port to 3004', function () {
            expect(bridge.port).toBe(3004);
        });

        it('should default its hostname to 127.0.0.1', function () {
            expect(bridge.host).toBe('127.0.0.1');
        });
    });

    describe('query', function () {
        it('sets order field', function (done) {
            let query_obj = Eknc.QueryObject.new_from_props({
                query: 'tyrion',
                order: Eknc.QueryObjectOrder.ASCENDING,
            });

            session.connect("request-queued", function (session, message) {
                let query_part = message.get_uri().get_query();
                expect(get_query_vals_for_key(query_part, 'order')).toEqual('asc');
                done();
            });
            bridge.query(query_obj, {}, null, noop);
        });

        it('should not use the lang param if a language is not set', function (done) {
            let query_obj = Eknc.QueryObject.new_from_props({
                query: 'tyrion',
            });

            session.connect("request-queued", function (session, message) {
                let query_part = message.get_uri().get_query();
                expect(get_query_vals_for_key(query_part, 'lang')).toEqual([]);
                done();
            });
            bridge.query(query_obj, {}, null, noop);
        });

        it('should use the lang param if a language is set', function (done) {
            bridge.language = 'en';

            let query_obj = Eknc.QueryObject.new_from_props({
                query: 'tyrion',
            });

            session.connect("request-queued", function (session, message) {
                let query_part = message.get_uri().get_query();
                expect(get_query_vals_for_key(query_part, 'lang')).toEqual('en');
                done();
            });
            bridge.query(query_obj, {}, null, noop);
        });

        it('calls into QueryObject for other uri fields', function (done) {
            let query_obj = Eknc.QueryObject.new_from_props({
                query: 'tyrion',
                tags_match_all: ['schmearion'],
            });


            session.connect("request-queued", function (session, message) {
                let query_part = message.get_uri().get_query();
                expect(get_query_vals_for_key(query_part, 'q')).toMatch('tyrion');
                expect(get_query_vals_for_key(query_part, 'q')).toMatch('schmearion');
                done();
            });
            bridge.query(query_obj, {}, null, noop);
        });

        it('adds any extra parameters passed in to the uri', function (done) {
            let query_obj = Eknc.QueryObject.new_from_props({
                query: 'tyrion',
            });

            session.connect("request-queued", function (session, message) {
                let query_part = message.get_uri().get_query();
                expect(get_query_vals_for_key(query_part, 'frobity')).toEqual('bobity');
                done();
            });
            bridge.query(query_obj, { 'frobity': 'bobity' }, null, noop);
        });
    });

    describe('get_fixed_query', function () {
        it('sets the q field to the user entered query', function (done) {
            let query_obj = Eknc.QueryObject.new_from_props({
                query: 'tyrion',
            });

            session.connect("request-queued", function (session, message) {
                let query_part = message.get_uri().get_query();
                expect(get_query_vals_for_key(query_part, 'q')).toEqual('tyrion');
                done();
            });
            bridge.get_fixed_query(query_obj, {}, null, noop);
        });

        it('uses the fix path', function (done) {
            let query_obj = Eknc.QueryObject.new_from_props({
                query: 'tyrion',
            });

            session.connect("request-queued", function (session, message) {
                expect(message.get_uri().get_path()).toEqual('/fix');
                done();
            });
            bridge.get_fixed_query(query_obj, {}, null, noop);
        });

        it('adds any extra parameters passed in to the uri', function (done) {
            let query_obj = Eknc.QueryObject.new_from_props({
                query: 'tyrion',
            });

            session.connect("request-queued", function (session, message) {
                let query_part = message.get_uri().get_query();
                expect(get_query_vals_for_key(query_part, 'frobity')).toEqual('bobity');
                done();
            });
            bridge.get_fixed_query(query_obj, { 'frobity': 'bobity' }, null, noop);
        });
    });

    describe('HTTP requests', function () {
        it('can be cancelled', function (done) {
            let cancellable = new Gio.Cancellable();
            let soup_message;
            session.connect("request-queued", function (session, message) {
                soup_message = message;
            });
            bridge.query(Eknc.QueryObject.new_from_props({ query: '0123456789' }), {}, cancellable, function (bride, result) {
                expect(soup_message.status_code).toBe(Soup.Status.CANCELLED);
                expect(() => bridge.query_finish(result)).toThrow();
                done();
            });
            cancellable.cancel();
        });
    });
});
