const Eknc = imports.gi.EosKnowledgeContent;
const Gio = imports.gi.Gio;
const Soup = imports.gi.Soup;

const XapianBridge = imports.search.xapianBridge;

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

    beforeEach(function () {
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);

        bridge = new XapianBridge.XapianBridge();
    });

    function mock_request(mock_data) {
        spyOn(bridge, '_send_json_ld_request').and.callFake(function (uri, cancellable, callback) {
            callback(bridge, null);
        });
        spyOn(bridge, '_send_json_ld_request_finish').and.returnValue(mock_data);
    }

    describe('constructor', function () {
        it('should default its port to 3004', function () {
            expect(bridge.port).toBe(3004);
        });

        it('should default its hostname to 127.0.0.1', function () {
            expect(bridge.host).toBe('127.0.0.1');
        });
    });

    describe('_serialize_query', function () {
        it('correctly serializes query args', function () {
            let query_args = {
                path: '/foo',
                query: 'bar',
                offset: 5,
            };
            expect(bridge._serialize_query(query_args)).toEqual('path=%2Ffoo&query=bar&offset=5');

            query_args = {
                slarty: 'thing@with@ats',
                bartfast: 'this=that',
            };
            expect(bridge._serialize_query(query_args)).toEqual('slarty=thing%40with%40ats&bartfast=this%3Dthat');
        });
    });

    describe('get_xapian_uri', function () {
        it('sets order field', function () {
            let query_obj = Eknc.QueryObject.new_from_props({
                query: 'tyrion',
                order: Eknc.QueryObjectOrder.ASCENDING,
            });

            let mock_uri = bridge._get_xapian_query_uri(query_obj);
            let mock_query_obj = mock_uri.get_query();
            expect(get_query_vals_for_key(mock_query_obj, 'order')).toEqual('asc');
        });

        it('should use the lang param iff a language is set', function () {
            let mock_uri, mock_query_obj;
            let query_obj = Eknc.QueryObject.new_from_props({
                query: 'tyrion',
            });

            mock_uri = bridge._get_xapian_query_uri(query_obj);
            mock_query_obj = mock_uri.get_query();
            expect(get_query_vals_for_key(mock_query_obj, 'lang')).toEqual([]);

            bridge.language = 'en';
            mock_uri = bridge._get_xapian_query_uri(query_obj);
            mock_query_obj = mock_uri.get_query();
            expect(get_query_vals_for_key(mock_query_obj, 'lang')).toEqual('en');
        });

        it('does not set path', function () {
            let query_obj = Eknc.QueryObject.new_from_props({
                query: 'tyrion',
                app_id: 'foo',
            });

            let uri = bridge._get_xapian_query_uri(query_obj);
            query_obj = uri.get_query();
            expect(get_query_vals_for_key(query_obj, 'path')).toEqual([]);
        });

        it('calls into QueryObject for other uri fields', function () {
            let fakeCutoff = 42;
            let fakeSortBy = 512;
            let fakeQ = 'not a real query string';
            let mock_obj = {
                get_cutoff: function () { return fakeCutoff; },
                get_sort_value: function () { return fakeSortBy; },
                get_query_parser_string: function () { return fakeQ; },
            };


            let uri = bridge._get_xapian_query_uri(mock_obj);
            mock_obj = uri.get_query();
            expect(get_query_vals_for_key(mock_obj, 'cutoff')).toEqual(String(fakeCutoff));
            expect(get_query_vals_for_key(mock_obj, 'sortBy')).toEqual(String(fakeSortBy));
            expect(get_query_vals_for_key(mock_obj, 'q')).toEqual(fakeQ);
        });
    });

    describe('get_fixed_query', function () {
        it('should set the stopword-free-query property of a query object', function (done) {
            let mock_correction = {
                'stopWordCorrectedQuery': 'a query with no stop words',
            };
            let mock_query_obj = Eknc.QueryObject.new_from_props({
                query: 'a query with lots of stop words',
            });
            mock_request(mock_correction);
            bridge.get_fixed_query(mock_query_obj, {}, null, function (source, task) {
                let fixed_query_obj = bridge.get_fixed_query_finish(task);
                expect(fixed_query_obj.stopword_free_query).toEqual('a query with no stop words');
                done();
            });
        });
    });

    describe('HTTP requests', function () {
        beforeEach(function () {
            // spy on the queue_message and cancel_message methods
            spyOn(bridge._http_session, 'queue_message').and.callFake(function (request, cb) {
                cb();
            });
            spyOn(bridge._http_session, 'cancel_message');
        });

        it('can be cancelled', function () {
            let cancellable = new Gio.Cancellable();
            bridge.query(Eknc.QueryObject.new_from_props({ query: '0123456789' }), {}, cancellable, noop);
            cancellable.cancel();
            expect(bridge._http_session.cancel_message).toHaveBeenCalled();
            let message = bridge._http_session.cancel_message.calls.mostRecent().args[0];
            // Make sure we are canceling the right Soup Message
            expect(message).toBeA(Soup.Message);
            expect(message.uri.to_string(true)).toMatch('0123456789');
        });

        it('does not make a request if already cancelled', function () {
            let cancellable = new Gio.Cancellable();
            cancellable.cancel();
            bridge.query(Eknc.QueryObject.new_from_props(), {}, cancellable, noop);
            expect(bridge._http_session.queue_message).not.toHaveBeenCalled();
        });
    });
});
