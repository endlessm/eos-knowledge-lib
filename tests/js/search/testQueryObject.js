const Blacklist = imports.search.blacklist;
const QueryObject = imports.search.queryObject;

describe('QueryObject', function () {
    it('sets tags and ids objects properly', function () {
        let ids = ['ekn://busters-es/0123456789012345',
                   'ekn://busters-es/fabaffacabacbafa'];
        let tags = ['Venkman', 'Stantz'];
        let query_obj = new QueryObject.QueryObject({
            ids: ids,
            tags: tags,
        });
        expect(ids).toEqual(query_obj.ids);
        expect(tags).toEqual(query_obj.tags);
    });

    describe('new_from_object constructor', function () {
        it('duplicates properties from source object', function () {
            let tags = ['Venkman', 'Stantz'];
            let query = 'keymaster';
            let query_obj = new QueryObject.QueryObject({
                tags: tags,
                query: query,
            });
            let query_obj_copy = QueryObject.QueryObject.new_from_object(query_obj);
            expect(query_obj_copy.tags).toEqual(tags);
            expect(query_obj_copy.query).toEqual(query);
        });

        it('allows properties to be overridden', function () {
            let tags = ['Venkman', 'Stantz'];
            let query = 'keymaster';
            let query_obj = new QueryObject.QueryObject({
                tags: tags,
                query: query,
            });
            let new_query = 'gatekeeper';
            let new_query_object = QueryObject.QueryObject.new_from_object(query_obj, {
                query: new_query
            });
            expect(new_query_object.tags).toEqual(tags);
            expect(new_query_object.query).toEqual(new_query);
        });
    });

    it('should map sort property to xapian sort value', function () {
        let query_obj = new QueryObject.QueryObject({
            query: 'tyrion wins',
            sort: QueryObject.QueryObjectSort.RANK,
        });
        let result = query_obj.get_sort_value(query_obj);
        expect(result).toBe(1);

        query_obj = new QueryObject.QueryObject({
            query: 'tyrion wins',
        });
        let undefined_result = query_obj.get_sort_value(query_obj);
        expect(undefined_result).toBe(undefined);
    });

    it('should map match type to xapian cutoff value', () => {
        let query_obj = new QueryObject.QueryObject({
            query: 'tyrion wins',
            match: QueryObject.QueryObjectMatch.TITLE_SYNOPSIS,
        });
        let result = query_obj.get_cutoff(query_obj);
        expect(result).toBe(20);

        query_obj = new QueryObject.QueryObject({
            query: 'tyrion wins',
            match: QueryObject.QueryObjectMatch.TITLE_ONLY,
        });
        let result = query_obj.get_cutoff(query_obj);
        expect(result).toBe(10);
    });

    describe('query parser string', () => {
        it('contains expected terms', function () {
            let query_obj = new QueryObject.QueryObject({
                query: 'foo bar baz',
            });
            let result = query_obj.get_query_parser_string(query_obj);
            expect(result).toMatch('exact_title:Foo_Bar_Baz');
            expect(result).toMatch('title:foo');
            expect(result).toMatch('title:bar');
            expect(result).toMatch('title:baz');
        });

        it('adds wildcard terms only for incremental search', function () {
            let query_obj = new QueryObject.QueryObject({
                query: 'foo',
                type: QueryObject.QueryObjectType.INCREMENTAL,
            });
            let result = query_obj.get_query_parser_string(query_obj);
            expect(result).toMatch('exact_title:Foo\\*');
            expect(result).toMatch('title:foo\\*');

            query_obj = new QueryObject.QueryObject({
                query: 'foo',
                type: QueryObject.QueryObjectType.DELIMITED,
            });
            result = query_obj.get_query_parser_string(query_obj);
            expect(result).not.toMatch('exact_title:Foo\\*');
            expect(result).not.toMatch('title:foo\\*');
        });

        it('contains terms without title prefix if matching synopsis', function () {
            let query_obj = new QueryObject.QueryObject({
                query: 'littl searc',
                match: QueryObject.QueryObjectMatch.TITLE_SYNOPSIS,
            });
            let result = query_obj.get_query_parser_string(query_obj);
            expect(result).toMatch(/\(littl OR littl\*\) AND \(searc OR searc\*\)/);
        });

        it('only uses exact title search for single character queries', function () {
            let query_obj = new QueryObject.QueryObject({
                query: 'a',
                type: QueryObject.QueryObjectType.INCREMENTAL,
            });
            let result = query_obj.get_query_parser_string(query_obj);
            expect(result).toMatch('exact_title:A');
            expect(result).not.toMatch('a\\*');
            expect(result).not.toMatch('title:a');
        });

        it('should ignore excess whitespace (except for tags)', function () {
            let query_obj = new QueryObject.QueryObject({
                query: 'whoa      man',
            });
            let result = query_obj.get_query_parser_string(query_obj);
            expect(result).toMatch('exact_title:Whoa_Man');
            expect(result).toMatch('title:whoa');
            expect(result).toMatch('title:man');
        });

        it('should treat semi colons as whitespace', function () {
            let query_obj = new QueryObject.QueryObject({
                query: 'whoa;man',
            });
            let result = query_obj.get_query_parser_string(query_obj);
            expect(result).toMatch('exact_title:Whoa_Man');
            expect(result).toMatch('title:whoa');
            expect(result).toMatch('title:man');
        });

        it('should lowercase xapian operator terms', function () {
            let query_obj = new QueryObject.QueryObject({
                query: 'PENN AND tELLER',
            });
            let result = query_obj.get_query_parser_string(query_obj);
            expect(result).toMatch('title:and');
        });

        it('should remove parentheses in user terms', function () {
            let query_obj = new QueryObject.QueryObject({
                query: 'foo (bar) baz ((',
            });
            let result = query_obj.get_query_parser_string(query_obj);
            expect(result).toMatch('exact_title:Foo_Bar_Baz');
        });

        it('contains ids from query object', function () {
            let query_obj = new QueryObject.QueryObject({
                domain: 'domain',
                ids: ['ekn://domain/0123456789abcdef',
                      'ekn://domain/fedcba9876543210'],
            });
            let result = query_obj.get_query_parser_string(query_obj);
            expect(result).toMatch('id:0123456789abcdef OR id:fedcba9876543210');
        });

        it('contains tags from query object', function () {
            let query_obj = new QueryObject.QueryObject({
                tags: ['cats', 'dogs', 'turtles'],
            });
            let result = query_obj.get_query_parser_string(query_obj);
            expect(result).toMatch('tag:"cats" OR tag:"dogs" OR tag:"turtles"');
        });

        it('should surround multiword tags in quotes', function () {
            let query_obj = new QueryObject.QueryObject({
                tags: ['cat zombies'],
            });
            let result = query_obj.get_query_parser_string(query_obj);
            expect(result).toMatch('tag:"cat zombies"');
        });

        it('contains blacklist clause when available', function () {
            Blacklist.blacklist['fake-blacklist-domain'] = ['foo', 'bar'];
            let query_obj = new QueryObject.QueryObject({
                domain: 'fake-blacklist-domain',
                query: 'tyrion wins',
            });
            let result = query_obj.get_query_parser_string(query_obj);
            expect(result).toMatch('NOT tag:"foo"');
            expect(result).toMatch('NOT tag:"bar"');
        });

        describe('id checking code', function () {
            it('validates a simple EKN ID', function () {
                let query_obj = new QueryObject.QueryObject({
                    domain: 'travel-es',
                    ids: ['ekn://travel-es/2e11617b6bce1e6d'],
                });
                expect(function () {
                    query_obj.get_query_parser_string(query_obj);
                }).not.toThrow();
            });

            it('validates an EKN ID with uppercase hex digits', function () {
                let query_obj = new QueryObject.QueryObject({
                    domain: 'travel-es',
                    ids: ['ekn://travel-es/2E11617B6BCE1E6D'],
                });
                expect(function () {
                    query_obj.get_query_parser_string(query_obj);
                }).not.toThrow();
            });

            it('rejects an EKN ID with an invalid hash', function () {
                let query_obj = new QueryObject.QueryObject({
                    domain: 'bad1',
                    ids: ['ekn://bad1/someha$h'],
                });
                expect(function () {
                    query_obj.get_query_parser_string(query_obj);
                }).toThrow();
            });

            it('rejects an EKN ID with the wrong URI scheme', function () {
                let query_obj = new QueryObject.QueryObject({
                    domain: 'bad1',
                    ids: ['bad1/2e11617b6bce1e6d'],
                });
                expect(function () {
                    query_obj.get_query_parser_string(query_obj);
                }).toThrow();
            });

            it('rejects an EKN ID with no hash', function () {
                let query_obj = new QueryObject.QueryObject({
                    domain: 'scuba-diving-es',
                    ids: ['ekn://scuba-diving-es'],
                });
                expect(function () {
                    query_obj.get_query_parser_string(query_obj);
                }).toThrow();
            });

            it('rejects an EKN ID with too many parts', function () {
                let query_obj = new QueryObject.QueryObject({
                    domain: 'travel-es',
                    ids: ['ekn://travel-es/2e11617b6bce1e6d/too/many/parts'],
                });
                expect(function () {
                    query_obj.get_query_parser_string(query_obj);
                }).toThrow();
            });

            it('rejects on an EKN ID domain mismatch', function () {
                let query_obj = new QueryObject.QueryObject({
                    domain: 'travel-es',
                    ids: ['ekn://animals-es/2e11617b6bce1e6d'],
                });
                expect(function () {
                    query_obj.get_query_parser_string(query_obj);
                }).toThrow();
            });
        });
    });
});
