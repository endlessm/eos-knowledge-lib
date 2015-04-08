const XapianQuery = imports.xapianQuery;

const ContainsMatcher = imports.ContainsMatcher;

describe('Xapian Query Module', function () {
    let xq;

    beforeEach(function () {
        jasmine.addMatchers(ContainsMatcher.customMatchers);
        xq = XapianQuery;
    });

    describe('xapian query', function () {
        it('should ignore excess whitespace (except for tags)', function () {
            let q = 'whoa      man';
            let delimited_result = xq.xapian_delimited_query_clause(q, false);
            expect(delimited_result).toContain('exact_title:Whoa_Man');
            expect(delimited_result).toContain('title:whoa');
            expect(delimited_result).toContain('title:man');

            let incremental_result = xq.xapian_incremental_query_clause(q, false);
            expect(incremental_result).toContain('exact_title:Whoa_Man');
            expect(incremental_result).toContain('title:whoa');
            expect(incremental_result).toContain('title:man');
        });

        it('should lowercase xapian operator terms', function () {
            let q = 'PENN AND tELLER';
            let delimited_result = xq.xapian_delimited_query_clause(q, false);
            expect(delimited_result).toContain('title:and');

            let incremental_result = xq.xapian_incremental_query_clause(q, false);
            expect(incremental_result).toContain('title:and');
        });

        it('should remove parentheses in user terms', function () {
            let q = 'foo (bar) baz ((';
            let delimited_result = xq.xapian_delimited_query_clause(q, false);
            expect(delimited_result).toContain('exact_title:Foo_Bar_Baz');

            let incremental_result = xq.xapian_incremental_query_clause(q, false);
            expect(incremental_result).toContain('exact_title:Foo_Bar_Baz');
        });

        it('should map sortBy strings to xapian values', function () {
            let result = xq.xapian_string_to_value_no('rank');
            expect(result).toBe(1);
            let undefined_result = xq.xapian_string_to_value_no('unsupportedXapianValue');
            expect(undefined_result).toBe(undefined);
        });

        describe('delimited query clauses', () => {
            it('are formed correctly', function () {
                let q = 'little search';
                let result = xq.xapian_delimited_query_clause(q, false);
                expect(result).toBe('(exact_title:Little_Search) OR (title:little AND title:search)');
            });

            it('contains terms without title prefix if match all is true', function () {
                let q = 'little search';
                let result = xq.xapian_delimited_query_clause(q, true);
                expect(result).toContain('little AND search');
            });

            it('has no term search for single character queries', function () {
                let q = 'a';
                let result = xq.xapian_delimited_query_clause(q, false);
                expect(result).toBe('exact_title:A');
            });
        });

        describe('incremental query clauses', () => {
            it('are formed correctly', function () {
                let q = 'littl searc';
                let result = xq.xapian_incremental_query_clause(q, false);
                expect(result).toBe('((exact_title:Littl_Searc OR exact_title:Littl_Searc*)) OR ((title:littl OR title:littl*) AND (title:searc OR title:searc*))');
            });

            it('contains terms without title prefix if match all is true', function () {
                let q = 'littl searc';
                let result = xq.xapian_incremental_query_clause(q, true);
                expect(result).toContain('(littl OR littl*) AND (searc OR searc*)');
            });

            it('has no term search for single character queries', function () {
                let q = 'a';
                let result = xq.xapian_incremental_query_clause(q, false);
                expect(result).toBe('exact_title:A');
            });
        });

        describe('tag clauses', () => {
            it('or together requested tags', function () {
                let tags = ['cats', 'dogs', 'turtles'];
                let result = xq.xapian_tag_clause(tags);
                expect(result).toBe('tag:"cats" OR tag:"dogs" OR tag:"turtles"');
            });

            it('can be negated', function () {
                let tags = ['stallman', 'sex', 'tape'];
                let result = xq.xapian_not_tag_clause(tags);
                expect(result).toBe('NOT tag:"stallman" AND NOT tag:"sex" AND NOT tag:"tape"');
            });

            it('should surround multiword tags in quotes', function () {
                let tags = ['cat zombies'];
                let result = xq.xapian_tag_clause(tags);
                expect(result).toBe('tag:"cat zombies"');
            });
        });

        describe('id clauses', () => {
            it('should support single id queries', function () {
                let result = xq.xapian_ids_clause(['ekn://domain/0123456789abcdef']);
                expect(result).toBe('id:0123456789abcdef');
            });

            it('should support multiple id queries', () => {
                let result = xq.xapian_ids_clause([
                    'ekn://domain/0123456789abcdef',
                    'ekn://domain/fedcba9876543210',
                ]);
                expect(result).toBe('id:0123456789abcdef OR id:fedcba9876543210');
            });

            it('should throw error if receives invalid ekn id', function () {
                let bad_ids = ['ekn://bad1/somehash', 'noEknScheme', 'ekn://noId', 'ekn://domain/badha$h',
                'ekn://api/too/many/parts', 'ekn://underscore_/id'];

                bad_ids.forEach(function (bad_id) {
                    expect(function(){ xq.xapian_ids_clause([bad_id])}).toThrow(new Error('Received invalid ekn uri ' + bad_id));
                });
            });

            it('should not throw error if receives valid ekn id', function () {
                let good_ids = ['ekn://travel-es/foo', 'ekn://mental-health-es/bar'];

                good_ids.forEach(function (good_id) {
                    expect(function(){ xq.xapian_ids_clause([good_id])}).not.toThrow(new Error('Received invalid ekn uri ' + good_id));
                });
            });
        });
    });
});
