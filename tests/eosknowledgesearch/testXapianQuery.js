const XapianQuery = imports.xapianQuery;


describe('Xapian Query Module', function () {
    let xq;

    beforeEach(function () {
        xq = XapianQuery;
    });

    describe('xapian query', function () {
        it('should ignore excess whitespace (except for tags)', function () {
            let q = 'whoa      man';
            let q_result = xq.xapian_query_clause(q);
            expect(q_result).toBe('(title:whoa OR title:man) OR (whoa man) OR (exact_title:Whoa_Man)');

            let prefix_result = xq.xapian_prefix_clause(q);
            expect(prefix_result).toBe('exact_title:Whoa_Man*');
        });

        it('should lowercase xapian operator terms in general query', function () {
            let q = 'PENN AND tELLER';
            let q_result = xq.xapian_query_clause(q);
            expect(q_result).toBe('(title:PENN OR title:and OR title:tELLER) OR (PENN and tELLER) OR (exact_title:Penn_And_Teller)');

            let prefix_result = xq.xapian_prefix_clause(q);
            expect(prefix_result).toBe('exact_title:Penn_And_Teller*');
        });

        it('should remove parentheses in user terms', function () {
            let q = 'foo (bar) baz ((';
            let q_result = xq.xapian_query_clause(q);
            expect(q_result).toBe('(title:foo OR title:bar OR title:baz) OR (foo bar baz) OR (exact_title:Foo_Bar_Baz)');

            let prefix_result = xq.xapian_prefix_clause(q);
            expect(prefix_result).toBe('exact_title:Foo_Bar_Baz*');
        });

        it('should support requests with tags', function () {
            let tags = ['cats', 'dogs', 'turtles'];
            let result = xq.xapian_tag_clause(tags);
            expect(result).toBe('tag:"cats" OR tag:"dogs" OR tag:"turtles"');
        });

        it('should support requests with NOT tags', function () {
            let tags = ['stallman', 'sex', 'tape'];
            let result = xq.xapian_not_tag_clause(tags);
            expect(result).toBe('NOT tag:"stallman" AND NOT tag:"sex" AND NOT tag:"tape"');
        });

        it('should support requests with querystring', function () {
            let q = 'little search';
            let result = xq.xapian_query_clause(q);
            expect(result).toBe('(title:little OR title:search) OR (little search) OR (exact_title:Little_Search)');
        });

        it('should support requests with prefix', function () {
            let q = 'Bar';
            let result = xq.xapian_prefix_clause(q);
            expect(result).toBe('exact_title:Bar*');
        });

        it('should surround multiword tags in quotes', function () {
            let tags = ['cat zombies'];
            let result = xq.xapian_tag_clause(tags);
            expect(result).toBe('tag:"cat zombies"');
        });

        it('should not add empty queries', function () {
            let q = 'a';
            let result = xq.xapian_query_clause(q);
            expect(result).toBe('(a) OR (exact_title:A)');
        });

        it('should not submit a prefix query for one letter queries', function () {
            let q = 'a';
            let result = xq.xapian_prefix_clause(q);
            expect(result).toBe('exact_title:A');
        });

        it('should map sortBy strings to xapian values', function () {
            let result = xq.xapian_string_to_value_no('rank');
            expect(result).toBe(1);
            let undefined_result = xq.xapian_string_to_value_no('unsupportedXapianValue');
            expect(undefined_result).toBe(undefined);
        });

        it('should support single id queries', function () {
            let result = xq.xapian_ids_clause(['ekn://domain/someId']);
            expect(result).toBe('id:someId');
        });

        it('should support multiple id queries', () => {
            let result = xq.xapian_ids_clause([
                'ekn://domain/someId',
                'ekn://domain/someOtherId',
            ]);
            expect(result).toBe('id:someId OR id:someOtherId');
        });

        it('should throw error if receives invalid ekn id', function () {
            let bad_ids = ['ekn://bad1/somehash', 'noEknScheme', 'ekn://noId', 'ekn://domain/badha$h',
            'ekn://api/too/many/parts', 'ekn://underscore_/id'];

            bad_ids.forEach(function (bad_id) {
                expect(function(){ xq.xapian_ids_clause([bad_id])}).toThrow(new Error('Received invalid ekn uri ' + bad_id));
            });
        });
    });
});
